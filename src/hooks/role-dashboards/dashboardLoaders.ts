import { moduleApi } from '@/api/client';
import { isToday } from '@/lib/dateHelpers';
import { explorerPath } from '@/lib/explorerLinks';
import { buildOverviewFallback, fetchOverviewSafe } from '@/lib/overviewFallback';
import { formatCurrency } from '@/lib/utils';
import type {
  DashboardActivity,
  DashboardAlert,
  DashboardKpi,
  DashboardQuickAction,
  DashboardWorkItem,
} from '@/components/dashboards/types';
import type { AlertItem, MissionControlOverview, ProjectHealthRow, TodaysWorkItem } from '@/components/mission-control/types';
import {
  AlertTriangle,
  Banknote,
  CheckCircle,
  ClipboardCheck,
  FileText,
  Fuel,
  HardHat,
  Package,
  Shield,
  Truck,
  Users,
  Wrench,
} from 'lucide-react';
import type { EChartsOption } from 'echarts';

export interface RoleDashboardPayload {
  kpis: DashboardKpi[];
  todaysWork: DashboardWorkItem[];
  decisions?: DashboardWorkItem[];
  alerts: DashboardAlert[];
  quickActions: DashboardQuickAction[];
  recentActivity: DashboardActivity[];
  chartOptions: EChartsOption[];
  table?: { headers: string[]; rows: string[][] };
  headerBadge?: string;
  companyName?: string;
}

const empty: RoleDashboardPayload = {
  kpis: [],
  todaysWork: [],
  alerts: [],
  quickActions: [],
  recentActivity: [],
  chartOptions: [],
};

const emptyExecutiveSummary = {
  activeProjects: 0,
  delayedProjects: 0,
  activeEquipment: 0,
  equipmentUnderMaintenance: 0,
  pendingPurchaseRequisitions: 0,
  pendingRfqs: 0,
  pendingPurchaseOrders: 0,
  lowStockMaterials: 0,
  openIssues: 0,
  openBreakdowns: 0,
  totalBudget: 0,
  totalSpent: 0,
  budgetUtilization: 0,
  links: {} as Record<string, string>,
};

function summaryFrom(mc: Partial<MissionControlOverview>) {
  return { ...emptyExecutiveSummary, ...mc.executiveSummary };
}

export async function loadExecutiveDashboard(): Promise<RoleDashboardPayload> {
  const [mcRaw, healthRes] = await Promise.all([
    fetchOverviewSafe(),
    moduleApi.business.financialHealth().catch(() => ({ data: null })),
  ]);
  const mc = mcRaw ?? (await buildOverviewFallback());
  const summary = summaryFrom(mc);
  const health = healthRes.data ?? {};
  const safety = mc.safety;
  const quality = mc.quality;
  const workforce = mc.workforce;

  const companyHealth = Math.round(
    (mc.projectHealth?.reduce((a: number, p: ProjectHealthRow) => a + p.healthScore, 0) ?? 0) /
      Math.max(mc.projectHealth?.length ?? 1, 1),
  );

  const kpis: DashboardKpi[] = [
    { label: 'Revenue', value: formatCurrency(health.revenue ?? health.totalRevenue ?? 0), color: '#22C55E' },
    { label: 'Cash Position', value: formatCurrency(health.cashPosition ?? health.cashBalance ?? 0), color: '#3B82F6' },
    { label: 'Projects Running', value: summary.activeProjects, color: '#8B5CF6' },
    { label: 'Projects Delayed', value: summary.delayedProjects, color: '#EF4444' },
    { label: 'Budget Utilization', value: `${summary.budgetUtilization ?? 0}%`, color: '#F97316' },
    { label: 'Profit Margin', value: health.profitMargin != null ? `${health.profitMargin}%` : '—', color: '#EAB308' },
    { label: 'Equipment Utilization', value: `${mc.assetHealth?.avgUtilization ?? mc.assetHealth?.utilization ?? 0}%`, color: '#06B6D4' },
    { label: 'Safety Score', value: safety?.safetyScore ?? '—', color: '#EF4444' },
    { label: 'Quality Score', value: quality?.qualityScore ?? '—', color: '#14B8A6' },
    { label: 'Compliance', value: mc.compliancePlus?.expiringSoon ?? 0, sublabel: 'expiring soon', color: '#6366F1' },
    { label: 'Workforce Today', value: workforce?.attendancePresent ?? workforce?.peopleOnSite ?? 0, color: '#A855F7' },
    { label: 'Critical Risks', value: mc.operationalIntelligence?.criticalRecommendations ?? mc.alerts?.length ?? 0, color: '#DC2626' },
  ];

  const decisions: DashboardWorkItem[] = (mc.executiveDecisions?.items ?? []).map((d: {
    id: string;
    label: string;
    detail?: string;
    priority: string;
    link: string;
    amount?: number;
  }) => ({
    id: d.id,
    label: d.label,
    detail: d.detail ?? (d.amount ? formatCurrency(d.amount) : undefined),
    status: d.priority,
    href: d.link,
  }));

  const alerts: DashboardAlert[] = (mc.alerts ?? []).slice(0, 6).map((a: AlertItem, i: number) => ({
    id: `alert-${i}`,
    severity: a.priority === 'critical' ? 'critical' : a.priority === 'high' ? 'warning' : 'info',
    title: a.title,
    message: a.message,
    href: a.link,
  }));

  const quickActions: DashboardQuickAction[] = [
    { label: 'Review PR Approvals', href: '/procurement', desc: 'Approve only' },
    { label: 'Payment Approvals', href: '/business/payments', desc: 'Approve only' },
    { label: 'Executive Brief', href: '/insights?tab=brief', desc: 'Drill down' },
    { label: 'Project Health', href: '/projects', desc: 'Drill down' },
  ];

  const chartOptions: EChartsOption[] = [
    {
      title: { text: 'Budget vs Spent', textStyle: { color: '#94a3b8', fontSize: 12 } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['Budget', 'Spent'], axisLabel: { color: '#64748b' } },
      yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#1e293b' } } },
      series: [{ type: 'bar', data: [summary.totalBudget, summary.totalSpent], itemStyle: { color: '#F97316' } }],
      grid: { left: 60, right: 20, bottom: 30, top: 40 },
    },
    {
      title: { text: 'Project Health', textStyle: { color: '#94a3b8', fontSize: 12 } },
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: (mc.projectHealth ?? []).slice(0, 5).map((p: ProjectHealthRow) => ({ name: p.code || p.name, value: p.healthScore })),
        label: { color: '#94a3b8' },
      }],
    },
  ];

  return {
    kpis,
    decisions,
    todaysWork: [],
    alerts,
    quickActions,
    recentActivity: [],
    chartOptions,
    headerBadge: `${companyHealth || 91}%`,
    companyName: mc.organizationSelector?.activeOrganizationName,
  };
}

export async function loadCooDashboard(): Promise<RoleDashboardPayload> {
  const mcRaw = await fetchOverviewSafe();
  const mc = mcRaw ?? (await buildOverviewFallback());
  const summary = summaryFrom(mc);

  const kpis: DashboardKpi[] = [
    { label: "Today's Work", value: mc.todaysWork?.length ?? 0, color: '#8B5CF6' },
    { label: 'Milestones', value: mc.projectHealth?.reduce((a: number, p: ProjectHealthRow) => a + p.delayedMilestones, 0) ?? 0, sublabel: 'delayed', color: '#EF4444' },
    { label: 'Delayed Tasks', value: summary.openIssues, color: '#F97316' },
    { label: 'Pending Approvals', value: summary.pendingPurchaseRequisitions + summary.pendingPurchaseOrders, color: '#EAB308' },
    { label: 'Equipment Available', value: summary.activeEquipment - summary.equipmentUnderMaintenance, color: '#06B6D4' },
    { label: 'Material Delays', value: mc.supplyChainHealth?.delayedDeliveries ?? summary.lowStockMaterials, color: '#22C55E' },
    { label: 'Teams Working', value: mc.workforce?.peopleOnSite ?? 0, color: '#A855F7' },
    { label: 'Site Progress', value: `${Math.round(mc.projectHealth?.[0]?.progress ?? 0)}%`, color: '#3B82F6' },
  ];

  const todaysWork: DashboardWorkItem[] = (mc.todaysWork ?? []).map((w: TodaysWorkItem, i: number) => ({
    id: `work-${i}`,
    label: w.label,
    status: w.priority,
    href: w.link,
  }));

  const quickActions: DashboardQuickAction[] = [
    { label: 'Assign Resources', href: '/workforce?tab=allocations', icon: Users },
    { label: 'Approve MR', href: '/projects', icon: CheckCircle },
    { label: 'Escalate Issue', href: '/projects', icon: AlertTriangle },
    { label: 'Move Equipment', href: '/equipment', icon: Truck },
    { label: 'Open Project', href: '/projects', icon: FileText },
  ];

  return {
    kpis,
    todaysWork,
    alerts: (mc.alerts ?? []).slice(0, 4).map((a: AlertItem, i: number) => ({
      id: `coo-alert-${i}`,
      severity: a.priority === 'critical' ? 'critical' : 'warning',
      title: a.title,
      message: a.message,
      href: a.link,
    })),
    quickActions,
    recentActivity: [],
    chartOptions: [],
  };
}

export async function loadProjectManagerDashboard(): Promise<RoleDashboardPayload> {
  const projectsRes = await moduleApi.projects.list('active');
  const projects = projectsRes.data ?? [];
  const project = projects[0];
  const projectId = project?._id;

  if (!projectId) {
    return {
      ...empty,
      alerts: [{ id: 'no-project', severity: 'info', title: 'No active project', href: '/projects' }],
      quickActions: [{ label: 'Open Projects', href: '/projects', icon: FileText }],
    };
  }

  const [dash, issuesRes, mrsRes, reportsRes, milestonesRes, boqRes] = await Promise.all([
    moduleApi.projects.dashboard(projectId),
    moduleApi.projects.issues(projectId),
    moduleApi.projects.materialRequirements(projectId),
    moduleApi.projects.dailyReports(projectId),
    moduleApi.projects.milestones(projectId),
    moduleApi.projects.boq(projectId),
  ]);

  const dashData = dash.data ?? {};
  const issues = issuesRes.data ?? [];
  const mrs = mrsRes.data ?? [];
  const reports = reportsRes.data ?? [];
  const milestones = milestonesRes.data ?? [];
  const boq = boqRes.data ?? [];

  const openIssues = issues.filter((i: { status?: string }) => !['resolved', 'closed'].includes(i.status ?? ''));
  const pendingPr = mrs.filter((m: { status?: string }) => ['draft', 'pending', 'submitted'].includes(m.status ?? ''));
  const delayedMilestones = milestones.filter((m: { status?: string }) => m.status === 'delayed');

  const kpis: DashboardKpi[] = [
    { label: "Today's Work", value: (dashData.todaysTasks ?? []).length, color: '#3B82F6' },
    { label: 'Projects', value: projects.length, color: '#8B5CF6' },
    { label: 'Milestones', value: delayedMilestones.length, sublabel: 'delayed', color: '#EF4444' },
    { label: 'BOQ Lines', value: boq.length, color: '#22C55E' },
    { label: 'Pending PR', value: pendingPr.length, color: '#F97316' },
    { label: 'Open Issues', value: openIssues.length, color: '#DC2626' },
  ];

  const todaysWork: DashboardWorkItem[] = [
    ...(dashData.todaysTasks ?? []).slice(0, 3).map((t: string, i: number) => ({
      id: `task-${i}`,
      label: t,
      href: `/projects/${projectId}`,
    })),
    ...pendingPr.slice(0, 2).map((m: { _id: string; mrNumber?: string; status?: string }) => ({
      id: m._id,
      label: `PR ${m.mrNumber ?? m._id.slice(-6)}`,
      status: m.status,
      href: '/procurement',
    })),
    ...openIssues.slice(0, 2).map((i: { _id: string; title?: string; status?: string }) => ({
      id: i._id,
      label: i.title ?? 'Issue',
      status: i.status,
      href: `/projects/${projectId}`,
    })),
    ...(reports.some((r: { reportDate?: string }) => isToday(r.reportDate))
      ? []
      : [{ id: 'report', label: 'Daily report not submitted', status: 'pending', href: `/projects/${projectId}` }]),
  ];

  const quickActions: DashboardQuickAction[] = [
    { label: 'Create Daily Report', href: `/projects/${projectId}`, icon: FileText },
    { label: 'Upload Drawings', href: '/business/documents', icon: ClipboardCheck },
    { label: 'Raise PR', href: '/procurement', icon: Package },
    { label: 'Create Issue', href: `/projects/${projectId}`, icon: AlertTriangle },
    { label: 'Allocate Engineer', href: '/workforce?tab=allocations', icon: Users },
  ];

  return { kpis, todaysWork, alerts: [], quickActions, recentActivity: [], chartOptions: [] };
}

export async function loadProcurementDashboard(): Promise<RoleDashboardPayload> {
  const [statsRes, prsRes, rfqsRes, posRes] = await Promise.all([
    moduleApi.procurement.stats(),
    moduleApi.procurement.prs(),
    moduleApi.procurement.rfqs(),
    moduleApi.procurement.pos(),
  ]);

  const stats = statsRes.data ?? {};
  const prs = prsRes.data ?? [];
  const rfqs = rfqsRes.data ?? [];
  const pos = posRes.data ?? [];

  const pendingPr = prs.filter((p: { status?: string }) => ['submitted', 'pending_approval', 'draft'].includes(p.status ?? ''));
  const expiringRfq = rfqs.filter((r: { status?: string; closingDate?: string }) => r.status === 'published');
  const pendingPo = pos.filter((p: { status?: string }) => ['draft', 'pending_approval'].includes(p.status ?? ''));

  const kpis: DashboardKpi[] = [
    { label: 'Pending PR', value: stats.pendingPRs ?? pendingPr.length, color: '#22C55E' },
    { label: 'Active RFQ', value: stats.activeRFQs ?? expiringRfq.length, color: '#3B82F6' },
    { label: 'Vendor Quotes', value: stats.pendingQuotations ?? 0, color: '#8B5CF6' },
    { label: 'PO Waiting', value: pendingPo.length, color: '#F97316' },
    { label: 'Awards Pending', value: stats.awardsPending ?? 0, color: '#EAB308' },
    { label: 'Delivery Tracking', value: stats.inTransitPOs ?? 0, color: '#06B6D4' },
  ];

  const todaysWork: DashboardWorkItem[] = [
    ...pendingPr.slice(0, 4).map((p: { _id: string; prNumber?: string; status?: string; estimatedAmount?: number }) => ({
      id: p._id,
      label: `${p.prNumber ?? 'PR'} awaiting review`,
      detail: p.estimatedAmount ? formatCurrency(p.estimatedAmount) : undefined,
      status: p.status,
      href: `/explore/purchase-request/by-number/${encodeURIComponent(p.prNumber ?? p._id)}`,
    })),
    ...expiringRfq.slice(0, 2).map((r: { _id: string; rfqNumber?: string; closingDate?: string }) => ({
      id: r._id,
      label: `RFQ ${r.rfqNumber ?? ''} expiring`,
      detail: r.closingDate,
      href: '/procurement',
    })),
    ...pendingPo.slice(0, 2).map((p: { _id: string; poNumber?: string }) => ({
      id: p._id,
      label: `PO ${p.poNumber ?? ''} waiting for issue`,
      href: '/procurement',
    })),
  ];

  const quickActions: DashboardQuickAction[] = [
    { label: 'Review PR', href: '/procurement', icon: FileText },
    { label: 'Create RFQ', href: '/procurement', icon: ClipboardCheck },
    { label: 'Compare Quotes', href: '/procurement', icon: Package },
    { label: 'Issue PO', href: '/procurement', icon: CheckCircle },
    { label: 'Track Delivery', href: '/supply-chain', icon: Truck },
  ];

  return { kpis, todaysWork, alerts: [], quickActions, recentActivity: [], chartOptions: [] };
}

export async function loadEquipmentDashboard(): Promise<RoleDashboardPayload> {
  const [eqRes, maintRes] = await Promise.all([
    moduleApi.equipment.list(),
    moduleApi.maintenance.workOrders(),
  ]);

  const equipment = eqRes.data ?? [];
  const workOrders = maintRes.data ?? [];
  const running = equipment.filter((e: { status?: string }) => e.status === 'active' || e.status === 'in_use');
  const idle = equipment.filter((e: { status?: string }) => e.status === 'idle' || e.status === 'available');
  const maintDue = workOrders.filter((w: { type?: string; status?: string }) => w.type === 'preventive' && w.status !== 'completed');

  const kpis: DashboardKpi[] = [
    { label: 'Machines Running', value: running.length, color: '#22C55E' },
    { label: 'Idle', value: idle.length, color: '#94A3B8' },
    { label: 'Maintenance Due', value: maintDue.length, color: '#F97316' },
    { label: 'Fuel Alerts', value: equipment.filter((e: { fuelLevel?: number }) => (e.fuelLevel ?? 100) < 20).length, color: '#EAB308' },
    { label: 'Utilization', value: `${Math.round((running.length / Math.max(equipment.length, 1)) * 100)}%`, color: '#06B6D4' },
    { label: 'Breakdowns', value: workOrders.filter((w: { type?: string }) => w.type === 'breakdown').length, color: '#EF4444' },
  ];

  const todaysWork: DashboardWorkItem[] = idle.slice(0, 3).map((e: { _id: string; name?: string; assetTag?: string }) => ({
    id: e._id,
    label: `${e.name ?? e.assetTag ?? 'Equipment'} idle — assign`,
    href: explorerPath('equipment', e._id),
  }));

  const quickActions: DashboardQuickAction[] = [
    { label: 'Assign', href: '/equipment', icon: Truck },
    { label: 'Fuel Log', href: '/equipment', icon: Fuel },
    { label: 'Transfer', href: '/equipment', icon: Package },
    { label: 'Log Hours', href: '/equipment', icon: ClipboardCheck },
    { label: 'Maintenance', href: '/maintenance', icon: Wrench },
  ];

  return { kpis, todaysWork, alerts: [], quickActions, recentActivity: [], chartOptions: [] };
}

export async function loadFinanceDashboard(): Promise<RoleDashboardPayload> {
  const [dashRes, healthRes, billsRes] = await Promise.all([
    moduleApi.business.dashboard(),
    moduleApi.business.financialHealth(),
    moduleApi.business.vendorBills.list({ status: 'pending_approval' }),
  ]);

  const dash = dashRes.data ?? {};
  const health = healthRes.data ?? {};
  const bills = billsRes.data ?? [];

  const kpis: DashboardKpi[] = [
    { label: 'Budget', value: formatCurrency(dash.totalBudget ?? health.totalBudget ?? 0), color: '#EAB308' },
    { label: 'Committed', value: formatCurrency(dash.committed ?? health.committed ?? 0), color: '#8B5CF6' },
    { label: 'Actual', value: formatCurrency(dash.totalSpent ?? health.totalSpent ?? 0), color: '#F97316' },
    { label: 'Cash Flow', value: formatCurrency(health.cashFlow ?? health.netCashFlow ?? 0), color: '#22C55E' },
    { label: 'Payments Due', value: bills.length, color: '#EF4444' },
    { label: 'Receivables', value: formatCurrency(health.receivables ?? 0), color: '#3B82F6' },
    { label: 'Payables', value: formatCurrency(health.payables ?? 0), color: '#DC2626' },
  ];

  const todaysWork: DashboardWorkItem[] = [
    ...bills.slice(0, 4).map((b: { _id: string; billNumber?: string; amount?: number; vendorName?: string }) => ({
      id: b._id,
      label: `Bill ${b.billNumber ?? ''} — ${b.vendorName ?? 'Vendor'}`,
      detail: b.amount ? formatCurrency(b.amount) : undefined,
      href: '/business/vendor-bills',
    })),
    { id: 'payments', label: `${bills.length} payment approvals pending`, href: '/business/payments' },
  ];

  const quickActions: DashboardQuickAction[] = [
    { label: 'Approve Bill', href: '/business/vendor-bills', icon: CheckCircle },
    { label: 'Schedule Payment', href: '/business/payments', icon: Banknote },
    { label: 'Pay Vendor', href: '/business/payments', icon: Banknote },
    { label: 'Budget Review', href: '/business', icon: FileText },
  ];

  const chartOptions: EChartsOption[] = [{
    title: { text: 'Budget vs Actual', textStyle: { color: '#94a3b8', fontSize: 12 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Budget', 'Actual'], axisLabel: { color: '#64748b' } },
    yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#1e293b' } } },
    series: [{ type: 'bar', data: [dash.totalBudget ?? 0, dash.totalSpent ?? 0], itemStyle: { color: '#EAB308' } }],
    grid: { left: 60, right: 20, bottom: 30, top: 40 },
  }];

  return { kpis, todaysWork, alerts: [], quickActions, recentActivity: [], chartOptions };
}

export async function loadSafetyDashboard(): Promise<RoleDashboardPayload> {
  const dashRes = await moduleApi.workforce.safety.dashboard();
  const dash = dashRes.data ?? {};

  const kpis: DashboardKpi[] = [
    { label: "Today's Toolbox", value: dash.toolboxTalksToday ?? 0, color: '#EF4444' },
    { label: 'Incidents', value: dash.activeIncidents ?? dash.openIncidents ?? 0, color: '#DC2626' },
    { label: 'Near Miss', value: dash.openNearMiss ?? 0, color: '#F97316' },
    { label: 'PPE Compliance', value: `${dash.ppeCompliance ?? 0}%`, color: '#EAB308' },
    { label: 'Permits Active', value: dash.activePermits ?? 0, color: '#8B5CF6' },
    { label: 'High Risk Work', value: dash.highRiskWork ?? 0, color: '#B91C1C' },
  ];

  const todaysWork: DashboardWorkItem[] = (dash.alerts ?? []).slice(0, 6).map((a: { id?: string; title?: string; message?: string; link?: string }, i: number) => ({
    id: a.id ?? `safety-${i}`,
    label: a.title ?? a.message ?? 'Safety item',
    href: a.link ?? '/workforce?tab=safety',
  }));

  const quickActions: DashboardQuickAction[] = [
    { label: 'Issue PPE', href: '/workforce?tab=safety', icon: HardHat },
    { label: 'Permit', href: '/workforce?tab=permits', icon: Shield },
    { label: 'Report Incident', href: '/workforce?tab=safety', icon: AlertTriangle },
    { label: 'Observation', href: '/workforce?tab=safety', icon: ClipboardCheck },
  ];

  return { kpis, todaysWork, alerts: [], quickActions, recentActivity: [], chartOptions: [] };
}

export async function loadQualityDashboard(): Promise<RoleDashboardPayload> {
  const dashRes = await moduleApi.workforce.quality.dashboard();
  const dash = dashRes.data ?? {};

  const kpis: DashboardKpi[] = [
    { label: 'Inspection Due', value: dash.pendingInspections ?? 0, color: '#14B8A6' },
    { label: 'Material Tests', value: dash.pendingTests ?? dash.failedTests ?? 0, color: '#3B82F6' },
    { label: 'Open NCR', value: dash.openNcr ?? 0, color: '#EF4444' },
    { label: 'CAPA Pending', value: dash.capaPending ?? 0, color: '#F97316' },
    { label: 'Quality Score', value: dash.qualityScore ?? '—', color: '#22C55E' },
  ];

  const todaysWork: DashboardWorkItem[] = (dash.alerts ?? []).slice(0, 6).map((a: { id?: string; title?: string; link?: string }, i: number) => ({
    id: a.id ?? `quality-${i}`,
    label: a.title ?? 'Quality item',
    href: a.link ?? '/workforce?tab=quality',
  }));

  const quickActions: DashboardQuickAction[] = [
    { label: 'Inspection', href: '/workforce?tab=quality', icon: ClipboardCheck },
    { label: 'Material Test', href: '/workforce?tab=quality', icon: Package },
    { label: 'Raise NCR', href: '/workforce?tab=quality', icon: AlertTriangle },
    { label: 'Close CAPA', href: '/workforce?tab=quality', icon: CheckCircle },
  ];

  return { kpis, todaysWork, alerts: [], quickActions, recentActivity: [], chartOptions: [] };
}

export async function loadHrDashboard(): Promise<RoleDashboardPayload> {
  const dashRes = await moduleApi.workforce.dashboard();
  const dash = dashRes.data ?? {};

  const kpis: DashboardKpi[] = [
    { label: 'Attendance', value: `${dash.presentToday ?? 0}/${dash.totalEmployees ?? 0}`, color: '#A855F7' },
    { label: 'Productivity', value: dash.productivityScore != null ? `${dash.productivityScore}%` : '—', color: '#22C55E' },
    { label: 'Training Due', value: dash.trainingDue ?? 0, color: '#3B82F6' },
    { label: 'Certifications', value: dash.certificationsExpiring ?? 0, sublabel: 'expiring', color: '#F97316' },
    { label: 'Skills Gaps', value: dash.skillGaps ?? 0, color: '#EF4444' },
    { label: 'Allocations', value: dash.activeAllocations ?? 0, color: '#06B6D4' },
  ];

  const todaysWork: DashboardWorkItem[] = [
  ...(dash.pendingAllocations ?? []).slice(0, 3).map((a: { id: string; label: string }, i: number) => ({
    id: a.id ?? `alloc-${i}`,
    label: a.label,
    href: '/workforce?tab=allocations',
  })),
  ];

  const quickActions: DashboardQuickAction[] = [
    { label: 'Create Employee', href: '/workforce?tab=employees', icon: Users },
    { label: 'Assign Training', href: '/workforce?tab=training', icon: ClipboardCheck },
    { label: 'Allocate Crew', href: '/workforce?tab=allocations', icon: Users },
  ];

  return { kpis, todaysWork, alerts: [], quickActions, recentActivity: [], chartOptions: [] };
}

export async function loadSupervisorDashboard(): Promise<RoleDashboardPayload> {
  const dashRes = await moduleApi.workforce.dashboard();
  const dash = dashRes.data ?? {};

  const kpis: DashboardKpi[] = [
    { label: 'Crew On Site', value: dash.presentToday ?? 0, color: '#06B6D4' },
    { label: 'Tasks Today', value: dash.tasksToday ?? dash.openTasks ?? 0, color: '#3B82F6' },
    { label: 'Equipment', value: dash.equipmentOnSite ?? 0, color: '#EAB308' },
    { label: 'Material Pending', value: dash.pendingMaterial ?? 0, color: '#22C55E' },
    { label: 'Open Issues', value: dash.openIssues ?? 0, color: '#EF4444' },
  ];

  const todaysWork: DashboardWorkItem[] = (dash.todaysWork ?? []).slice(0, 6).map((w: { id?: string; label: string; href?: string }, i: number) => ({
    id: w.id ?? `sup-${i}`,
    label: w.label,
    href: w.href ?? '/workforce',
  }));

  const quickActions: DashboardQuickAction[] = [
    { label: 'Approve Attendance', href: '/workforce?tab=attendance', icon: CheckCircle },
    { label: 'Assign Work', href: '/workforce?tab=allocations', icon: Users },
    { label: 'Report Issue', href: '/projects', icon: AlertTriangle },
  ];

  return { kpis, todaysWork, alerts: [], quickActions, recentActivity: [], chartOptions: [] };
}

export async function loadContractorSupervisorDashboard(): Promise<RoleDashboardPayload> {
  const [dashRes, attRes] = await Promise.all([
    moduleApi.workforce.dashboard(),
    moduleApi.workforce.attendance(),
  ]);

  const dash = dashRes.data ?? {};
  const attendance = attRes.data ?? [];
  const todayAtt = attendance.filter((a: { checkInAt?: string; date?: string }) => isToday(a.checkInAt || a.date));

  const kpis: DashboardKpi[] = [
    { label: 'Attendance', value: `${todayAtt.length}/${dash.contractorHeadcount ?? todayAtt.length}`, color: '#64748B' },
    { label: "Today's Work", value: dash.tasksToday ?? 0, color: '#3B82F6' },
    { label: 'Output', value: dash.outputToday ?? '—', color: '#22C55E' },
    { label: 'Material', value: dash.pendingMaterial ?? 0, color: '#F97316' },
    { label: 'Equipment', value: dash.equipmentOnSite ?? 0, color: '#EAB308' },
  ];

  const todaysWork: DashboardWorkItem[] = (dash.todaysWork ?? []).slice(0, 6).map((w: { id?: string; label: string; href?: string }, i: number) => ({
    id: w.id ?? `contractor-${i}`,
    label: w.label,
    href: w.href ?? '/workforce?tab=attendance',
  }));

  const quickActions: DashboardQuickAction[] = [
    { label: 'Check In Crew', href: '/workforce?tab=attendance', icon: CheckCircle },
    { label: 'Log Output', href: '/workforce?tab=productivity', icon: ClipboardCheck },
    { label: 'Request Material', href: '/workforce', icon: Package },
  ];

  return { kpis, todaysWork, alerts: [], quickActions, recentActivity: [], chartOptions: [] };
}

export async function loadOrgAdminDashboard(): Promise<RoleDashboardPayload> {
  const [usersRes, auditRes, settingsRes] = await Promise.all([
    moduleApi.admin.users().catch(() => ({ data: [] })),
    moduleApi.admin.audit({ limit: 10 }).catch(() => ({ data: [] })),
    moduleApi.admin.settings().catch(() => ({ data: null })),
  ]);

  const users = usersRes.data ?? [];
  const audit = auditRes.data ?? [];
  const settings = settingsRes.data ?? {};

  const kpis: DashboardKpi[] = [
    { label: 'Users', value: users.length, color: '#94A3B8' },
    { label: 'Roles', value: settings.roleCount ?? 17, color: '#8B5CF6' },
    { label: 'Pending Invites', value: settings.pendingInvites ?? 0, color: '#F97316' },
    { label: 'Audit Events', value: audit.length, color: '#3B82F6' },
    { label: 'Storage Used', value: settings.storageUsed ?? '—', color: '#22C55E' },
    { label: 'License', value: settings.licenseStatus ?? 'Active', color: '#EAB308' },
  ];

  const todaysWork: DashboardWorkItem[] = audit.slice(0, 5).map((e: { _id: string; action?: string; entityType?: string }, i: number) => ({
    id: e._id ?? `audit-${i}`,
    label: `${e.action ?? 'Event'} — ${e.entityType ?? 'system'}`,
    href: '/admin',
  }));

  const quickActions: DashboardQuickAction[] = [
    { label: 'Manage Users', href: '/admin', icon: Users },
    { label: 'Roles & Permissions', href: '/admin', icon: Shield },
    { label: 'Audit Log', href: '/admin', icon: ClipboardCheck },
    { label: 'Settings', href: '/admin', icon: FileText },
  ];

  return { kpis, todaysWork, alerts: [], quickActions, recentActivity: [], chartOptions: [] };
}

export async function loadPlatformAdminDashboard(): Promise<RoleDashboardPayload> {
  const [adminDashRes, auditRes] = await Promise.all([
    moduleApi.admin.dashboard().catch(() => ({ data: null })),
    moduleApi.admin.audit({ limit: 10 }).catch(() => ({ data: [] })),
  ]);

  const dash = adminDashRes.data;
  const org = dash?.organization ?? {};
  const users = dash?.users ?? {};
  const audit = auditRes.data ?? [];

  const kpis: DashboardKpi[] = [
    { label: 'Organizations', value: org.total ?? 0, color: '#94A3B8' },
    { label: 'Active Orgs', value: org.active ?? 0, color: '#22C55E' },
    { label: 'Total Users', value: users.total ?? 0, color: '#3B82F6' },
    { label: 'Online Now', value: users.online ?? 0, color: '#8B5CF6' },
    { label: 'Pending Invites', value: users.pendingInvitations ?? 0, color: '#F97316' },
    { label: 'Locked Users', value: users.locked ?? 0, color: '#EF4444' },
  ];

  const todaysWork: DashboardWorkItem[] = audit.slice(0, 5).map((e: { _id: string; action?: string; entityType?: string }, i: number) => ({
    id: e._id ?? `audit-${i}`,
    label: `${e.action ?? 'Event'} — ${e.entityType ?? 'system'}`,
    href: '/admin?tab=audit',
  }));

  const quickActions: DashboardQuickAction[] = [
    { label: 'Organizations', href: '/admin?tab=organizations', icon: Users },
    { label: 'Manage Users', href: '/admin?tab=users', icon: Users },
    { label: 'Roles & Permissions', href: '/admin?tab=roles', icon: Shield },
    { label: 'Audit Log', href: '/admin?tab=audit', icon: ClipboardCheck },
  ];

  return { kpis, todaysWork, alerts: [], quickActions, recentActivity: [], chartOptions: [] };
}
