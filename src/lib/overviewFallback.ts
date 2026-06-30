import { missionControlApi, moduleApi } from '@/api/client';
import type { ExecutivePersona, MissionControlOverview, MissionControlSection } from '@/components/mission-control/types';

const DEFAULT_SECTIONS: MissionControlSection[] = [
  'executiveDecisions',
  'executiveSummary',
  'financialHealth',
  'pipeline',
  'todaysWork',
  'activity',
  'alerts',
  'projectHealth',
  'assetHealth',
  'supplyChainHealth',
  'notifications',
];

function resolvePersona(role?: string): ExecutivePersona {
  if (role === 'coo') return 'coo';
  if (role === 'org_admin') return 'org_admin';
  if (role === 'project_manager' || role === 'project_director') return 'project_director';
  return 'ceo';
}

/** Fetch overview; returns null on failure (no throw). */
export async function fetchOverviewSafe(): Promise<MissionControlOverview | null> {
  try {
    const res = await missionControlApi.overview();
    return res.data ?? null;
  } catch {
    return null;
  }
}

/** Rebuild overview KPIs from granular module endpoints when /mission-control/overview fails. */
export async function buildOverviewFallback(): Promise<Partial<MissionControlOverview>> {
  const [projectStats, procStats, equipStats, maintStats, scDash, safetyDash, qualityDash, workforceDash, todayWork, finHealth, notifRes] =
    await Promise.all([
      moduleApi.projects.stats().catch(() => ({ data: {} })),
      moduleApi.procurement.stats().catch(() => ({ data: {} })),
      moduleApi.equipment.stats().catch(() => ({ data: {} })),
      moduleApi.maintenance.stats().catch(() => ({ data: {} })),
      moduleApi.supplyChain.dashboard().catch(() => ({ data: { kpis: {} } })),
      moduleApi.workforce.safety.dashboard().catch(() => ({ data: {} })),
      moduleApi.workforce.quality.dashboard().catch(() => ({ data: {} })),
      moduleApi.workforce.dashboard().catch(() => ({ data: {} })),
      missionControlApi.todayWork().catch(() => ({ data: null })),
      moduleApi.business.financialHealth().catch(() => ({ data: null })),
      moduleApi.notifications.list().catch(() => ({ data: [] })),
    ]);

  const p = projectStats.data ?? {};
  const pr = procStats.data ?? {};
  const eq = equipStats.data ?? {};
  const mt = maintStats.data ?? {};
  const sc = scDash.data?.kpis ?? {};

  const decisions = todayWork.data?.items?.map(
    (item: { id?: string; label: string; detail?: string; priority: string; link: string; category: string }, i: number) => ({
      id: item.id ?? `tw-${i}`,
      label: item.label,
      detail: item.detail,
      priority: item.priority,
      link: item.link,
      category: item.category,
    }),
  );

  return {
    executiveSummary: {
      activeProjects: p.active ?? 0,
      delayedProjects: p.delayed ?? 0,
      activeEquipment: eq.running ?? eq.active ?? 0,
      equipmentUnderMaintenance: eq.inMaintenance ?? 0,
      pendingPurchaseRequisitions: pr.pendingPRs ?? pr.pendingApproval ?? 0,
      pendingRfqs: pr.openRfqs ?? pr.openRfq ?? 0,
      pendingPurchaseOrders: pr.poAwaiting ?? 0,
      lowStockMaterials: sc.lowStock ?? 0,
      openIssues: p.openIssues ?? 0,
      openBreakdowns: mt.breakdowns ?? 0,
      totalBudget: p.totalBudget ?? 0,
      totalSpent: p.totalSpent ?? 0,
      budgetUtilization: p.totalBudget ? Math.round(((p.totalSpent ?? 0) / p.totalBudget) * 100) : 0,
      links: {},
    },
    executiveDecisions: decisions?.length
      ? {
          title: todayWork.data?.title ?? 'Decisions Today',
          subtitle: '',
          items: decisions,
          estimatedMinutes: todayWork.data?.estimatedMinutes ?? 0,
        }
      : undefined,
    todaysWork: (todayWork.data?.items ?? []).map((w: { category: string; label: string; link: string; priority: string }) => ({
      type: w.category,
      label: w.label,
      link: w.link,
      priority: w.priority,
    })),
    assetHealth: { avgUtilization: eq.avgUtilization ?? 0 },
    safety: safetyDash.data,
    quality: qualityDash.data,
    workforce: workforceDash.data,
    supplyChainHealth: {
      openPR: sc.pendingPR,
      openRFQ: sc.openRfq,
      pendingPO: sc.poAwaitingApproval,
      todayGrn: sc.todayGrn,
      lowStock: sc.lowStock,
    },
    projectHealth: [],
    alerts: [],
    pipeline: [],
    activity: [],
    financialHealth: finHealth.data ?? undefined,
    notifications: {
      items: (notifRes.data ?? []).slice(0, 30),
      unreadCount: (notifRes.data ?? []).filter((n: { read?: boolean }) => !n.read).length,
    },
  };
}

/** Normalize partial overview into a render-safe MissionControlOverview. */
export function toMissionControlOverview(
  partial: Partial<MissionControlOverview>,
  role?: string,
): MissionControlOverview {
  const summary = partial.executiveSummary ?? {
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
    links: {},
  };

  return {
    persona: partial.persona ?? resolvePersona(role),
    visibleSections: partial.visibleSections ?? DEFAULT_SECTIONS,
    executiveSummary: summary,
    financialHealth: partial.financialHealth,
    pipeline: partial.pipeline ?? [],
    todaysWork: partial.todaysWork ?? [],
    activity: partial.activity ?? [],
    alerts: partial.alerts ?? [],
    projectHealth: partial.projectHealth ?? [],
    assetHealth: partial.assetHealth ?? {},
    supplyChainHealth: partial.supplyChainHealth ?? {},
    notifications: partial.notifications ?? { items: [], unreadCount: 0 },
    executiveDecisions: partial.executiveDecisions,
    generatedAt: partial.generatedAt ?? new Date().toISOString(),
    safety: partial.safety,
    quality: partial.quality,
    workforce: partial.workforce,
  };
}
