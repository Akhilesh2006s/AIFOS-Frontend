import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, Download, Search, Save, Trash2, FileText } from 'lucide-react';
import { insightsApi, type InsightsQueryParams } from '@/api/client';
import { downloadExport } from '@/hooks/useInsights';
import { InsightsFilters } from '@/components/insights/InsightsFilters';
import { BarChart, ComparisonRow, DataTable, KpiStrip, TrendChart, formatCurrency } from '@/components/insights/chartHelpers';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'projects', label: 'Project Analytics' },
  { id: 'supply-chain', label: 'Supply Chain' },
  { id: 'assets', label: 'Asset Analytics' },
  { id: 'finance', label: 'Finance' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'workforce', label: 'Workforce' },
  { id: 'safety', label: 'Safety' },
  { id: 'permits', label: 'Permits' },
  { id: 'quality', label: 'Quality' },
  { id: 'operational', label: 'Operational Intel' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'predictions', label: 'Predictions' },
  { id: 'risks', label: 'Risks' },
  { id: 'rules', label: 'Rules' },
  { id: 'platform', label: 'Platform' },
  { id: 'forecasts', label: 'Forecasts' },
  { id: 'reports', label: 'Custom Reports' },
  { id: 'exports', label: 'Exports' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'api-analytics', label: 'API Analytics' },
  { id: 'erp-analytics', label: 'ERP Analytics' },
  { id: 'device-analytics', label: 'Device Analytics' },
  { id: 'communication', label: 'Communication' },
  { id: 'organization-analytics', label: 'Organization Analytics' },
  { id: 'global-analytics', label: 'Global Analytics' },
  { id: 'brief', label: 'Executive Intel' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function InsightsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as TabId) || 'overview';
  const [filters, setFilters] = useState<InsightsQueryParams>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [projects, setProjects] = useState<Record<string, unknown> | null>(null);
  const [supplyChain, setSupplyChain] = useState<Record<string, unknown> | null>(null);
  const [assets, setAssets] = useState<Record<string, unknown> | null>(null);
  const [finance, setFinance] = useState<Record<string, unknown> | null>(null);
  const [compliance, setCompliance] = useState<Record<string, unknown> | null>(null);
  const [workforce, setWorkforce] = useState<Record<string, unknown> | null>(null);
  const [safety, setSafety] = useState<Record<string, unknown> | null>(null);
  const [permits, setPermits] = useState<Record<string, unknown> | null>(null);
  const [quality, setQuality] = useState<Record<string, unknown> | null>(null);
  const [operational, setOperational] = useState<Record<string, unknown> | null>(null);
  const [recommendations, setRecommendations] = useState<Record<string, unknown> | null>(null);
  const [risks, setRisks] = useState<Record<string, unknown> | null>(null);
  const [rulesAnalytics, setRulesAnalytics] = useState<Record<string, unknown> | null>(null);
  const [platform, setPlatform] = useState<Record<string, unknown> | null>(null);
  const [forecasts, setForecasts] = useState<Record<string, unknown> | null>(null);
  const [predictionAnalytics, setPredictionAnalytics] = useState<Record<string, unknown> | null>(null);
  const [brief, setBrief] = useState<Record<string, unknown> | null>(null);
  const [integrationAnalytics, setIntegrationAnalytics] = useState<Record<string, unknown> | null>(null);
  const [apiAnalytics, setApiAnalytics] = useState<Record<string, unknown> | null>(null);
  const [erpAnalytics, setErpAnalytics] = useState<Record<string, unknown> | null>(null);
  const [deviceAnalytics, setDeviceAnalytics] = useState<Record<string, unknown> | null>(null);
  const [communicationAnalytics, setCommunicationAnalytics] = useState<Record<string, unknown> | null>(null);
  const [organizationAnalytics, setOrganizationAnalytics] = useState<Record<string, unknown> | null>(null);
  const [globalAnalytics, setGlobalAnalytics] = useState<Record<string, unknown> | null>(null);
  const [savedReports, setSavedReports] = useState<Array<{ _id: string; name: string; section: string }>>([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<{ reports: Array<{ id: string; name: string; path: string }>; sections: Array<{ id: string; label: string; path: string }> } | null>(null);
  const [reportName, setReportName] = useState('');

  const setTab = (id: TabId) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', id);
    setSearchParams(next);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const f = filters;
      const loadTab = async () => {
        switch (tab) {
          case 'overview': {
            const r = await insightsApi.overview(f);
            setOverview(r.data);
            break;
          }
          case 'projects': {
            const r = await insightsApi.projects(f);
            setProjects(r.data);
            break;
          }
          case 'supply-chain': {
            const r = await insightsApi.supplyChain(f);
            setSupplyChain(r.data);
            break;
          }
          case 'assets': {
            const r = await insightsApi.assets(f);
            setAssets(r.data);
            break;
          }
          case 'finance': {
            const r = await insightsApi.finance(f);
            setFinance(r.data);
            break;
          }
          case 'compliance': {
            const r = await insightsApi.compliance(f);
            setCompliance(r.data);
            break;
          }
          case 'workforce': {
            const r = await insightsApi.workforce(f);
            setWorkforce(r.data);
            break;
          }
          case 'safety': {
            const r = await insightsApi.safety(f);
            setSafety(r.data);
            break;
          }
          case 'permits': {
            const r = await insightsApi.permits(f);
            setPermits(r.data);
            break;
          }
          case 'quality': {
            const r = await insightsApi.quality(f);
            setQuality(r.data);
            break;
          }
          case 'operational': {
            const r = await insightsApi.operational(f);
            setOperational(r.data);
            break;
          }
          case 'recommendations': {
            const r = await insightsApi.recommendations(f);
            setRecommendations(r.data);
            break;
          }
          case 'predictions': {
            const r = await insightsApi.predictions(f);
            setPredictionAnalytics(r.data);
            break;
          }
          case 'risks': {
            const r = await insightsApi.risks(f);
            setRisks(r.data);
            break;
          }
          case 'rules': {
            const r = await insightsApi.rules(f);
            setRulesAnalytics(r.data);
            break;
          }
          case 'platform': {
            const r = await insightsApi.platform();
            setPlatform(r.data);
            break;
          }
          case 'forecasts': {
            const r = await insightsApi.forecasts(f);
            setForecasts(r.data);
            break;
          }
          case 'brief': {
            const r = await insightsApi.brief();
            setBrief(r.data);
            break;
          }
          case 'integrations': {
            const r = await insightsApi.integrations();
            setIntegrationAnalytics(r.data);
            break;
          }
          case 'api-analytics': {
            const r = await insightsApi.apiAnalytics();
            setApiAnalytics(r.data);
            break;
          }
          case 'erp-analytics': {
            const r = await insightsApi.erpAnalytics();
            setErpAnalytics(r.data);
            break;
          }
          case 'device-analytics': {
            const r = await insightsApi.deviceAnalytics();
            setDeviceAnalytics(r.data);
            break;
          }
          case 'communication': {
            const r = await insightsApi.communication();
            setCommunicationAnalytics(r.data);
            break;
          }
          case 'organization-analytics': {
            const r = await insightsApi.organizationAnalytics();
            setOrganizationAnalytics(r.data);
            break;
          }
          case 'global-analytics': {
            const r = await insightsApi.globalAnalytics();
            setGlobalAnalytics(r.data);
            break;
          }
          case 'reports': {
            const r = await insightsApi.reports.list();
            setSavedReports(r.data);
            break;
          }
          case 'exports':
            break;
          default:
            break;
        }
      };
      await loadTab();
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, [tab, JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (searchQ.length < 2) { setSearchResults(null); return; }
    const t = setTimeout(() => {
      insightsApi.search(searchQ).then((r) => setSearchResults(r.data));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ]);

  const handleSaveReport = async () => {
    if (!reportName.trim()) return;
    await insightsApi.reports.save({ name: reportName, section: tab, filters: filters as Record<string, string> });
    setReportName('');
    load();
  };

  const handleExport = (section: string, format: string) => {
    downloadExport(section, format, filters).catch(() => alert('Export failed'));
  };

  const o = overview as {
    totalProjects?: number; delayedProjects?: number; openIssues?: number; openRisks?: number;
    budgetUtilization?: number; totalBudget?: number; totalSpent?: number;
    projectHealthTrend?: Array<{ label: string; avgHealth: number }>;
    equipmentUtilizationTrend?: Array<{ label: string; utilization: number }>;
    procurementSpendTrend?: Array<{ label: string; spend: number }>;
    materialConsumptionTrend?: Array<{ label: string; quantity: number }>;
    monthlyComparison?: Record<string, { current: number; previous: number; changePct: number }>;
    links?: Record<string, string>;
    documentCenter?: { totalDocuments: number; pendingApprovals: number; uploadTrend: Array<{ month: string; count: number }>; link: string };
    compliancePlus?: { totalRecords: number; expiringSoon: number; expired: number; pendingRenewals: number; expiryTrend?: Array<{ month: string; count: number }>; link: string };
  } | null;

  const tabContent = useMemo(() => {
    if (loading && !overview) {
      return (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-accent" size={32} />
        </div>
      );
    }

    switch (tab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <KpiStrip items={[
              { label: 'Total Projects', value: o?.totalProjects ?? 0, link: o?.links?.projects },
              { label: 'Delayed', value: o?.delayedProjects ?? 0, link: o?.links?.delayedProjects, warn: (o?.delayedProjects ?? 0) > 0 },
              { label: 'Open Issues', value: o?.openIssues ?? 0, link: o?.links?.issues },
              { label: 'Open Risks', value: o?.openRisks ?? 0, warn: (o?.openRisks ?? 0) > 0 },
              { label: 'Budget Used', value: `${o?.budgetUtilization ?? 0}%`, link: o?.links?.projects },
              { label: 'Documents', value: o?.documentCenter?.totalDocuments ?? 0, link: o?.documentCenter?.link || o?.links?.documents },
              { label: 'Pending Docs', value: o?.documentCenter?.pendingApprovals ?? 0, link: '/business/documents?tab=approvals', warn: (o?.documentCenter?.pendingApprovals ?? 0) > 0 },
              { label: 'Compliance', value: o?.compliancePlus?.totalRecords ?? 0, link: o?.compliancePlus?.link || '/business/compliance' },
              { label: 'Expiring', value: o?.compliancePlus?.expiringSoon ?? 0, link: '/business/compliance?tab=renewals', warn: (o?.compliancePlus?.expiringSoon ?? 0) > 0 },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <TrendChart title="Project Health Trend" labels={o?.projectHealthTrend?.map((t) => t.label) ?? []} values={o?.projectHealthTrend?.map((t) => t.avgHealth) ?? []} color="#38bdf8" link="/projects" />
              <TrendChart title="Equipment Utilization" labels={o?.equipmentUtilizationTrend?.map((t) => t.label) ?? []} values={o?.equipmentUtilizationTrend?.map((t) => t.utilization) ?? []} color="#a78bfa" link="/equipment" />
              <TrendChart title="Procurement Spend" labels={o?.procurementSpendTrend?.map((t) => t.label) ?? []} values={o?.procurementSpendTrend?.map((t) => t.spend) ?? []} color="#22c55e" formatValue={(v) => formatCurrency(v)} link="/procurement" />
              <TrendChart title="Material Consumption" labels={o?.materialConsumptionTrend?.map((t) => t.label) ?? []} values={o?.materialConsumptionTrend?.map((t) => t.quantity) ?? []} color="#f97316" link="/consumption" />
              <TrendChart title="Document Uploads" labels={o?.documentCenter?.uploadTrend?.map((t) => t.month) ?? []} values={o?.documentCenter?.uploadTrend?.map((t) => t.count) ?? []} color="#6366f1" link="/business/documents" />
              <TrendChart title="Compliance Expiries" labels={o?.compliancePlus?.expiryTrend?.map((t) => t.month) ?? []} values={o?.compliancePlus?.expiryTrend?.map((t) => t.count) ?? []} color="#f59e0b" link="/business/compliance" />
            </div>
            {o?.monthlyComparison && (
              <div className="command-card space-y-2 p-4">
                <h3 className="text-sm font-semibold text-white">Monthly Comparison</h3>
                <ComparisonRow label="Procurement Spend" {...o.monthlyComparison.procurementSpend} />
                <ComparisonRow label="Consumption" {...o.monthlyComparison.consumption} />
                <ComparisonRow label="Utilization" {...o.monthlyComparison.utilization} suffix="%" />
              </div>
            )}
          </div>
        );

      case 'projects': {
        const p = projects as {
          healthRanking?: Array<{ name: string; code: string; healthScore: number; progress: number; openIssues: number; delayedMilestones: number; link: string }>;
          milestonePerformance?: { total: number; completed: number; delayed: number; onTrack: number };
          boqProgress?: { totalLines: number; totalValue: number };
          issueTrend?: Array<{ label: string; opened: number; resolved: number }>;
          dailyProgressTrend?: Array<{ label: string; avgProgress: number }>;
          documentActivity?: Array<{ label: string; uploads: number }>;
        } | null;
        return (
          <div className="space-y-6">
            <KpiStrip items={[
              { label: 'Milestones', value: p?.milestonePerformance?.total ?? 0 },
              { label: 'Delayed', value: p?.milestonePerformance?.delayed ?? 0, warn: true, link: '/projects?filter=delayed' },
              { label: 'BOQ Lines', value: p?.boqProgress?.totalLines ?? 0 },
              { label: 'BOQ Value', value: formatCurrency(p?.boqProgress?.totalValue ?? 0) },
            ]} />
            <DataTable
              columns={[
                { key: 'name', label: 'Project' },
                { key: 'healthScore', label: 'Health' },
                { key: 'progress', label: 'Progress %' },
                { key: 'openIssues', label: 'Issues' },
                { key: 'delayedMilestones', label: 'Delayed' },
              ]}
              rows={(p?.healthRanking ?? []).map((r) => ({ ...r, name: r.name, link: r.link }))}
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart title="Issues Opened" labels={p?.issueTrend?.map((t) => t.label) ?? []} values={p?.issueTrend?.map((t) => t.opened) ?? []} color="#ef4444" link="/projects" />
              <TrendChart title="Daily Progress" labels={p?.dailyProgressTrend?.map((t) => t.label) ?? []} values={p?.dailyProgressTrend?.map((t) => t.avgProgress) ?? []} link="/projects" />
              <BarChart title="Document Uploads" labels={p?.documentActivity?.map((t) => t.label) ?? []} values={p?.documentActivity?.map((t) => t.uploads) ?? []} color="#6366f1" link="/business/documents" />
            </div>
          </div>
        );
      }

      case 'supply-chain': {
        const sc = supplyChain as {
          rfqConversion?: { rate: number; published: number; awarded: number };
          poCycleTime?: { avgDays: number };
          leadTimeAnalysis?: { avgLeadDays: number };
          inventoryTurnover?: { lowStock: number };
          vendorPerformance?: Array<{ name: string; poCount: number; totalSpend: number }>;
          prTrend?: Array<{ label: string; created: number; approved: number }>;
          procurementSpend?: Array<{ label: string; amount: number }>;
        } | null;
        return (
          <div className="space-y-6">
            <KpiStrip items={[
              { label: 'RFQ Conversion', value: `${sc?.rfqConversion?.rate ?? 0}%`, link: '/procurement?tab=rfq' },
              { label: 'PO Cycle (days)', value: sc?.poCycleTime?.avgDays ?? 0, link: '/procurement?tab=po' },
              { label: 'Avg Lead Time', value: `${sc?.leadTimeAnalysis?.avgLeadDays ?? 0}d` },
              { label: 'Low Stock', value: sc?.inventoryTurnover?.lowStock ?? 0, warn: true, link: '/inventory?tab=materials' },
            ]} />
            <DataTable
              columns={[{ key: 'name', label: 'Vendor' }, { key: 'poCount', label: 'POs' }, { key: 'totalSpend', label: 'Spend' }]}
              rows={(sc?.vendorPerformance ?? []).map((v) => ({ ...v, totalSpend: formatCurrency(v.totalSpend) }))}
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart title="PR Trend" labels={sc?.prTrend?.map((t) => t.label) ?? []} values={sc?.prTrend?.map((t) => t.created) ?? []} link="/procurement?tab=pr" />
              <TrendChart title="Procurement Spend" labels={sc?.procurementSpend?.map((t) => t.label) ?? []} values={sc?.procurementSpend?.map((t) => t.amount) ?? []} formatValue={(v) => formatCurrency(v)} link="/procurement" />
            </div>
          </div>
        );
      }

      case 'assets': {
        const a = assets as {
          utilization?: { running: number; idle: number; breakdown: number; maintenance: number; avgUtilization: number };
          fuelConsumption?: Array<{ label: string; cost: number }>;
          maintenanceCost?: Array<{ label: string; cost: number }>;
          breakdownFrequency?: Array<{ label: string; count: number }>;
          costPerHour?: Array<{ name: string; code: string; costPerHour: number; utilization: number; link: string }>;
        } | null;
        return (
          <div className="space-y-6">
            <KpiStrip items={[
              { label: 'Running', value: a?.utilization?.running ?? 0, link: '/equipment' },
              { label: 'Idle', value: a?.utilization?.idle ?? 0 },
              { label: 'Breakdown', value: a?.utilization?.breakdown ?? 0, warn: true, link: '/maintenance?tab=breakdowns' },
              { label: 'Avg Utilization', value: `${a?.utilization?.avgUtilization ?? 0}%` },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <TrendChart title="Fuel Cost" labels={a?.fuelConsumption?.map((t) => t.label) ?? []} values={a?.fuelConsumption?.map((t) => t.cost) ?? []} color="#f59e0b" formatValue={(v) => formatCurrency(v)} link="/equipment" />
              <TrendChart title="Maintenance Cost" labels={a?.maintenanceCost?.map((t) => t.label) ?? []} values={a?.maintenanceCost?.map((t) => t.cost) ?? []} color="#8b5cf6" link="/maintenance" />
              <BarChart title="Breakdown Frequency" labels={a?.breakdownFrequency?.map((t) => t.label) ?? []} values={a?.breakdownFrequency?.map((t) => t.count) ?? []} color="#ef4444" link="/maintenance?tab=breakdowns" />
            </div>
            <DataTable
              columns={[{ key: 'name', label: 'Equipment' }, { key: 'code', label: 'Code' }, { key: 'costPerHour', label: '₹/hr' }, { key: 'utilization', label: 'Util %' }]}
              rows={(a?.costPerHour ?? []).map((e) => ({ ...e, link: e.link }))}
            />
          </div>
        );
      }

      case 'finance': {
        const fin = finance as {
          kpis?: { totalBudget: number; actualSpend: number; committedCost: number; remainingBudget: number; utilizationPercent: number; forecastFinalCost?: number; variance?: number };
          budgetVsActual?: Array<{ category: string; budget: number; actual: number; committed: number }>;
          monthlySpend?: Array<{ month: string; amount: number }>;
          projectCostRanking?: Array<{ name: string; actualCost: number; budget?: number; link: string }>;
          costByBoqCategory?: Array<{ category: string; actual: number; budget: number }>;
          costByVendor?: Array<{ vendorId: string; spend: number; poCount: number; link?: string }>;
          fuelCostTotal?: number;
          maintenanceCostTotal?: number;
          topCostDrivers?: Array<{ category: string; actual: number; committed: number; contributionPercent: number; trend: string }>;
          budgetUtilizationTrend?: Array<{ month: string; cumulative: number }>;
          varianceTrend?: Array<{ category: string; variance: number; variancePercent: number }>;
          costCategoryDistribution?: Array<{ category: string; value: number; percent: number }>;
          equipmentCostDistribution?: Array<{ name?: string; total: number; link: string }>;
          forecastFinalCost?: number;
          exceptionRate?: number;
          topVendorsByBilling?: Array<{ vendorId: string; spend: number }>;
          largestBills?: Array<{ invoiceNumber: string; amount: number; link: string }>;
          poMatchingSuccessPercent?: number;
          grnMatchingSuccessPercent?: number;
          averageApprovalTimeHours?: number;
          vendorBillingTrend?: Array<{ month: string; amount: number }>;
          invoiceAging?: { current: number; days30: number; days60: number; days90: number; overdue: number };
          recommendations?: Array<{ title: string; message: string; link: string }>;
          paymentInsights?: {
            cashFlowTrend?: Array<{ month: string; amount: number }>;
            outstandingLiability?: number;
            paymentCycleTimeHours?: number;
            cashRequired7Days?: number;
            cashRequired30Days?: number;
            largestVendorPayments?: Array<{ vendorId: string; amount: number }>;
          };
        } | null;
        return (
          <div className="space-y-6">
            <KpiStrip items={[
              { label: 'Total Budget', value: formatCurrency(fin?.kpis?.totalBudget ?? 0), link: '/business' },
              { label: 'Actual Spend', value: formatCurrency(fin?.kpis?.actualSpend ?? 0), link: '/business?tab=budget' },
              { label: 'Forecast', value: formatCurrency(fin?.forecastFinalCost ?? fin?.kpis?.forecastFinalCost ?? 0), link: '/business' },
              { label: 'Utilization', value: `${fin?.kpis?.utilizationPercent ?? 0}%` },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart
                title="Budget vs Actual"
                labels={fin?.budgetVsActual?.map((b) => b.category) ?? []}
                values={fin?.budgetVsActual?.map((b) => b.actual) ?? []}
                link="/business?tab=budget"
              />
              <TrendChart
                title="Budget Utilization Trend"
                labels={fin?.budgetUtilizationTrend?.map((m) => m.month) ?? fin?.monthlySpend?.map((m) => m.month) ?? []}
                values={fin?.budgetUtilizationTrend?.map((m) => m.cumulative) ?? fin?.monthlySpend?.map((m) => m.amount) ?? []}
                formatValue={(v) => formatCurrency(v)}
                link="/business?tab=timeline"
              />
              <BarChart
                title="Variance by Category"
                labels={fin?.varianceTrend?.map((v) => v.category) ?? []}
                values={fin?.varianceTrend?.map((v) => v.variance) ?? []}
                color="#ef4444"
                link="/business?tab=drivers"
              />
              <BarChart
                title="Cost Category Distribution"
                labels={fin?.costCategoryDistribution?.map((c) => c.category) ?? []}
                values={fin?.costCategoryDistribution?.map((c) => c.value) ?? []}
                color="#8b5cf6"
                link="/business?tab=drivers"
              />
              <BarChart title="Fuel Cost" labels={['Fuel']} values={[fin?.fuelCostTotal ?? 0]} color="#f59e0b" link="/equipment" />
              <BarChart title="Maintenance Cost" labels={['Maintenance']} values={[fin?.maintenanceCostTotal ?? 0]} color="#8b5cf6" link="/maintenance" />
            </div>
            <div className="command-card p-4">
              <p className="mb-2 text-sm font-semibold text-white">Accounts Payable — Vendor Bills</p>
              <div className="grid gap-4 sm:grid-cols-4 text-sm">
                <div><p className="text-slate-500">PO Match %</p><p className="font-mono text-white">{fin?.poMatchingSuccessPercent ?? 0}%</p></div>
                <div><p className="text-slate-500">GRN Match %</p><p className="font-mono text-white">{fin?.grnMatchingSuccessPercent ?? 0}%</p></div>
                <div><p className="text-slate-500">Exception Rate</p><p className="font-mono text-red-400">{fin?.exceptionRate ?? 0}%</p></div>
                <div><p className="text-slate-500">Avg Approval</p><p className="font-mono text-white">{fin?.averageApprovalTimeHours ?? 0}h</p></div>
              </div>
              <Link to="/business/payments" className="mt-2 inline-block text-xs text-accent hover:underline">Payments workspace →</Link>
            </div>
            {(fin?.paymentInsights) && (
              <div className="grid gap-4 lg:grid-cols-2">
                <TrendChart
                  title="Monthly Payment Trend"
                  labels={fin.paymentInsights.cashFlowTrend?.map((t) => t.month) ?? []}
                  values={fin.paymentInsights.cashFlowTrend?.map((t) => t.amount) ?? []}
                  formatValue={(v) => formatCurrency(v)}
                  link="/business/payments"
                />
                <div className="command-card p-4">
                  <p className="mb-2 text-sm font-semibold text-white">Payment Operations</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-slate-500">Outstanding</p><p className="font-mono">{formatCurrency(fin.paymentInsights.outstandingLiability ?? 0)}</p></div>
                    <div><p className="text-slate-500">Cycle Time</p><p className="font-mono">{fin.paymentInsights.paymentCycleTimeHours ?? 0}h</p></div>
                    <div><p className="text-slate-500">Cash 7d</p><p className="font-mono">{formatCurrency(fin.paymentInsights.cashRequired7Days ?? 0)}</p></div>
                    <div><p className="text-slate-500">Cash 30d</p><p className="font-mono">{formatCurrency(fin.paymentInsights.cashRequired30Days ?? 0)}</p></div>
                  </div>
                </div>
              </div>
            )}
            <div className="grid gap-4 lg:grid-cols-2">
              <TrendChart
                title="Vendor Billing Trend"
                labels={fin?.vendorBillingTrend?.map((t) => t.month) ?? []}
                values={fin?.vendorBillingTrend?.map((t) => t.amount) ?? []}
                formatValue={(v) => formatCurrency(v)}
                link="/business/vendor-bills"
              />
              <BarChart
                title="Invoice Aging (₹)"
                labels={['Current', '1-30d', '31-60d', '61-90d', 'Overdue']}
                values={[
                  fin?.invoiceAging?.current ?? 0,
                  fin?.invoiceAging?.days30 ?? 0,
                  fin?.invoiceAging?.days60 ?? 0,
                  fin?.invoiceAging?.days90 ?? 0,
                  fin?.invoiceAging?.overdue ?? 0,
                ]}
                link="/business/vendor-bills"
              />
            </div>
            <div className="command-card p-4">
              <p className="mb-2 text-sm font-semibold text-white">Top 10 Cost Drivers</p>
              <ul className="space-y-2">
                {(fin?.topCostDrivers ?? []).slice(0, 10).map((d) => (
                  <li key={d.category} className="flex justify-between text-sm">
                    <span className="text-slate-400">{d.category}</span>
                    <span className="font-mono text-white">{formatCurrency(d.actual + d.committed)} ({d.contributionPercent}%)</span>
                  </li>
                ))}
              </ul>
            </div>
            {(fin?.recommendations?.length ?? 0) > 0 && (
              <div className="command-card p-4">
                <p className="mb-2 text-sm font-semibold text-white">Executive Recommendations</p>
                <ul className="space-y-2">
                  {fin!.recommendations!.map((r, i) => (
                    <li key={i}>
                      <Link to={r.link} className="block rounded-lg border border-white/5 px-3 py-2 hover:border-white/15">
                        <p className="text-sm text-white">{r.title}</p>
                        <p className="text-xs text-slate-500">{r.message}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <DataTable
              columns={[{ key: 'invoice', label: 'Invoice' }, { key: 'amount', label: 'Amount' }]}
              rows={(fin?.largestBills ?? []).map((b) => ({ invoice: b.invoiceNumber, amount: formatCurrency(b.amount), link: b.link }))}
            />
            <DataTable
              columns={[{ key: 'name', label: 'Project' }, { key: 'actualCost', label: 'Actual Spend' }]}
              rows={(fin?.projectCostRanking ?? []).map((p) => ({ name: p.name, actualCost: formatCurrency(p.actualCost), link: p.link }))}
            />
            <DataTable
              columns={[{ key: 'name', label: 'Equipment' }, { key: 'total', label: 'Total Cost' }]}
              rows={(fin?.equipmentCostDistribution ?? []).slice(0, 10).map((e) => ({ name: e.name ?? '—', total: formatCurrency(e.total), link: e.link }))}
            />
          </div>
        );
      }

      case 'compliance': {
        const c = compliance as {
          totalRecords?: number;
          expiringSoon?: number;
          expired?: number;
          pendingRenewals?: number;
          expiryTrend?: Array<{ month: string; count: number }>;
          byCategory?: Array<{ label: string; count: number; expiring: number }>;
          renewalQueue?: Array<{ documentType: string; documentNumber?: string; renewalStatus: string; link: string }>;
          timeline?: Array<{ documentType: string; action: string; at: string; link: string }>;
        } | null;
        return (
          <div className="space-y-6">
            <KpiStrip items={[
              { label: 'Total Records', value: c?.totalRecords ?? 0, link: '/business/compliance' },
              { label: 'Expiring Soon', value: c?.expiringSoon ?? 0, link: '/business/compliance?tab=renewals', warn: (c?.expiringSoon ?? 0) > 0 },
              { label: 'Expired', value: c?.expired ?? 0, link: '/business/compliance', warn: (c?.expired ?? 0) > 0 },
              { label: 'Pending Renewals', value: c?.pendingRenewals ?? 0, link: '/business/compliance?tab=renewals' },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart title="Expiry Trend" labels={c?.expiryTrend?.map((t) => t.month) ?? []} values={c?.expiryTrend?.map((t) => t.count) ?? []} color="#f59e0b" link="/business/compliance" />
              <BarChart title="By Category" labels={c?.byCategory?.map((t) => t.label) ?? []} values={c?.byCategory?.map((t) => t.count) ?? []} color="#38bdf8" link="/business/compliance" />
            </div>
            <DataTable
              columns={[{ key: 'documentType', label: 'Document' }, { key: 'renewalStatus', label: 'Status' }]}
              rows={(c?.renewalQueue ?? []).map((r) => ({ documentType: `${r.documentType} ${r.documentNumber || ''}`, renewalStatus: r.renewalStatus, link: r.link }))}
            />
          </div>
        );
      }

      case 'workforce': {
        const w = workforce as {
          kpis?: Record<string, number>;
          attendanceTrend?: Array<{ month: string; count?: number; percent?: number }>;
          productivityTrend?: Array<{ month: string; output: number; achievement: number }>;
          performanceTrend?: Array<{ name: string; score: number }>;
          trainingAnalytics?: Array<{ type: string; count: number }>;
          certificationAnalytics?: Array<{ type: string; valid: number; expired: number }>;
          skillDistribution?: Array<{ level: string; count: number }>;
          crewComparison?: Array<{ name: string; score: number }>;
          resourceUtilization?: { allocated: number; totalEmployees: number; rate: number };
          contractorDistribution?: Array<{ name: string; workers: number }>;
          teamProductivity?: Array<{ type: string; count: number }>;
          trainingStatus?: { due: number; expired: number };
        } | null;
        const attLabels = w?.attendanceTrend?.map((t) => t.month) ?? [];
        const attValues = w?.attendanceTrend?.map((t) => t.percent ?? t.count ?? 0) ?? [];
        return (
          <div className="space-y-6">
            <KpiStrip items={[
              { label: 'Present', value: w?.kpis?.employeesPresent ?? 0, link: '/workforce' },
              { label: 'Productivity', value: `${w?.kpis?.productivityPercent ?? w?.kpis?.productivityScore ?? 0}%`, link: '/workforce?tab=productivity' },
              { label: 'Performance', value: w?.kpis?.avgEmployeeScore ?? 0, link: '/workforce?tab=performance' },
              { label: 'Training Due', value: w?.trainingStatus?.due ?? w?.kpis?.trainingDue ?? 0, link: '/workforce?tab=training', warn: (w?.trainingStatus?.due ?? 0) > 0 },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart title="Attendance %" labels={attLabels} values={attValues} color="#22c55e" link="/workforce?tab=attendance" />
              <BarChart title="Productivity Trend" labels={w?.productivityTrend?.map((t) => t.month) ?? []} values={w?.productivityTrend?.map((t) => t.achievement) ?? []} color="#f59e0b" link="/workforce?tab=productivity" />
              <BarChart title="Training by Type" labels={w?.trainingAnalytics?.map((t) => t.type) ?? []} values={w?.trainingAnalytics?.map((t) => t.count) ?? []} color="#8b5cf6" link="/workforce?tab=training" />
              <BarChart title="Skill Distribution" labels={w?.skillDistribution?.map((t) => t.level) ?? []} values={w?.skillDistribution?.map((t) => t.count) ?? []} color="#38bdf8" link="/workforce?tab=skills" />
              <BarChart title="Crew Comparison" labels={w?.crewComparison?.map((t) => t.name) ?? []} values={w?.crewComparison?.map((t) => t.score) ?? []} color="#10b981" link="/workforce?tab=performance" />
              <BarChart title="Certifications" labels={w?.certificationAnalytics?.map((t) => t.type.replace(/_/g, ' ')) ?? []} values={w?.certificationAnalytics?.map((t) => t.valid) ?? []} color="#ef4444" link="/workforce?tab=certifications" />
            </div>
          </div>
        );
      }

      case 'safety': {
        const s = safety as {
          kpis?: Record<string, number>;
          incidentTrend?: Array<{ month: string; count: number }>;
          nearMissTrend?: Array<{ month: string; count: number }>;
          rootCauseAnalysis?: Array<{ cause: string; count: number }>;
          toolboxParticipation?: Array<{ topic: string; attendees: number }>;
          ppeByType?: Array<{ type: string; count: number }>;
        } | null;
        return (
          <div className="space-y-6">
            <KpiStrip items={[
              { label: 'Safety Score', value: s?.kpis?.safetyScore ?? 0, link: '/workforce?tab=safety' },
              { label: 'PPE Compliance', value: `${s?.kpis?.ppeCompliance ?? 0}%`, link: '/workforce?tab=safety&sub=ppe' },
              { label: 'Active Incidents', value: s?.kpis?.activeIncidents ?? 0, link: '/workforce?tab=safety&sub=incidents', warn: (s?.kpis?.activeIncidents ?? 0) > 0 },
              { label: 'Days Without Incident', value: s?.kpis?.daysWithoutIncident ?? 0, link: '/workforce?tab=safety' },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart title="Incident Trend" labels={s?.incidentTrend?.map((t) => t.month) ?? []} values={s?.incidentTrend?.map((t) => t.count) ?? []} color="#ef4444" link="/workforce?tab=safety&sub=incidents" />
              <BarChart title="Near Miss Trend" labels={s?.nearMissTrend?.map((t) => t.month) ?? []} values={s?.nearMissTrend?.map((t) => t.count) ?? []} color="#f59e0b" link="/workforce?tab=safety&sub=near-miss" />
              <BarChart title="Root Causes" labels={s?.rootCauseAnalysis?.map((t) => t.cause) ?? []} values={s?.rootCauseAnalysis?.map((t) => t.count) ?? []} color="#8b5cf6" link="/workforce?tab=safety" />
              <BarChart title="PPE by Type" labels={s?.ppeByType?.map((t) => t.type) ?? []} values={s?.ppeByType?.map((t) => t.count) ?? []} color="#38bdf8" link="/workforce?tab=safety&sub=ppe" />
            </div>
          </div>
        );
      }

      case 'permits': {
        const pr = permits as {
          kpis?: Record<string, number>;
          permitTrend?: Array<{ month: string; count: number }>;
          permitTypes?: Array<{ type: string; count: number }>;
          highRiskDistribution?: Array<{ type: string; count: number }>;
          avgApprovalHours?: number;
          avgClosureHours?: number;
          compliancePercent?: number;
        } | null;
        return (
          <div className="space-y-6">
            <KpiStrip items={[
              { label: 'Active', value: pr?.kpis?.activePermits ?? 0, link: '/workforce?tab=permits&sub=active' },
              { label: 'Pending', value: pr?.kpis?.pendingApproval ?? 0, link: '/workforce?tab=permits&sub=pending' },
              { label: 'Compliance', value: `${pr?.compliancePercent ?? 0}%`, link: '/workforce?tab=permits' },
              { label: 'Avg Approval (h)', value: pr?.avgApprovalHours ?? 0, link: '/workforce?tab=permits' },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart title="Permit Trend" labels={pr?.permitTrend?.map((t) => t.month) ?? []} values={pr?.permitTrend?.map((t) => t.count) ?? []} color="#8b5cf6" link="/workforce?tab=permits" />
              <BarChart title="Permit Types" labels={pr?.permitTypes?.map((t) => t.type.replace(/_/g, ' ')) ?? []} values={pr?.permitTypes?.map((t) => t.count) ?? []} color="#38bdf8" link="/workforce?tab=permits" />
              <BarChart title="High Risk Distribution" labels={pr?.highRiskDistribution?.map((t) => t.type.replace(/_/g, ' ')) ?? []} values={pr?.highRiskDistribution?.map((t) => t.count) ?? []} color="#ef4444" link="/workforce?tab=permits&sub=high-risk" />
              <TrendChart title="Closure vs Approval (h)" labels={['Approval', 'Closure']} values={[pr?.avgApprovalHours ?? 0, pr?.avgClosureHours ?? 0]} color="#f59e0b" link="/workforce?tab=permits" />
            </div>
          </div>
        );
      }

      case 'quality': {
        const q = quality as {
          kpis?: Record<string, number>;
          inspectionTrend?: Array<{ month: string; pass: number; fail: number; total: number }>;
          materialTestResults?: Array<{ type: string; pass: number; fail: number }>;
          ncrTrend?: Array<{ month: string; count: number }>;
          capaPerformance?: { total: number; closed: number; onTimePercent: number; pending: number };
          qualityScores?: Array<{ month: string; score: number }>;
        } | null;
        return (
          <div className="space-y-6">
            <KpiStrip items={[
              { label: 'Open NCR', value: q?.kpis?.openNcr ?? 0, link: '/workforce?tab=quality&sub=ncr', warn: (q?.kpis?.openNcr ?? 0) > 0 },
              { label: 'Pass %', value: `${q?.kpis?.inspectionPassPercent ?? 0}%`, link: '/workforce?tab=quality&sub=inspections' },
              { label: 'Project Score', value: q?.kpis?.projectQualityScore ?? 0, link: '/workforce?tab=quality' },
              { label: 'CAPA Pending', value: q?.kpis?.capaPending ?? 0, link: '/workforce?tab=quality&sub=capa' },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart title="Inspection Pass" labels={q?.inspectionTrend?.map((t) => t.month) ?? []} values={q?.inspectionTrend?.map((t) => t.pass) ?? []} color="#10b981" link="/workforce?tab=quality&sub=inspections" />
              <BarChart title="Inspection Fail" labels={q?.inspectionTrend?.map((t) => t.month) ?? []} values={q?.inspectionTrend?.map((t) => t.fail) ?? []} color="#ef4444" link="/workforce?tab=quality&sub=inspections" />
              <BarChart title="Material Test Pass" labels={q?.materialTestResults?.map((t) => t.type.replace(/_/g, ' ')) ?? []} values={q?.materialTestResults?.map((t) => t.pass) ?? []} color="#38bdf8" link="/workforce?tab=quality&sub=tests" />
              <BarChart title="NCR Trend" labels={q?.ncrTrend?.map((t) => t.month) ?? []} values={q?.ncrTrend?.map((t) => t.count) ?? []} color="#f59e0b" link="/workforce?tab=quality&sub=ncr" />
              <TrendChart title="Quality Scores" labels={q?.qualityScores?.map((t) => t.month) ?? []} values={q?.qualityScores?.map((t) => t.score) ?? []} color="#8b5cf6" link="/workforce?tab=quality" />
              <KpiStrip items={[
                { label: 'CAPA Closed', value: q?.capaPerformance?.closed ?? 0, link: '/workforce?tab=quality&sub=capa' },
                { label: 'On-Time %', value: `${q?.capaPerformance?.onTimePercent ?? 0}%`, link: '/workforce?tab=quality&sub=capa' },
              ]} />
            </div>
          </div>
        );
      }

      case 'operational': {
        const op = operational as {
          overallRisk?: number; recommendationCount?: number;
          riskByDomain?: Record<string, number>;
          recommendationsByDomain?: Record<string, number>;
          kpis?: Record<string, number>;
          link?: string;
        } | null;
        return (
          <div className="space-y-6">
            <KpiStrip items={[
              { label: 'Overall Risk', value: op?.overallRisk ?? 0, link: '/intelligence?tab=risks', warn: (op?.overallRisk ?? 0) > 60 },
              { label: 'Recommendations', value: op?.recommendationCount ?? op?.kpis?.recommendations ?? 0, link: '/intelligence?tab=recommendations' },
              { label: 'Critical Recs', value: op?.kpis?.criticalRecommendations ?? 0, link: '/intelligence?tab=recommendations', warn: (op?.kpis?.criticalRecommendations ?? 0) > 0 },
              { label: 'Rules (24h)', value: op?.kpis?.rulesTriggered24h ?? 0, link: '/intelligence?tab=rules' },
              { label: 'Active Rules', value: op?.kpis?.activeRules ?? 0, link: '/intelligence?tab=rules' },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart title="Risk by Domain" labels={Object.keys(op?.riskByDomain || {})} values={Object.values(op?.riskByDomain || {})} color="#ef4444" link="/intelligence?tab=risks" />
              <BarChart title="Recommendations by Domain" labels={Object.keys(op?.recommendationsByDomain || {})} values={Object.values(op?.recommendationsByDomain || {})} color="#8b5cf6" link="/intelligence?tab=recommendations" />
            </div>
            <div className="flex justify-end">
              <Link to="/intelligence" className="text-sm text-violet-400 hover:underline">Open Intelligence Workspace →</Link>
            </div>
          </div>
        );
      }

      case 'recommendations': {
        const rec = recommendations as {
          kpis?: { total?: number; critical?: number; avgScore?: number };
          topRecommendations?: Array<{ id: string; title: string; message: string; severity: string; score: number; type: string; link: string }>;
          byType?: Array<{ type: string; count: number; label: string }>;
          scoreBands?: { high?: number; medium?: number; low?: number };
          trend?: Array<{ date: string; count: number }>;
        } | null;
        return (
          <div className="space-y-6">
            <KpiStrip items={[
              { label: 'Total', value: rec?.kpis?.total ?? 0, link: '/intelligence?tab=recommendations' },
              { label: 'Critical', value: rec?.kpis?.critical ?? 0, link: '/intelligence?tab=recommendations', warn: (rec?.kpis?.critical ?? 0) > 0 },
              { label: 'Avg Score', value: rec?.kpis?.avgScore ?? 0, link: '/intelligence?tab=recommendations&sub=scoring' },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart title="By Type" labels={rec?.byType?.map((t) => t.label) ?? []} values={rec?.byType?.map((t) => t.count) ?? []} color="#8b5cf6" link="/intelligence?tab=recommendations" />
              <BarChart title="Generation Trend" labels={rec?.trend?.map((t) => t.date) ?? []} values={rec?.trend?.map((t) => t.count) ?? []} color="#38bdf8" link="/intelligence?tab=recommendations&sub=history" />
            </div>
            <div className="space-y-3">
              {(rec?.topRecommendations || []).map((r) => (
                <div key={r.id} className="command-card flex items-start justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium text-white">{r.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{r.message}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="font-mono text-lg text-violet-400">{r.score}</span>
                    <Link to={r.link} className="text-xs text-violet-400 hover:underline">Open →</Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Link to="/intelligence?tab=recommendations" className="text-sm text-violet-400 hover:underline">Full workspace →</Link>
            </div>
          </div>
        );
      }

      case 'risks': {
        const r = risks as {
          kpis?: { overallScore?: number; critical?: number; high?: number };
          byDomain?: Record<string, number>;
          domainLabels?: Record<string, string>;
          entityScores?: Record<string, number>;
          topRisks?: Array<{ title: string; score: number; severity: string }>;
          trend?: Array<{ date: string; score: number }>;
        } | null;
        return (
          <div className="space-y-6">
            <p className="text-xs text-slate-500">Deterministic operational risk scoring — continuously updated from live data.</p>
            <KpiStrip items={[
              { label: 'Overall Risk', value: `${r?.kpis?.overallScore ?? 0}/100`, link: '/intelligence?tab=risks', warn: (r?.kpis?.overallScore ?? 0) > 60 },
              { label: 'Critical', value: r?.kpis?.critical ?? 0, link: '/intelligence?tab=risks', warn: (r?.kpis?.critical ?? 0) > 0 },
              { label: 'Project', value: r?.entityScores?.project ?? 0, link: '/intelligence?tab=risks&sub=domains' },
              { label: 'Equipment', value: r?.entityScores?.equipment ?? 0, link: '/intelligence?tab=risks&sub=domains' },
              { label: 'Vendor', value: r?.entityScores?.vendor ?? 0, link: '/intelligence?tab=risks&sub=domains' },
              { label: 'Workforce', value: r?.entityScores?.workforce ?? 0, link: '/intelligence?tab=risks&sub=domains' },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart
                title="Risk by Domain"
                labels={Object.keys(r?.byDomain || {}).map((d) => r?.domainLabels?.[d] || d)}
                values={Object.values(r?.byDomain || {})}
                color="#ef4444"
                link="/intelligence?tab=risks&sub=domains"
              />
              <BarChart
                title="Risk Trend"
                labels={r?.trend?.map((t) => t.date) ?? []}
                values={r?.trend?.map((t) => t.score) ?? []}
                color="#f97316"
                link="/intelligence?tab=risks&sub=history"
              />
            </div>
            <DataTable
              columns={[
                { key: 'title', label: 'Risk' },
                { key: 'severity', label: 'Severity' },
                { key: 'score', label: 'Score' },
              ]}
              rows={(r?.topRisks || []).map((item) => ({ title: item.title, severity: item.severity, score: item.score }))}
            />
            <div className="flex justify-end">
              <Link to="/intelligence?tab=risks&sub=heatmap" className="text-sm text-violet-400 hover:underline">Risk heat map →</Link>
            </div>
          </div>
        );
      }

      case 'rules': {
        const rd = rulesAnalytics as { kpis?: Record<string, number>; byDomain?: Array<{ domain: string; count: number }> } | null;
        return (
          <div className="space-y-6">
            <KpiStrip items={[
              { label: 'Total Rules', value: rd?.kpis?.totalRules ?? 0, link: '/intelligence?tab=rules' },
              { label: 'Active', value: rd?.kpis?.activeRules ?? 0, link: '/intelligence?tab=rules' },
              { label: 'Triggered (24h)', value: rd?.kpis?.triggered24h ?? 0, link: '/intelligence?tab=rules', warn: (rd?.kpis?.triggered24h ?? 0) > 0 },
              { label: 'System Rules', value: rd?.kpis?.systemRules ?? 0, link: '/intelligence?tab=rules' },
            ]} />
            <BarChart title="Rules by Domain" labels={rd?.byDomain?.map((d) => d.domain.replace('_', ' ')) ?? []} values={rd?.byDomain?.map((d) => d.count) ?? []} color="#f59e0b" link="/intelligence?tab=rules" />
            <div className="flex justify-end">
              <Link to="/intelligence?tab=rules" className="text-sm text-violet-400 hover:underline">Rule builder & testing →</Link>
            </div>
          </div>
        );
      }

      case 'platform': {
        const p = platform as {
          userGrowth?: Array<{ month: string; count: number }>;
          roleDistribution?: Array<{ role: string; count: number }>;
          organizationGrowth?: Array<{ name: string; status: string }>;
          loginTrend?: Array<{ date: string; logins: number }>;
          storageUsage?: { usedMb: number; limitMb: number; percent: number };
          apiUsage?: number;
        } | null;
        return (
          <div className="space-y-6">
            <KpiStrip items={[
              { label: 'Storage Used', value: `${p?.storageUsage?.usedMb ?? 0} MB`, link: '/admin?tab=settings' },
              { label: 'Storage %', value: `${p?.storageUsage?.percent ?? 0}%`, link: '/admin' },
              { label: 'API Calls', value: p?.apiUsage ?? 0, link: '/admin' },
              { label: 'Organizations', value: p?.organizationGrowth?.length ?? 0, link: '/admin?tab=organizations' },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart title="User Growth" labels={p?.userGrowth?.map((t) => t.month) ?? []} values={p?.userGrowth?.map((t) => t.count) ?? []} color="#38bdf8" link="/admin?tab=users" />
              <BarChart title="Role Distribution" labels={p?.roleDistribution?.map((t) => t.role) ?? []} values={p?.roleDistribution?.map((t) => t.count) ?? []} color="#8b5cf6" link="/admin?tab=roles" />
              <BarChart title="Login Trend" labels={p?.loginTrend?.map((t) => t.date) ?? []} values={p?.loginTrend?.map((t) => t.logins) ?? []} color="#22c55e" link="/admin?tab=audit" />
              <TrendChart title="Storage" labels={['Used', 'Limit']} values={[p?.storageUsage?.usedMb ?? 0, p?.storageUsage?.limitMb ?? 10000]} color="#f59e0b" link="/admin?tab=settings" />
            </div>
          </div>
        );
      }

      case 'predictions': {
        const pa = predictionAnalytics as {
          kpis?: { overallAccuracy?: number; projectsWithForecasts?: number; types?: number };
          accuracy?: { overall?: number; byType?: Array<{ type: string; label: string; percent: number }> };
          series?: Array<{ type: string; label: string; unit: string; forecast: Array<{ label: string; value: number }> }>;
        } | null;
        const series = pa?.series ?? [];
        return (
          <div className="space-y-6">
            <p className="text-xs text-slate-500">Moving average + linear trend from operational history — no AI, no ML.</p>
            <KpiStrip items={[
              { label: 'Overall Accuracy', value: `${pa?.kpis?.overallAccuracy ?? pa?.accuracy?.overall ?? 0}%`, link: '/intelligence?tab=predictions&sub=accuracy' },
              { label: 'Forecast Types', value: pa?.kpis?.types ?? 8, link: '/intelligence?tab=predictions' },
              { label: 'Projects', value: pa?.kpis?.projectsWithForecasts ?? 0, link: '/intelligence?tab=predictions&sub=projects' },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              {series.map((s) => (
                <TrendChart
                  key={s.type}
                  title={s.label}
                  labels={s.forecast.map((f) => f.label)}
                  values={s.forecast.map((f) => f.value)}
                  color={s.type === 'budget' || s.type === 'fuel' ? '#22c55e' : '#8b5cf6'}
                  link="/intelligence?tab=predictions&sub=charts"
                  formatValue={(v) => (s.unit === 'currency' ? formatCurrency(v) : s.unit === 'percent' ? `${v}%` : s.unit === 'days' ? `${v}d` : String(v))}
                />
              ))}
            </div>
            <div className="command-card p-4">
              <h3 className="mb-3 font-semibold text-white">Accuracy by Type</h3>
              <div className="space-y-2">
                {(pa?.accuracy?.byType ?? []).map((a) => (
                  <div key={a.type} className="flex items-center gap-3">
                    <span className="w-40 truncate text-xs text-slate-400">{a.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-emerald-500/60" style={{ width: `${a.percent}%` }} />
                    </div>
                    <span className="w-10 font-mono text-xs text-white">{a.percent}%</span>
                  </div>
                ))}
              </div>
              <Link to="/intelligence?tab=predictions" className="mt-3 inline-block text-sm text-violet-400 hover:underline">Full prediction workspace →</Link>
            </div>
          </div>
        );
      }

      case 'forecasts': {
        const f = forecasts as {
          materialConsumption?: { historical: Array<{ label: string; quantity: number }>; forecast: Array<{ label: string; quantity: number }> };
          fuel?: { historical: Array<{ label: string; cost: number }>; forecast: Array<{ label: string; cost: number }> };
          maintenance?: { historical: Array<{ label: string; cost: number }>; forecast: Array<{ label: string; cost: number }> };
          projectCompletion?: { forecast: Array<{ label: string; avgProgress: number }> };
          method?: string;
        } | null;
        return (
          <div className="space-y-6">
            <p className="text-xs text-slate-500">Linear trend projections from historical operational data — no AI.</p>
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart title="Material Consumption Forecast" labels={f?.materialConsumption?.forecast?.map((x) => x.label) ?? []} values={f?.materialConsumption?.forecast?.map((x) => x.quantity) ?? []} color="#3b82f6" />
              <BarChart title="Fuel Cost Forecast" labels={f?.fuel?.forecast?.map((x) => x.label) ?? []} values={f?.fuel?.forecast?.map((x) => x.cost) ?? []} color="#f59e0b" />
              <BarChart title="Maintenance Forecast" labels={f?.maintenance?.forecast?.map((x) => x.label) ?? []} values={f?.maintenance?.forecast?.map((x) => x.cost) ?? []} color="#8b5cf6" />
              <BarChart title="Project Progress Forecast" labels={f?.projectCompletion?.forecast?.map((x) => x.label) ?? []} values={f?.projectCompletion?.forecast?.map((x) => x.avgProgress) ?? []} color="#22c55e" />
            </div>
          </div>
        );
      }

      case 'reports':
        return (
          <div className="space-y-6">
            <div className="command-card flex flex-wrap items-end gap-3 p-4">
              <div className="flex-1">
                <p className="mb-1 text-[10px] uppercase text-slate-500">Save current view</p>
                <input
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Report name…"
                  className="w-full max-w-sm rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                />
              </div>
              <button onClick={handleSaveReport} className="flex items-center gap-2 rounded-xl bg-accent/20 px-4 py-2 text-sm text-accent hover:bg-accent/30">
                <Save size={14} /> Save Report
              </button>
            </div>
            <div className="command-card divide-y divide-white/5">
              {savedReports.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-500">No saved reports yet</p>
              ) : (
                savedReports.map((r) => (
                  <div key={r._id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{r.name}</p>
                      <p className="text-[10px] text-slate-500">{r.section}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setTab(r.section as TabId)} className="text-xs text-accent">Open</button>
                      <button onClick={() => insightsApi.reports.delete(r._id).then(load)} className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'exports':
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {['overview', 'projects', 'supply-chain', 'assets', 'finance', 'compliance', 'workforce', 'brief'].map((section) => (
              <div key={section} className="command-card p-4">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-violet-400" />
                  <p className="font-medium capitalize text-white">{section.replace('-', ' ')}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => handleExport(section, 'csv')} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10">CSV</button>
                  <button onClick={() => handleExport(section, 'excel')} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10">Excel</button>
                  <button type="button" disabled className="cursor-not-allowed rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-600" title="PDF export — available in v1.1">PDF</button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'api-analytics': {
        const aa = apiAnalytics as {
          kpis?: {
            eventsTotal?: number; eventsLast24h?: number; activeRoutes?: number;
            pendingJobs?: number; failedRequests?: number; webhooks?: number;
            gatewaySuccessRate?: number; apiKeys?: number;
          };
          developer?: {
            tier?: string; applications?: number; oauthApps?: number; sandboxApps?: number;
            apiKeys?: number; requestsToday?: number; requestsLimit?: number;
            usageTrend?: Array<{ date: string; requests: number; errors: number }>;
          };
          eventTypes?: Array<{ eventType: string; count: number }>;
          trend?: Array<{ date: string; events: number; deliveries: number; failures: number }>;
          recentFailed?: Array<{ id: string; jobType: string; lastError?: string }>;
        } | null;
        const dev = aa?.developer;
        return (
          <div className="space-y-6">
            <p className="text-xs text-slate-500">API analytics — gateway throughput, developer platform usage, OAuth apps, and failures.</p>
            {dev && (
              <KpiStrip items={[
                { label: 'License', value: dev.tier || '—', link: '/developer?tab=license' },
                { label: 'OAuth Apps', value: dev.oauthApps ?? 0, link: '/developer?tab=applications' },
                { label: 'Dev API Keys', value: dev.apiKeys ?? 0, link: '/developer?tab=api-keys' },
                { label: 'Sandbox Apps', value: dev.sandboxApps ?? 0, link: '/developer?tab=sandbox' },
                { label: 'Requests Today', value: dev.requestsToday ?? 0, link: '/developer?tab=usage' },
                { label: 'Daily Limit', value: dev.requestsLimit ?? 0, link: '/developer?tab=license' },
              ]} />
            )}
            <KpiStrip items={[
              { label: 'Events Total', value: aa?.kpis?.eventsTotal ?? 0, link: '/integrations?tab=events' },
              { label: 'Events 24h', value: aa?.kpis?.eventsLast24h ?? 0, link: '/integrations?tab=events' },
              { label: 'Active Routes', value: aa?.kpis?.activeRoutes ?? 0, link: '/integrations?tab=gateway&sub=routes' },
              { label: 'Pending Jobs', value: aa?.kpis?.pendingJobs ?? 0, link: '/integrations?tab=gateway&sub=retries', warn: (aa?.kpis?.pendingJobs ?? 0) > 0 },
              { label: 'Failed', value: aa?.kpis?.failedRequests ?? 0, link: '/integrations?tab=gateway&sub=failed', warn: (aa?.kpis?.failedRequests ?? 0) > 0 },
              { label: 'Gateway %', value: `${aa?.kpis?.gatewaySuccessRate ?? 100}%`, link: '/integrations?tab=gateway' },
              { label: 'Webhooks', value: aa?.kpis?.webhooks ?? 0, link: '/integrations?tab=webhooks' },
              { label: 'API Keys', value: aa?.kpis?.apiKeys ?? 0, link: '/integrations?tab=gateway&sub=keys' },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart title="Event Volume" labels={aa?.trend?.map((t) => t.date) ?? []} values={aa?.trend?.map((t) => t.events) ?? []} color="#14b8a6" link="/integrations?tab=events" />
              <BarChart title="Deliveries vs Failures" labels={aa?.trend?.map((t) => t.date) ?? []} values={aa?.trend?.map((t) => t.deliveries) ?? []} color="#38bdf8" link="/integrations?tab=gateway" />
              <BarChart title="Top Event Types" labels={aa?.eventTypes?.map((t) => t.eventType) ?? []} values={aa?.eventTypes?.map((t) => t.count) ?? []} color="#a78bfa" link="/integrations?tab=events" />
              {dev?.usageTrend && dev.usageTrend.length > 0 && (
                <BarChart title="Developer API Usage" labels={dev.usageTrend.map((t) => t.date)} values={dev.usageTrend.map((t) => t.requests)} color="#8b5cf6" link="/developer?tab=usage" />
              )}
            </div>
            {(aa?.recentFailed?.length ?? 0) > 0 && (
              <div className="command-card p-4">
                <h3 className="mb-3 font-semibold text-red-400">Recent Failed Deliveries</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  {aa!.recentFailed!.map((f) => (
                    <li key={f.id}>{f.jobType}: {f.lastError || 'Unknown error'}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }

      case 'erp-analytics': {
        const ea = erpAnalytics as {
          kpis?: {
            erpConnectors?: number; activeJobs?: number; totalRuns?: number;
            openErrors?: number; runsLast24h?: number; successRate?: number;
          };
          trend?: Array<{ date: string; runs: number; synced: number; failed: number }>;
          byVendor?: Array<{ label: string; count: number }>;
          recentRuns?: Array<{ connectorName: string; status: string; recordsSynced: number; recordsProcessed: number }>;
          openErrors?: Array<{ connectorName: string; entityType: string; message: string }>;
        } | null;
        return (
          <div className="space-y-6">
            <p className="text-xs text-slate-500">ERP analytics — sync volume, vendor breakdown, errors, and success rates.</p>
            <KpiStrip items={[
              { label: 'ERP Connectors', value: ea?.kpis?.erpConnectors ?? 0, link: '/integrations?tab=erp&sub=connectors' },
              { label: 'Active Jobs', value: ea?.kpis?.activeJobs ?? 0, link: '/integrations?tab=erp&sub=jobs' },
              { label: 'Total Runs', value: ea?.kpis?.totalRuns ?? 0, link: '/integrations?tab=erp&sub=history' },
              { label: 'Open Errors', value: ea?.kpis?.openErrors ?? 0, link: '/integrations?tab=erp&sub=errors', warn: (ea?.kpis?.openErrors ?? 0) > 0 },
              { label: 'Runs (24h)', value: ea?.kpis?.runsLast24h ?? 0, link: '/integrations?tab=erp&sub=history' },
              { label: 'Success %', value: `${ea?.kpis?.successRate ?? 100}%`, link: '/integrations?tab=erp' },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart title="Sync Runs" labels={ea?.trend?.map((t) => t.date) ?? []} values={ea?.trend?.map((t) => t.runs) ?? []} color="#14b8a6" link="/integrations?tab=erp&sub=history" />
              <BarChart title="Records Synced" labels={ea?.trend?.map((t) => t.date) ?? []} values={ea?.trend?.map((t) => t.synced) ?? []} color="#38bdf8" link="/integrations?tab=erp" />
              <BarChart title="By Vendor" labels={ea?.byVendor?.map((v) => v.label) ?? []} values={ea?.byVendor?.map((v) => v.count) ?? []} color="#a78bfa" link="/integrations?tab=connectors&sub=marketplace" />
            </div>
            {(ea?.openErrors?.length ?? 0) > 0 && (
              <div className="command-card p-4">
                <h3 className="mb-3 font-semibold text-red-400">Open Sync Errors</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  {ea!.openErrors!.map((err, i) => (
                    <li key={i}>{err.connectorName} · {err.entityType}: {err.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }

      case 'device-analytics': {
        const da = deviceAnalytics as {
          kpis?: {
            fieldConnectors?: number; devices?: number; devicesOnline?: number;
            devicesOffline?: number; telemetryLast24h?: number;
          };
          byTelemetryType?: Array<{ type: string; count: number }>;
          trend?: Array<{ date: string; count: number }>;
          deviceHealth?: Array<{ name: string; health: string; deviceType: string }>;
        } | null;
        return (
          <div className="space-y-6">
            <p className="text-xs text-slate-500">Device analytics — field telemetry volume, health, and connector activity.</p>
            <KpiStrip items={[
              { label: 'Field Connectors', value: da?.kpis?.fieldConnectors ?? 0, link: '/integrations?tab=field' },
              { label: 'Devices', value: da?.kpis?.devices ?? 0, link: '/integrations?tab=field&sub=devices' },
              { label: 'Online', value: da?.kpis?.devicesOnline ?? 0, link: '/integrations?tab=field&sub=health' },
              { label: 'Offline', value: da?.kpis?.devicesOffline ?? 0, link: '/integrations?tab=field&sub=health', warn: (da?.kpis?.devicesOffline ?? 0) > 0 },
              { label: 'Telemetry (24h)', value: da?.kpis?.telemetryLast24h ?? 0, link: '/integrations?tab=field&sub=telemetry' },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart title="Telemetry Volume" labels={da?.trend?.map((t) => t.date) ?? []} values={da?.trend?.map((t) => t.count) ?? []} color="#14b8a6" link="/integrations?tab=field&sub=telemetry" />
              <BarChart title="By Telemetry Type" labels={da?.byTelemetryType?.map((t) => t.type) ?? []} values={da?.byTelemetryType?.map((t) => t.count) ?? []} color="#38bdf8" link="/integrations?tab=field" />
            </div>
            {(da?.deviceHealth?.length ?? 0) > 0 && (
              <div className="command-card p-4">
                <h3 className="mb-3 font-semibold text-amber-400">Device Health</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  {da!.deviceHealth!.slice(0, 8).map((d, i) => (
                    <li key={i}>{d.name} ({d.deviceType}): {d.health}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }

      case 'communication': {
        const ca = communicationAnalytics as {
          kpis?: {
            commConnectors?: number; templates?: number; queuePending?: number;
            deliveredLast24h?: number; failed?: number; activeCampaigns?: number; successRate?: number;
          };
          trend?: Array<{ date: string; total: number; delivered: number }>;
          byChannel?: Array<{ channel: string; count: number }>;
          recentMessages?: Array<{ channel: string; recipient: string; status: string }>;
          campaigns?: Array<{ name: string; status: string; deliveredCount?: number; failedCount?: number }>;
        } | null;
        return (
          <div className="space-y-6">
            <p className="text-xs text-slate-500">Communication analytics — delivery volume, channel mix, queue health, and campaign performance.</p>
            <KpiStrip items={[
              { label: 'Connectors', value: ca?.kpis?.commConnectors ?? 0, link: '/integrations?tab=comm' },
              { label: 'Templates', value: ca?.kpis?.templates ?? 0, link: '/integrations?tab=comm&sub=templates' },
              { label: 'Queue', value: ca?.kpis?.queuePending ?? 0, link: '/integrations?tab=comm&sub=queue', warn: (ca?.kpis?.queuePending ?? 0) > 0 },
              { label: 'Delivered (24h)', value: ca?.kpis?.deliveredLast24h ?? 0, link: '/integrations?tab=comm' },
              { label: 'Success %', value: `${ca?.kpis?.successRate ?? 100}%`, link: '/integrations?tab=comm' },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart title="Delivery Trend (7d)" labels={ca?.trend?.map((t) => t.date) ?? []} values={ca?.trend?.map((t) => t.delivered) ?? []} color="#14b8a6" link="/integrations?tab=comm&sub=queue" />
              <BarChart title="By Channel" labels={ca?.byChannel?.map((c) => c.channel) ?? []} values={ca?.byChannel?.map((c) => c.count) ?? []} color="#38bdf8" link="/integrations?tab=comm" />
            </div>
            {(ca?.campaigns?.length ?? 0) > 0 && (
              <div className="command-card p-4">
                <h3 className="mb-3 font-semibold text-violet-400">Recent Campaigns</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  {ca!.campaigns!.slice(0, 8).map((c, i) => (
                    <li key={i}>{c.name} — {c.status} · delivered {c.deliveredCount ?? 0} · failed {c.failedCount ?? 0}</li>
                  ))}
                </ul>
              </div>
            )}
            {(ca?.recentMessages?.length ?? 0) > 0 && (
              <div className="command-card p-4">
                <h3 className="mb-3 font-semibold text-slate-300">Recent Messages</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  {ca!.recentMessages!.slice(0, 8).map((m, i) => (
                    <li key={i}>{m.channel} → {m.recipient}: {m.status}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }

      case 'organization-analytics': {
        const oa = organizationAnalytics as {
          kpis?: { organizations?: number; parentCompanies?: number; totalProjects?: number; totalUsers?: number };
          organizations?: Array<{ id: string; name: string; code?: string; projects: number; activeProjects: number; users: number; orgUnits: number; link: string }>;
          byParent?: Array<{ id: string; name: string; code: string; orgCount: number }>;
        } | null;
        return (
          <div className="space-y-6">
            <p className="text-xs text-slate-500">Organization analytics — multi-tenant footprint, project distribution, and hierarchy coverage.</p>
            <KpiStrip items={[
              { label: 'Organizations', value: oa?.kpis?.organizations ?? 0, link: '/enterprise' },
              { label: 'Parent Companies', value: oa?.kpis?.parentCompanies ?? 0, link: '/enterprise' },
              { label: 'Total Projects', value: oa?.kpis?.totalProjects ?? 0, link: '/projects' },
              { label: 'Total Users', value: oa?.kpis?.totalUsers ?? 0, link: '/admin?tab=users' },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart title="Projects by Organization" labels={oa?.organizations?.map((o) => o.code || o.name) ?? []} values={oa?.organizations?.map((o) => o.projects) ?? []} color="#8b5cf6" link="/enterprise" />
              <BarChart title="Users by Organization" labels={oa?.organizations?.map((o) => o.code || o.name) ?? []} values={oa?.organizations?.map((o) => o.users) ?? []} color="#38bdf8" link="/admin?tab=users" />
            </div>
            {(oa?.organizations?.length ?? 0) > 0 && (
              <div className="command-card p-4">
                <h3 className="mb-3 font-semibold text-violet-400">Organization Breakdown</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  {oa!.organizations!.map((o) => (
                    <li key={o.id}>
                      <Link to={o.link} className="hover:text-violet-300">{o.name}</Link>
                      {' — '}{o.projects} projects · {o.users} users · {o.orgUnits} org units
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }

      case 'global-analytics': {
        const ga = globalAnalytics as {
          kpis?: { countries?: number; currencies?: number; timezones?: number; languages?: number; regionalProfiles?: number; organizations?: number };
          byCountry?: Array<{ countryCode: string; countryName: string; regions: number; organizations: number }>;
          byCurrency?: Array<{ code: string; name: string; symbol: string; regions: number }>;
          byTimezone?: Array<{ id: string; label: string; regions: number }>;
          byLanguage?: Array<{ code: string; name: string; nativeName: string; regions: number }>;
          complianceCoverage?: Array<{ id: string; name: string; countryCode: string; regions: number; requirements: string[] }>;
        } | null;
        return (
          <div className="space-y-6">
            <p className="text-xs text-slate-500">Global analytics — multi-country operations, currency mix, timezone coverage, and regional compliance.</p>
            <KpiStrip items={[
              { label: 'Countries', value: ga?.kpis?.countries ?? 0, link: '/enterprise?tab=regional' },
              { label: 'Currencies', value: ga?.kpis?.currencies ?? 0, link: '/enterprise?tab=regional' },
              { label: 'Timezones', value: ga?.kpis?.timezones ?? 0, link: '/enterprise?tab=localization' },
              { label: 'Languages', value: ga?.kpis?.languages ?? 0, link: '/enterprise?tab=localization' },
              { label: 'Regional Profiles', value: ga?.kpis?.regionalProfiles ?? 0, link: '/enterprise?tab=regional' },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart title="Regions by Country" labels={ga?.byCountry?.map((c) => c.countryCode) ?? []} values={ga?.byCountry?.map((c) => c.regions) ?? []} color="#8b5cf6" link="/enterprise?tab=regional" />
              <BarChart title="Regions by Currency" labels={ga?.byCurrency?.map((c) => c.code) ?? []} values={ga?.byCurrency?.map((c) => c.regions) ?? []} color="#14b8a6" link="/enterprise?tab=regional" />
            </div>
            {(ga?.complianceCoverage?.length ?? 0) > 0 && (
              <div className="command-card p-4">
                <h3 className="mb-3 font-semibold text-amber-400">Regional Compliance Coverage</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  {ga!.complianceCoverage!.map((c) => (
                    <li key={c.id}>{c.name} ({c.countryCode}) — {c.regions} region{c.regions !== 1 ? 's' : ''} · {c.requirements.slice(0, 3).join(', ')}</li>
                  ))}
                </ul>
              </div>
            )}
            {(ga?.byLanguage?.length ?? 0) > 0 && (
              <div className="command-card p-4">
                <h3 className="mb-3 font-semibold text-sky-400">Languages in Use</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  {ga!.byLanguage!.map((l) => (
                    <li key={l.code}>{l.nativeName} ({l.code}) — {l.regions} region{l.regions !== 1 ? 's' : ''}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }

      case 'integrations': {
        const ia = integrationAnalytics as {
          kpis?: { installed?: number; connected?: number; errors?: number; successPercent?: number; avgResponseTimeMs?: number };
          trend?: Array<{ date: string; success: number; errors: number }>;
          errorLogs?: Array<{ connectorName: string; message: string; at?: string }>;
          byCategory?: Array<{ label: string; count: number }>;
        } | null;
        return (
          <div className="space-y-6">
            <p className="text-xs text-slate-500">Integration analytics — connector health, requests, and error trends.</p>
            <KpiStrip items={[
              { label: 'Installed', value: ia?.kpis?.installed ?? 0, link: '/integrations?tab=connectors&sub=installed' },
              { label: 'Connected', value: ia?.kpis?.connected ?? 0, link: '/integrations' },
              { label: 'Errors', value: ia?.kpis?.errors ?? 0, link: '/integrations?tab=connectors&sub=logs', warn: (ia?.kpis?.errors ?? 0) > 0 },
              { label: 'Success %', value: `${ia?.kpis?.successPercent ?? 100}%`, link: '/integrations' },
              { label: 'Avg Response', value: `${ia?.kpis?.avgResponseTimeMs ?? 0}ms`, link: '/integrations' },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BarChart title="Activity Trend" labels={ia?.trend?.map((t) => t.date) ?? []} values={ia?.trend?.map((t) => t.success) ?? []} color="#14b8a6" link="/integrations?tab=connectors&sub=logs" />
              <BarChart title="Marketplace by Category" labels={ia?.byCategory?.map((c) => c.label) ?? []} values={ia?.byCategory?.map((c) => c.count) ?? []} color="#38bdf8" link="/integrations?tab=connectors&sub=marketplace" />
            </div>
            {(ia?.errorLogs?.length ?? 0) > 0 && (
              <div className="command-card p-4">
                <h3 className="mb-3 font-semibold text-red-400">Recent Errors</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  {ia!.errorLogs!.map((e, i) => (
                    <li key={i}>{e.connectorName}: {e.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }

      case 'brief': {
        const b = brief as {
          summary?: string;
          kpis?: { overallRisk?: number; operationalHealth?: number; criticalRecommendations?: number; forecastAccuracy?: number };
          operationalHealth?: { score?: number; label?: string };
          topRisks?: Array<{ title: string; score: number; severity: string; link: string }>;
          topRecommendations?: Array<{ title: string; message: string; score: number; link: string }>;
          topOpportunities?: Array<{ title: string; message: string; score: number; link: string }>;
          forecastSummary?: { overallAccuracy?: number; horizon?: string };
          daily?: { title?: string; headline?: string };
          sections?: Array<{ domain: string; items: Array<{ label: string; value: string | number; link: string }> }>;
        } | null;
        return (
          <div className="space-y-6">
            <p className="text-xs text-slate-500">Executive Intelligence Dashboard — template-driven, no LLM, no chatbot.</p>
            <div className="command-card p-5">
              <h2 className="text-lg font-bold text-white">{b?.daily?.title || 'Executive Intelligence'}</h2>
              <p className="mt-2 text-sm text-slate-400">{b?.summary || b?.daily?.headline}</p>
            </div>
            <KpiStrip items={[
              { label: 'Operational Health', value: `${b?.operationalHealth?.score ?? b?.kpis?.operationalHealth ?? 0} (${b?.operationalHealth?.label ?? '—'})`, link: '/intelligence?tab=briefs' },
              { label: 'Overall Risk', value: b?.kpis?.overallRisk ?? 0, link: '/intelligence?tab=risks', warn: (b?.kpis?.overallRisk ?? 0) > 60 },
              { label: 'Critical Recs', value: b?.kpis?.criticalRecommendations ?? 0, link: '/intelligence?tab=recommendations', warn: (b?.kpis?.criticalRecommendations ?? 0) > 0 },
              { label: 'Forecast Accuracy', value: `${b?.forecastSummary?.overallAccuracy ?? b?.kpis?.forecastAccuracy ?? 0}%`, link: '/intelligence?tab=predictions' },
            ]} />
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="command-card p-4">
                <h3 className="mb-3 font-semibold text-red-400">Top Risks</h3>
                <ul className="space-y-2">
                  {(b?.topRisks || []).slice(0, 5).map((r, i) => (
                    <li key={i}><Link to={r.link} className="flex justify-between text-sm hover:text-red-300"><span>{r.title}</span><span className="font-mono">{r.score}</span></Link></li>
                  ))}
                </ul>
              </div>
              <div className="command-card p-4">
                <h3 className="mb-3 font-semibold text-violet-400">Top Recommendations</h3>
                <ul className="space-y-2">
                  {(b?.topRecommendations || []).slice(0, 5).map((r, i) => (
                    <li key={i} className="text-sm text-slate-300">{r.title} <span className="font-mono text-violet-400">{r.score}</span></li>
                  ))}
                </ul>
              </div>
              <div className="command-card p-4">
                <h3 className="mb-3 font-semibold text-emerald-400">Top Opportunities</h3>
                <ul className="space-y-2">
                  {(b?.topOpportunities || []).slice(0, 5).map((o, i) => (
                    <li key={i} className="text-sm text-slate-300">{o.title}</li>
                  ))}
                </ul>
              </div>
              <div className="command-card p-4">
                <h3 className="mb-3 font-semibold text-amber-400">Forecast Summary</h3>
                <p className="text-sm text-slate-400">Horizon: {b?.forecastSummary?.horizon ?? '3 months'}</p>
                <p className="text-sm text-slate-400">Accuracy: {b?.forecastSummary?.overallAccuracy ?? 0}%</p>
                <Link to="/intelligence?tab=predictions" className="mt-2 inline-block text-xs text-violet-400 hover:underline">View predictions →</Link>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {b?.sections?.map((s) => (
                <div key={s.domain} className="command-card p-5">
                  <h3 className="font-semibold text-white">{s.domain}</h3>
                  <ul className="mt-3 space-y-2">
                    {s.items.map((item) => (
                      <li key={item.label}>
                        <Link to={item.link} className="flex justify-between text-sm hover:text-accent">
                          <span className="text-slate-400">{item.label}</span>
                          <span className="font-mono font-semibold text-white">{item.value}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Link to="/intelligence?tab=briefs" className="text-sm text-violet-400 hover:underline">Full executive workspace →</Link>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  }, [tab, loading, overview, projects, supplyChain, assets, finance, compliance, workforce, safety, permits, quality, operational, recommendations, predictionAnalytics, risks, rulesAnalytics, platform, forecasts, brief, integrationAnalytics, savedReports, o]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-violet-400">Insights Workspace</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white">Analytics & Reporting</h1>
          <p className="mt-1 text-sm text-slate-500">Why it happened — trends, comparisons, and exportable reports from live data</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400 hover:text-white">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Refresh
        </button>
      </div>

      <div className="command-card flex items-center gap-3 p-3">
        <Search size={16} className="text-violet-400" />
        <input
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
          placeholder="Search reports and analytics sections…"
          className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
        />
      </div>
      {searchResults && (searchResults.reports.length > 0 || searchResults.sections.length > 0) && (
        <div className="command-card p-3 text-sm">
          {searchResults.sections.map((s) => (
            <Link key={s.id} to={s.path} className="block rounded-lg px-3 py-2 hover:bg-white/5">{s.label}</Link>
          ))}
          {searchResults.reports.map((r) => (
            <Link key={r.id} to={r.path} className="block rounded-lg px-3 py-2 hover:bg-white/5">Report: {r.name}</Link>
          ))}
        </div>
      )}

      <InsightsFilters filters={filters} onChange={setFilters} />

      <div className="flex flex-wrap gap-1 border-b border-white/10 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-t-lg px-3 py-2 text-xs font-medium transition-colors',
              tab === t.id ? 'bg-violet-500/15 text-violet-300' : 'text-slate-500 hover:text-slate-300',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {!error && tabContent}
    </div>
  );
}
