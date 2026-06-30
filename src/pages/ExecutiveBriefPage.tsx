import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageLoader } from '@/components/layout/PageShell';
import { RichKpiCard } from '@/components/command/RichKpiCard';
import { WorkflowActions } from '@/components/workflow/WorkflowActions';
import { CommandChartCard } from '@/components/command/CommandChartCard';
import { IndiaMapWidget, type SitePin } from '@/components/command/IndiaMapWidget';
import { analyticsApi, moduleApi } from '@/api/client';
import { useUiStore } from '@/store/ui';
import { commandKpiVisuals, defaultCommandKpiVisual } from '@/config/kpi-config';
import { formatCurrency } from '@/lib/locale';
import { cn } from '@/lib/utils';

interface DashboardData {
  kpis: Array<{
    id: string;
    label: string;
    value: string | number;
    valueFormatted?: boolean;
    change: string;
    trend: 'up' | 'down' | 'neutral';
  }>;
  chartData: {
    projectStatus: Array<{ name: string; value: number }>;
    monthlySpend: Array<{ month: string; materials: number; labor: number; equipment: number; others: number }>;
    equipmentUtilization: { average: number; working: number; idle: number; down: number };
  };
  siteLocations: SitePin[];
  upcomingActivities: Array<{ id: string; date: string; title: string; project: string; priority: 'critical' | 'high' | 'medium' }>;
  recentApprovals: Array<{ id: string; type: string; ref: string; amount: number; status: 'approved' | 'pending' }>;
  lastUpdated: string;
}

const priorityStyles = {
  critical: 'bg-red-500/15 text-red-400 ring-red-500/20',
  high: 'bg-amber-500/15 text-amber-400 ring-amber-500/20',
  medium: 'bg-sky-500/15 text-sky-400 ring-sky-500/20',
};

export function ExecutiveBriefPage() {
  const locale = useUiStore((s) => s.locale);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pipelineProjectId, setPipelineProjectId] = useState<string | null>(null);

  useEffect(() => {
    analyticsApi.executive().then((res) => {
      setData(res.data);
      moduleApi.projects.list().then((p) => {
        if (p.data[0]?._id) setPipelineProjectId(p.data[0]._id);
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader message="Loading executive brief…" />;

  const spendTotal = data?.chartData.monthlySpend.reduce(
    (sum, m) => sum + m.materials + m.labor + m.equipment + m.others, 0,
  ) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Insights Workspace</p>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Executive Brief</h1>
          <p className="mt-1 text-sm text-slate-500">Organization-wide KPIs, pipeline health, and approvals</p>
        </div>
        <Link to="/" className="btn-ghost text-sm">← Command Center</Link>
      </div>

      {pipelineProjectId && <WorkflowActions projectId={pipelineProjectId} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {data?.kpis.map((kpi, i) => {
          const visual = commandKpiVisuals[kpi.id] || defaultCommandKpiVisual;
          const displayValue = kpi.valueFormatted && typeof kpi.value === 'number'
            ? formatCurrency(kpi.value, locale) : kpi.value;
          const colors: Record<string, string> = {
            'total-projects': '#38BDF8', 'active-equipment': '#1F4E79', 'fleet-on-trip': '#3B82F6',
            'inventory-value': '#22C55E', 'pending-pos': '#EAB308', 'safety-alerts': '#F97316',
          };
          return (
            <RichKpiCard key={kpi.id} label={kpi.label} value={displayValue} change={kpi.change}
              trend={kpi.trend} icon={visual.icon} color={colors[kpi.id] || '#F97316'} delay={i} />
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-3">
          <CommandChartCard title="Project Progress" subtitle="Portfolio status" height={240} delay={1}
            option={{
              tooltip: { trigger: 'item', backgroundColor: '#0f1d32', textStyle: { color: '#e2e8f0' } },
              legend: { bottom: 0, textStyle: { color: '#64748b', fontSize: 10 } },
              series: [{ type: 'pie', radius: ['48%', '68%'], padAngle: 3, label: { show: false },
                data: data?.chartData.projectStatus.map((s, i) => ({
                  ...s, itemStyle: { color: ['#22c55e', '#f97316', '#ef4444', '#475569'][i] },
                })),
              }],
            }}
          />
        </div>
        <div className="xl:col-span-5"><IndiaMapWidget sites={data?.siteLocations ?? []} /></div>
        <div className="xl:col-span-4">
          <div className="command-card h-full p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Critical Activities</h3>
              <Calendar size={16} className="text-slate-500" />
            </div>
            <div className="space-y-2">
              {data?.upcomingActivities.map((act) => (
                <div key={act.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">{act.title}</p>
                    <p className="text-[10px] text-slate-500">{act.project}</p>
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ring-1', priorityStyles[act.priority])}>
                    {act.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CommandChartCard title="Monthly Spend" subtitle={formatCurrency(spendTotal * 10_00_000, locale)} height={220}
          option={{
            grid: { left: 40, right: 16, top: 36, bottom: 28 },
            xAxis: { type: 'category', data: data?.chartData.monthlySpend.map((m) => m.month), axisLabel: { color: '#64748b', fontSize: 10 } },
            yAxis: { type: 'value', axisLabel: { color: '#64748b', fontSize: 10 } },
            series: [
              { name: 'Materials', type: 'bar', stack: 't', data: data?.chartData.monthlySpend.map((m) => m.materials), itemStyle: { color: '#3b82f6' } },
              { name: 'Labor', type: 'bar', stack: 't', data: data?.chartData.monthlySpend.map((m) => m.labor), itemStyle: { color: '#22c55e' } },
            ],
            tooltip: { trigger: 'axis', backgroundColor: '#0f1d32', textStyle: { color: '#e2e8f0' } },
          }}
        />
        <div className="command-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Recent Approvals</h3>
          <div className="space-y-2">
            {data?.recentApprovals.map((item) => (
              <div key={item.id} className="flex justify-between rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/5">
                <div><p className="text-sm text-slate-200">{item.type}</p><p className="text-[10px] text-slate-500">{item.ref}</p></div>
                <p className="font-mono text-sm text-white">{formatCurrency(item.amount, locale)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
