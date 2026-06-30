import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronDown, ChevronRight, TrendingUp } from 'lucide-react';
import { moduleApi } from '@/api/client';
import { CommandChartCard } from '@/components/command/CommandChartCard';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { EChartsOption } from 'echarts';

interface Intelligence {
  metrics: {
    budget: number;
    committedCost: number;
    actualCost: number;
    remainingBudget: number;
    variance: number;
    variancePercent: number;
    utilizationPercent: number;
    forecastFinalCost: number;
    costGrowthRate: number;
  };
  topCostDrivers: Array<{
    category: string;
    budget: number;
    actual: number;
    committed: number;
    variance: number;
    variancePercent: number;
    contributionPercent: number;
    trend: string;
    trendPercent: number;
    link: string;
  }>;
  budgetUtilizationTrend: Array<{ month: string; spend: number; cumulative: number }>;
  varianceTrend: Array<{ category: string; variance: number; variancePercent: number }>;
  costCategoryDistribution: Array<{ category: string; value: number; percent: number }>;
  vendorCostDistribution: Array<{ vendorId: string; spend: number; poCount: number; link: string }>;
  equipmentCostDistribution: Array<{ equipmentId: string; name?: string; code?: string; total: number; link: string }>;
  fuelTrend?: { actual: number; trend: string; trendPercent: number };
  maintenanceTrend?: { actual: number; trend: string; trendPercent: number };
  forecastFinalCost: number;
  timeline: Array<{ date: string; label: string; amount: number; cumulative: number; link: string }>;
  recommendations: Array<{ id: string; severity: string; title: string; message: string; link: string }>;
  vendorBills?: {
    pendingAmount: number;
    approvedAmount: number;
    blockedAmount: number;
    counts: { total: number; pending: number; blocked: number; approved: number; readyForPayment: number };
    vendorBills: Array<{ id: string; billNumber: string; invoiceNumber: string; totalAmount: number; status: string; link: string }>;
  };
  payments?: {
    outstandingPayables: number;
    scheduledPayments: number;
    paidAmount: number;
    cashRequirement: number;
    vendorAging: Record<string, number>;
    counts: { outstanding: number; scheduled: number; paid: number };
  };
}

type HeatNode = {
  id: string;
  label: string;
  level: string;
  budget: number;
  actual: number;
  committed: number;
  utilizationPercent: number;
  status: 'healthy' | 'watch' | 'over';
  link: string;
  children?: HeatNode[];
};

const STATUS_COLOR = { healthy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', watch: 'bg-amber-500/20 text-amber-300 border-amber-500/30', over: 'bg-red-500/20 text-red-300 border-red-500/30' };

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
              <Link to={n.link} className={`rounded border px-2 py-0.5 text-xs capitalize ${STATUS_COLOR[n.status]}`}>
                {n.label}
              </Link>
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

export function ProjectFinancialTab({ projectId }: { projectId: string }) {
  const [data, setData] = useState<Intelligence | null>(null);
  const [heatmap, setHeatmap] = useState<HeatNode[]>([]);
  const [breakdown, setBreakdown] = useState<Record<string, Array<{ eventType: string; amount: number; date: string; relatedEntity?: string; link: string }>>>({});
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  useEffect(() => {
    moduleApi.business.projectIntelligence(projectId).then((r) => setData(r.data));
    moduleApi.business.projectHeatmap(projectId).then((r) => setHeatmap(r.data));
  }, [projectId]);

  useEffect(() => {
    if (!expandedCat) return;
    moduleApi.business.projectBreakdown(projectId, expandedCat).then((r) => {
      const items = (r.data as Record<string, typeof breakdown[string]>)[expandedCat] ?? [];
      setBreakdown((b) => ({ ...b, [expandedCat]: items }));
    });
  }, [projectId, expandedCat]);

  if (!data) return <div className="command-card p-8 text-center text-sm text-slate-500">Loading financial intelligence…</div>;

  const m = data.metrics;
  const timelineOption: EChartsOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.timeline.map((t) => formatDate(t.date)), axisLabel: { color: '#64748b', rotate: 30 } },
    yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#1e293b' } } },
    series: [{ type: 'line', data: data.timeline.map((t) => t.cumulative), smooth: true, areaStyle: { opacity: 0.15 }, itemStyle: { color: '#10B981' } }],
    grid: { left: 56, right: 16, bottom: 56, top: 24 },
  };

  const monthlyOption: EChartsOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.budgetUtilizationTrend.map((t) => t.month), axisLabel: { color: '#64748b' } },
    yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#1e293b' } } },
    series: [{ type: 'bar', data: data.budgetUtilizationTrend.map((t) => t.spend), itemStyle: { color: '#38BDF8' } }],
    grid: { left: 48, right: 16, bottom: 32, top: 24 },
  };

  const driverOption: EChartsOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: data.costCategoryDistribution.map((d) => ({ name: d.category, value: d.value })),
      label: { color: '#94a3b8' },
    }],
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Budget', value: formatCurrency(m.budget), color: '#38BDF8' },
          { label: 'Actual Spend', value: formatCurrency(m.actualCost), color: '#22C55E' },
          { label: 'Committed', value: formatCurrency(m.committedCost), color: '#F97316' },
          { label: 'Remaining', value: formatCurrency(m.remainingBudget), color: '#A78BFA' },
          { label: 'Utilization', value: `${m.utilizationPercent}%`, color: '#EAB308' },
          { label: 'Variance', value: formatCurrency(m.variance), color: m.variance > 0 ? '#EF4444' : '#22C55E' },
          { label: 'Forecast', value: formatCurrency(data.forecastFinalCost), color: '#8B5CF6' },
          { label: 'Growth Rate', value: `${m.costGrowthRate}%`, color: '#F59E0B' },
        ].map((c) => (
          <div key={c.label} className="command-card p-5">
            <p className="text-[10px] uppercase tracking-wider text-slate-600">{c.label}</p>
            <p className="mt-2 font-mono text-2xl font-bold" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CommandChartCard title="Cumulative Cost Timeline" subtitle="Chronological project spend" option={timelineOption} />
        <CommandChartCard title="Monthly Spend" subtitle="Event velocity by month" option={monthlyOption} />
        <CommandChartCard title="Cost Category Distribution" subtitle="Share of total spend" option={driverOption} />
        <div className="command-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <TrendingUp size={16} className="text-emerald-400" /> Cost Drivers
          </h3>
          <ul className="mt-3 divide-y divide-white/5">
            {data.topCostDrivers.map((d) => (
              <li key={d.category} className="flex items-center justify-between py-2 text-sm">
                <Link to={d.link} className="text-slate-300 hover:text-white">{d.category}</Link>
                <div className="text-right">
                  <span className="font-mono text-white">{formatCurrency(d.actual + d.committed)}</span>
                  <span className={`ml-2 text-[10px] ${d.trend === 'up' ? 'text-red-400' : d.trend === 'down' ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {d.trendPercent}%
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="command-card p-5">
        <h3 className="text-sm font-semibold text-white">Budget Heat Map</h3>
        <p className="text-[10px] text-slate-500">Project → Site → BOQ Category → Cost Category</p>
        <div className="mt-3"><HeatTree nodes={heatmap} /></div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="command-card p-5">
          <h3 className="text-sm font-semibold text-white">Top Vendors by Cost</h3>
          <ul className="mt-3 divide-y divide-white/5">
            {data.vendorCostDistribution.slice(0, 8).map((v) => (
              <li key={v.vendorId} className="flex justify-between py-2 text-sm">
                <Link to={v.link} className="text-slate-400 hover:text-white">Vendor {v.vendorId.slice(-6)}</Link>
                <span className="font-mono text-xs">{formatCurrency(v.spend)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="command-card p-5">
          <h3 className="text-sm font-semibold text-white">Top Equipment by Cost</h3>
          <ul className="mt-3 divide-y divide-white/5">
            {data.equipmentCostDistribution.slice(0, 8).map((e) => (
              <li key={e.equipmentId} className="flex justify-between py-2 text-sm">
                <Link to={e.link} className="text-slate-300 hover:text-white">{e.name || e.code}</Link>
                <span className="font-mono text-xs">{formatCurrency(e.total)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="command-card p-5">
        <h3 className="text-sm font-semibold text-white">Cost Breakdown by Category</h3>
        <div className="mt-3 space-y-2">
          {data.topCostDrivers.map((d) => (
            <div key={d.category}>
              <button
                type="button"
                onClick={() => setExpandedCat(expandedCat === d.category ? null : d.category)}
                className="flex w-full items-center justify-between rounded-lg border border-white/5 px-3 py-2 text-left text-sm hover:border-white/15"
              >
                <span className="text-white">{d.category}</span>
                <span className="font-mono text-accent">{formatCurrency(d.actual)}</span>
              </button>
              {expandedCat === d.category && breakdown[d.category] && (
                <ul className="mt-1 ml-4 divide-y divide-white/5 border-l border-white/5 pl-3">
                  {breakdown[d.category].slice(0, 15).map((item, i) => (
                    <li key={i} className="flex items-center justify-between py-1.5 text-xs">
                      <Link to={item.link} className="text-slate-400 hover:text-white">{item.eventType}</Link>
                      <span className="font-mono text-slate-300">{formatCurrency(item.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {data.recommendations.length > 0 && (
        <div className="command-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <AlertTriangle size={16} className="text-amber-400" /> Recommendations
          </h3>
          <ul className="mt-3 space-y-2">
            {data.recommendations.map((r) => (
              <li key={r.id}>
                <Link to={r.link} className="block rounded-lg border border-white/5 px-3 py-2 hover:border-white/15">
                  <p className="text-sm font-medium text-white">{r.title}</p>
                  <p className="text-xs text-slate-500">{r.message}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.vendorBills && (
        <div className="command-card p-5">
          <h3 className="text-sm font-semibold text-white">Vendor Bills</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-3 text-sm">
            <div><p className="text-slate-500">Pending</p><p className="font-mono text-amber-400">{formatCurrency(data.vendorBills.pendingAmount)}</p></div>
            <div><p className="text-slate-500">Approved</p><p className="font-mono text-emerald-400">{formatCurrency(data.vendorBills.approvedAmount)}</p></div>
            <div><p className="text-slate-500">Blocked</p><p className="font-mono text-red-400">{formatCurrency(data.vendorBills.blockedAmount)}</p></div>
          </div>
          <Link to={`/business/vendor-bills?projectId=${projectId}`} className="mt-3 inline-block text-xs text-accent hover:underline">View vendor bills →</Link>
          <ul className="mt-3 divide-y divide-white/5">
            {data.vendorBills.vendorBills.slice(0, 5).map((b) => (
              <li key={b.id} className="flex justify-between py-2 text-sm">
                <Link to={b.link} className="text-slate-300 hover:text-white">{b.invoiceNumber}</Link>
                <span className="font-mono text-xs">{formatCurrency(b.totalAmount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.payments && (
        <div className="command-card p-5">
          <h3 className="text-sm font-semibold text-white">Accounts Payable</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-4 text-sm">
            <div><p className="text-slate-500">Outstanding</p><p className="font-mono text-amber-400">{formatCurrency(data.payments.outstandingPayables)}</p></div>
            <div><p className="text-slate-500">Scheduled</p><p className="font-mono text-sky-400">{formatCurrency(data.payments.scheduledPayments)}</p></div>
            <div><p className="text-slate-500">Paid</p><p className="font-mono text-emerald-400">{formatCurrency(data.payments.paidAmount)}</p></div>
            <div><p className="text-slate-500">Cash Req. 30d</p><p className="font-mono text-violet-400">{formatCurrency(data.payments.cashRequirement)}</p></div>
          </div>
          <Link to={`/business/payments?projectId=${projectId}`} className="mt-3 inline-block text-xs text-accent hover:underline">Payments workspace →</Link>
        </div>
      )}
    </div>
  );
}
