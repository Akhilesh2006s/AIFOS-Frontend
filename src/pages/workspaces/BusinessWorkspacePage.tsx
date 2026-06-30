import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { IndianRupee, TrendingUp, AlertTriangle, Activity, ChevronRight, ChevronDown, Clock, Map } from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { CommandChartCard } from '@/components/command/CommandChartCard';
import { moduleApi } from '@/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { explorerPath } from '@/lib/explorerLinks';
import type { EChartsOption } from 'echarts';

const TABS = ['overview', 'budget', 'drivers', 'heatmap', 'timeline', 'recommendations', 'projects'] as const;
const STATUS_STYLE = { healthy: 'bg-emerald-500/20 text-emerald-300', watch: 'bg-amber-500/20 text-amber-300', over: 'bg-red-500/20 text-red-300' };

interface DashboardData {
  kpis: {
    totalBudget: number;
    actualSpend: number;
    committedCost: number;
    remainingBudget: number;
    utilizationPercent: number;
    variance: number;
    projectsOverBudget: number;
  };
  budgetVsActual: Array<{ category: string; budget: number; actual: number; committed: number; remaining: number; utilizationPercent: number }>;
  topCostDrivers: Array<{ category: string; actualCost: number; committedCost: number; total: number }>;
  projectSummaries: Array<{
    projectId: string;
    name: string;
    code: string;
    allocatedBudget: number;
    actualCost: number;
    committedCost: number;
    remainingBudget: number;
    utilizationPercent: number;
    overBudget: boolean;
    link: string;
  }>;
  cashRequirementForecast: { horizon30: number; horizon60: number; horizon90: number; note: string };
  pendingVendorBills: Array<{ id: string; billNumber: string; invoiceNumber: string; totalAmount: number; status: string; link: string }>;
  recentFinancialEvents: Array<{ eventType: string; description?: string; amount: number; costCategory: string; recordedAt: string }>;
  monthlySpend: Array<{ month: string; amount: number }>;
}

type HeatNode = { id: string; label: string; status: keyof typeof STATUS_STYLE; utilizationPercent: number; actual: number; committed: number; link: string; children?: HeatNode[] };
type DriverRow = { category: string; budget: number; actual: number; committed: number; variance: number; contributionPercent: number; trend: string; trendPercent: number; link: string };
type TimelineRow = { date: string; label: string; amount: number; cumulative: number; costCategory: string; link: string };
type RecRow = { id: string; severity: string; title: string; message: string; link: string };

function HeatTree({ nodes, depth = 0 }: { nodes: HeatNode[]; depth?: number }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <ul className={depth ? 'ml-4 border-l border-white/5 pl-3' : ''}>
      {nodes.map((n) => {
        const hasChildren = (n.children?.length ?? 0) > 0;
        const isOpen = open[n.id] ?? depth < 1;
        return (
          <li key={n.id} className="py-1">
            <div className="flex items-center gap-2 text-sm">
              {hasChildren ? (
                <button type="button" onClick={() => setOpen((o) => ({ ...o, [n.id]: !isOpen }))} className="text-slate-500">
                  {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : <span className="w-[14px]" />}
              <Link to={n.link} className={`rounded px-2 py-0.5 text-xs ${STATUS_STYLE[n.status]}`}>{n.label}</Link>
              <span className="font-mono text-xs text-slate-500">{n.utilizationPercent}%</span>
              <span className="ml-auto font-mono text-xs text-white">{formatCurrency(n.actual + n.committed)}</span>
            </div>
            {hasChildren && isOpen && <HeatTree nodes={n.children!} depth={depth + 1} />}
          </li>
        );
      })}
    </ul>
  );
}

export function BusinessWorkspacePage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || undefined;
  const tab = searchParams.get('tab') || 'overview';
  if (tab === 'documents') return <Navigate to="/business/documents" replace />;
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [heatmap, setHeatmap] = useState<HeatNode[]>([]);
  const [timeline, setTimeline] = useState<TimelineRow[]>([]);
  const [recommendations, setRecommendations] = useState<RecRow[]>([]);
  const [forecast, setForecast] = useState<{ forecastFinalCost: number; costGrowthRate?: number } | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | undefined>(projectId);

  useEffect(() => {
    setLoading(true);
    const params = selectedProject ? { projectId: selectedProject } : undefined;
    Promise.all([
      moduleApi.business.dashboard(selectedProject),
      moduleApi.business.costDrivers(params),
      moduleApi.business.heatmap(selectedProject),
      moduleApi.business.costTimeline(params),
      moduleApi.business.recommendations(selectedProject),
      selectedProject ? moduleApi.business.projectForecast(selectedProject) : Promise.resolve({ data: null }),
    ])
      .then(([dash, drv, heat, time, recs, fc]) => {
        setDashboard(dash.data);
        setDrivers(drv.data);
        setHeatmap(heat.data);
        setTimeline(time.data);
        setRecommendations(recs.data);
        setForecast(fc.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedProject]);

  const k = dashboard?.kpis;

  const budgetChartOption: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Budget', 'Actual', 'Committed'], textStyle: { color: '#94a3b8' } },
    xAxis: {
      type: 'category',
      data: dashboard?.budgetVsActual.map((b) => b.category) ?? [],
      axisLabel: { color: '#64748b', rotate: 20 },
    },
    yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#1e293b' } } },
    series: [
      { name: 'Budget', type: 'bar', data: dashboard?.budgetVsActual.map((b) => b.budget) ?? [], itemStyle: { color: '#38BDF8' } },
      { name: 'Actual', type: 'bar', data: dashboard?.budgetVsActual.map((b) => b.actual) ?? [], itemStyle: { color: '#22C55E' } },
      { name: 'Committed', type: 'bar', data: dashboard?.budgetVsActual.map((b) => b.committed) ?? [], itemStyle: { color: '#F97316' } },
    ],
    grid: { left: 48, right: 16, bottom: 48, top: 40 },
  };

  const trendOption: EChartsOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: dashboard?.monthlySpend.map((m) => m.month) ?? [], axisLabel: { color: '#64748b' } },
    yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#1e293b' } } },
    series: [{ type: 'line', data: dashboard?.monthlySpend.map((m) => m.amount) ?? [], smooth: true, itemStyle: { color: '#10B981' } }],
    grid: { left: 48, right: 16, bottom: 32, top: 24 },
  };

  const timelineOption: EChartsOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: timeline.map((t) => formatDate(t.date)), axisLabel: { color: '#64748b', rotate: 25 } },
    yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#1e293b' } } },
    series: [{ type: 'line', data: timeline.map((t) => t.cumulative), smooth: true, areaStyle: { opacity: 0.12 }, itemStyle: { color: '#38BDF8' } }],
    grid: { left: 56, right: 16, bottom: 48, top: 24 },
  };

  const tabLink = (t: string) => `/business?tab=${t}${selectedProject ? `&projectId=${selectedProject}` : ''}`;

  return (
    <ModulePageLayout
      title="Business Workspace"
      subtitle="Operational financial intelligence — budget, spend, and cost drivers from live project data"
      loading={loading}
      stats={[
        { label: 'Total Budget', value: k ? formatCurrency(k.totalBudget) : '—', color: '#38BDF8' },
        { label: 'Actual Spend', value: k ? formatCurrency(k.actualSpend) : '—', color: '#22C55E' },
        { label: 'Committed', value: k ? formatCurrency(k.committedCost) : '—', color: '#F97316' },
        { label: 'Remaining', value: k ? formatCurrency(k.remainingBudget) : '—', color: '#A78BFA' },
        { label: 'Utilization', value: k ? `${k.utilizationPercent}%` : '—', color: '#EAB308' },
        { label: 'Forecast', value: forecast ? formatCurrency(forecast.forecastFinalCost) : '—', color: '#8B5CF6' },
      ]}
      heroActions={
        <select
          value={selectedProject ?? ''}
          onChange={(e) => setSelectedProject(e.target.value || undefined)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        >
          <option value="">All Projects</option>
          {dashboard?.projectSummaries.map((p) => (
            <option key={p.projectId} value={p.projectId}>{p.name}</option>
          ))}
        </select>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t}
            to={tabLink(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${tab === t ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:text-white'}`}
          >
            {t === 'budget' ? 'Budget vs Actual' : t === 'drivers' ? 'Cost Drivers' : t}
          </Link>
        ))}
      </div>

      {(tab === 'overview' || tab === 'budget') && dashboard && (
        <div className="grid gap-4 lg:grid-cols-2">
          <CommandChartCard title="Budget vs Actual" subtitle="By cost category — from fin_actuals_snapshot" option={budgetChartOption} />
          <CommandChartCard title="Spend Trend" subtitle="Recent financial events by month" option={trendOption} />
        </div>
      )}

      {tab === 'overview' && dashboard && (
        <>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="command-card p-5 lg:col-span-1">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <TrendingUp size={16} className="text-emerald-400" /> Top Cost Drivers
              </h3>
              <ul className="mt-3 space-y-2">
                {dashboard.topCostDrivers.map((d) => (
                  <li key={d.category} className="flex justify-between text-sm">
                    <span className="text-slate-400">{d.category}</span>
                    <span className="font-mono text-white">{formatCurrency(d.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="command-card p-5 lg:col-span-1">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <IndianRupee size={16} className="text-sky-400" /> Cash Requirement Forecast
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex justify-between"><span className="text-slate-500">30 days</span><span className="font-mono">{formatCurrency(dashboard.cashRequirementForecast.horizon30)}</span></li>
                <li className="flex justify-between"><span className="text-slate-500">60 days</span><span className="font-mono">{formatCurrency(dashboard.cashRequirementForecast.horizon60)}</span></li>
                <li className="flex justify-between"><span className="text-slate-500">90 days</span><span className="font-mono">{formatCurrency(dashboard.cashRequirementForecast.horizon90)}</span></li>
              </ul>
              <p className="mt-3 text-[10px] text-slate-600">{dashboard.cashRequirementForecast.note}</p>
            </div>
            <div className="command-card p-5 lg:col-span-1">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <AlertTriangle size={16} className="text-amber-400" /> Pending Vendor Bills
              </h3>
              <ul className="mt-3 divide-y divide-white/5">
                {dashboard.pendingVendorBills.length === 0 ? (
                  <li className="py-2 text-sm text-slate-500">No pending vendor bills</li>
                ) : (
                  dashboard.pendingVendorBills.map((b) => (
                    <li key={b.id} className="flex justify-between py-2 text-sm">
                      <Link to={b.link?.startsWith('/explore') ? b.link : explorerPath('vendor-bill', b.id)} className="text-slate-300 hover:text-white">{b.invoiceNumber || b.billNumber}</Link>
                      <span className="font-mono text-xs">{formatCurrency(b.totalAmount)}</span>
                    </li>
                  ))
                )}
              </ul>
              <Link to="/business/vendor-bills" className="mt-2 inline-block text-xs text-accent hover:underline">View all vendor bills →</Link>
            </div>
          </div>

          <div className="command-card mt-4 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Activity size={16} className="text-accent" /> Recent Financial Events
            </h3>
            <ul className="mt-3 divide-y divide-white/5">
              {dashboard.recentFinancialEvents.slice(0, 12).map((e, i) => (
                <li key={i} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-300">
                    <span className="mr-2 text-[10px] uppercase text-slate-500">{e.eventType}</span>
                    {e.description || e.costCategory}
                  </span>
                  <span className="font-mono text-xs text-accent">{formatCurrency(e.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {tab === 'drivers' && (
        <div className="command-card overflow-x-auto p-0">
          <div className="border-b border-white/5 px-5 py-3">
            <h3 className="text-sm font-semibold text-white">Cost Driver Analysis</h3>
            <p className="text-[10px] text-slate-500">Sorted by cost contribution — budget, actual, variance, trend</p>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Budget</th>
                <th className="px-5 py-3">Actual</th>
                <th className="px-5 py-3">Variance</th>
                <th className="px-5 py-3">Share %</th>
                <th className="px-5 py-3">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {drivers.map((d) => (
                <tr key={d.category}>
                  <td className="px-5 py-3"><Link to={d.link} className="font-medium text-white hover:text-accent">{d.category}</Link></td>
                  <td className="px-5 py-3 font-mono text-xs">{formatCurrency(d.budget)}</td>
                  <td className="px-5 py-3 font-mono text-xs">{formatCurrency(d.actual + d.committed)}</td>
                  <td className={`px-5 py-3 font-mono text-xs ${d.variance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatCurrency(d.variance)}</td>
                  <td className="px-5 py-3 font-mono text-xs">{d.contributionPercent}%</td>
                  <td className={`px-5 py-3 text-xs ${d.trend === 'up' ? 'text-red-400' : d.trend === 'down' ? 'text-emerald-400' : 'text-slate-500'}`}>{d.trendPercent}% {d.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'heatmap' && (
        <div className="command-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Map size={16} className="text-sky-400" /> Budget Heat Map
          </h3>
          <p className="text-[10px] text-slate-500">Green = healthy · Amber = watch · Red = over budget</p>
          <div className="mt-4">
            {heatmap.length === 0 ? <p className="text-sm text-slate-500">No heat map data</p> : <HeatTree nodes={heatmap} />}
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="space-y-4">
          <CommandChartCard title="Cumulative Project Spend" subtitle="Every financial event chronologically" option={timelineOption} />
          <div className="command-card p-0">
            <div className="border-b border-white/5 px-5 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><Clock size={16} /> Event Timeline</h3>
            </div>
            <ul className="max-h-96 divide-y divide-white/5 overflow-y-auto">
              {timeline.map((e, i) => (
                <li key={i} className="flex items-center justify-between px-5 py-2 text-sm">
                  <div>
                    <Link to={e.link} className="text-slate-300 hover:text-white">{e.label}</Link>
                    <p className="text-[10px] text-slate-600">{formatDate(e.date)} · {e.costCategory}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs text-accent">{formatCurrency(e.amount)}</span>
                    <p className="font-mono text-[10px] text-slate-500">Σ {formatCurrency(e.cumulative)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'recommendations' && (
        <div className="command-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <AlertTriangle size={16} className="text-amber-400" /> Executive Recommendations
          </h3>
          <p className="text-[10px] text-slate-500">Deterministic rules from live operational data — no AI</p>
          <ul className="mt-4 space-y-3">
            {recommendations.length === 0 ? (
              <li className="text-sm text-slate-500">No recommendations at this time</li>
            ) : recommendations.map((r) => (
              <li key={r.id}>
                <Link
                  to={r.link}
                  className={`block rounded-lg border px-4 py-3 hover:border-white/20 ${r.severity === 'critical' ? 'border-red-500/30 bg-red-500/5' : r.severity === 'warning' ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10'}`}
                >
                  <p className="text-sm font-medium text-white">{r.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{r.message}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(tab === 'overview' || tab === 'projects') && dashboard && (
        <div className="command-card mt-4 overflow-x-auto p-0">
          <div className="border-b border-white/5 px-5 py-3">
            <h3 className="text-sm font-semibold text-white">Project Cost Summary</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Project</th>
                <th className="px-5 py-3">Budget</th>
                <th className="px-5 py-3">Actual</th>
                <th className="px-5 py-3">Committed</th>
                <th className="px-5 py-3">Remaining</th>
                <th className="px-5 py-3">Util %</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dashboard.projectSummaries.map((p) => (
                <tr key={p.projectId} className={p.overBudget ? 'bg-red-500/5' : ''}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-white">{p.name}</p>
                    <p className="text-[10px] text-slate-500">{p.code}</p>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">{formatCurrency(p.allocatedBudget)}</td>
                  <td className="px-5 py-3 font-mono text-xs">{formatCurrency(p.actualCost)}</td>
                  <td className="px-5 py-3 font-mono text-xs">{formatCurrency(p.committedCost)}</td>
                  <td className="px-5 py-3 font-mono text-xs">{formatCurrency(p.remainingBudget)}</td>
                  <td className="px-5 py-3 font-mono text-xs">{p.utilizationPercent}%</td>
                  <td className="px-5 py-3">
                    <Link to={`/business?projectId=${p.projectId}`} className="text-accent hover:underline">
                      <ChevronRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Link to="/compliance" className="command-card flex items-center gap-3 p-4 hover:border-white/15">
          <span className="text-sm text-slate-300">Compliance</span>
          <ChevronRight size={14} className="ml-auto text-slate-600" />
        </Link>
        <Link to="/business/payments" className="command-card flex items-center gap-3 p-4 hover:border-white/15">
          <span className="text-sm text-slate-300">Payments & Cash Flow</span>
          <ChevronRight size={14} className="ml-auto text-slate-600" />
        </Link>
        <Link to="/business/vendor-bills" className="command-card flex items-center gap-3 p-4 hover:border-white/15">
          <span className="text-sm text-slate-300">Vendor Bills</span>
          <ChevronRight size={14} className="ml-auto text-slate-600" />
        </Link>
        <Link to="/insights?tab=finance" className="command-card flex items-center gap-3 p-4 hover:border-white/15">
          <span className="text-sm text-slate-300">Finance Analytics</span>
          <ChevronRight size={14} className="ml-auto text-slate-600" />
        </Link>
        <Link to="/finance" className="command-card flex items-center gap-3 p-4 hover:border-white/15">
          <span className="text-sm text-slate-300">Finance Module (legacy)</span>
          <ChevronRight size={14} className="ml-auto text-slate-600" />
        </Link>
      </div>
    </ModulePageLayout>
  );
}
