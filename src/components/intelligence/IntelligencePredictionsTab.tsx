import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3, LayoutDashboard, LineChart, Loader2, Play, RefreshCw, Target, TrendingUp,
} from 'lucide-react';
import { intelligenceApi } from '@/api/client';
import { TrendChart } from '@/components/insights/chartHelpers';
import { cn, formatCurrency } from '@/lib/utils';

const PRED_SUBS = ['dashboard', 'charts', 'accuracy', 'projects'] as const;
export type PredSub = (typeof PRED_SUBS)[number];

const TYPE_ORDER = [
  'budget', 'fuel', 'maintenance', 'attendance', 'productivity',
  'material_consumption', 'procurement_lead_time', 'project_completion',
];

interface Props {
  projectId?: string;
  sub: PredSub;
  onSubChange: (sub: PredSub) => void;
}

export function IntelligencePredictionsTab({ projectId, sub, onSubChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dash, setDash] = useState<Record<string, unknown> | null>(null);
  const [preds, setPreds] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, p] = await Promise.all([
        intelligenceApi.predictions.dashboard(projectId),
        intelligenceApi.predictions.get(projectId),
      ]);
      setDash(d.data);
      setPreds(p.data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await intelligenceApi.predictions.generate(projectId);
      await load();
    } finally {
      setGenerating(false);
    }
  };

  const series = (preds?.series || dash?.series || []) as Array<{
    type: string; label: string; unit: string; current?: number;
    historical: Array<{ period: string; label: string; value: number }>;
    forecast: Array<{ period: string; label: string; value: number }>;
    accuracy?: { percent: number };
  }>;

  const accuracy = (preds?.accuracy || dash?.accuracy) as { overall?: number; byType?: Array<{ type: string; label: string; percent: number }> } | undefined;
  const kpis = (dash?.kpis || {}) as Record<string, number>;
  const projectForecasts = (dash?.projectForecasts || []) as Array<{
    projectId: string; name: string; currentProgress: number; forecastProgress: number; link: string;
  }>;

  const formatValue = (unit: string, v: number) => {
    if (unit === 'currency') return formatCurrency(v);
    if (unit === 'percent') return `${v}%`;
    if (unit === 'days') return `${v}d`;
    return String(v);
  };

  const subNav = (
    <div className="flex flex-wrap gap-1 border-b border-white/5 pb-2">
      {([
        { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'charts' as const, label: 'Charts', icon: LineChart },
        { id: 'accuracy' as const, label: 'Accuracy', icon: Target },
        { id: 'projects' as const, label: 'By Project', icon: BarChart3 },
      ]).map((s) => (
        <button
          key={s.id}
          onClick={() => onSubChange(s.id)}
          className={cn(
            'flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition',
            sub === s.id ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:bg-white/5 hover:text-white',
          )}
        >
          <s.icon size={12} /> {s.label}
        </button>
      ))}
    </div>
  );

  if (loading && !series.length) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-violet-400" size={28} />
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Forecast Types', value: kpis.types ?? 8 },
          { label: 'Overall Accuracy', value: `${kpis.overallAccuracy ?? accuracy?.overall ?? 0}%` },
          { label: 'Projects', value: kpis.projectsWithForecasts ?? 0 },
          { label: 'Horizon', value: kpis.forecastHorizon ?? '3 months' },
        ].map((k) => (
          <div key={k.label} className="command-card p-4">
            <p className="text-[10px] uppercase text-slate-500">{k.label}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-white">{k.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">Moving average + linear trend — no AI, no ML.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TYPE_ORDER.map((type) => {
          const s = series.find((x) => x.type === type);
          if (!s) return null;
          const next = s.forecast[0]?.value;
          return (
            <div key={type} className="command-card p-4">
              <p className="text-[10px] uppercase text-slate-500">{s.label}</p>
              <p className="mt-1 font-mono text-lg font-bold text-white">
                {next != null ? formatValue(s.unit, next) : '—'}
              </p>
              <p className="text-[10px] text-slate-600">next month forecast</p>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-1 rounded-lg bg-accent/20 px-4 py-2 text-xs text-accent disabled:opacity-50">
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Regenerate All
        </button>
        <button onClick={load} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400 hover:text-white">
          <RefreshCw size={14} className="inline" /> Refresh
        </button>
      </div>
    </div>
  );

  const renderCharts = () => (
    <div className="grid gap-4 lg:grid-cols-2">
      {series.map((s) => {
        const labels = [...s.historical.map((h) => h.label), ...s.forecast.map((f) => f.label)];
        const values = [...s.historical.map((h) => h.value), ...s.forecast.map((f) => f.value)];
        const color = s.type === 'budget' || s.type === 'fuel' ? '#22c55e' : s.type === 'project_completion' ? '#38bdf8' : '#a78bfa';
        return (
          <div key={s.type} className="command-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-white">{s.label}</h3>
              <TrendingUp size={16} className="text-violet-400" />
            </div>
            <TrendChart
              title=""
              labels={labels}
              values={values}
              color={color}
              formatValue={(v) => formatValue(s.unit, v)}
            />
          </div>
        );
      })}
    </div>
  );

  const renderAccuracy = () => (
    <div className="space-y-4">
      <div className="command-card p-6 text-center">
        <p className="text-[10px] uppercase text-slate-500">Overall Forecast Accuracy (MAPE backtest)</p>
        <p className="mt-2 font-mono text-5xl font-bold text-violet-400">{accuracy?.overall ?? 0}%</p>
      </div>
      <div className="space-y-3">
        {(accuracy?.byType || []).map((a) => (
          <div key={a.type} className="command-card flex items-center gap-4 p-4">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-emerald-500/60" style={{ width: `${a.percent}%` }} />
            </div>
            <span className="w-12 font-mono text-sm text-white">{a.percent}%</span>
            <span className="hidden flex-1 text-sm text-slate-400 sm:block">{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="command-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">Current</th>
            <th className="px-4 py-3">Forecast (+1mo)</th>
            <th className="px-4 py-3">Link</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {projectForecasts.map((p) => (
            <tr key={p.projectId}>
              <td className="px-4 py-3 font-medium text-white">{p.name}</td>
              <td className="px-4 py-3 font-mono text-slate-400">{p.currentProgress}%</td>
              <td className="px-4 py-3 font-mono text-violet-400">{p.forecastProgress}%</td>
              <td className="px-4 py-3"><Link to={p.link} className="text-xs text-violet-400 hover:underline">Open</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      {!projectForecasts.length && <p className="p-6 text-center text-sm text-slate-500">Forecasts generate automatically for all active projects</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      {subNav}
      {sub === 'dashboard' && renderDashboard()}
      {sub === 'charts' && renderCharts()}
      {sub === 'accuracy' && renderAccuracy()}
      {sub === 'projects' && renderProjects()}
    </div>
  );
}

export { PRED_SUBS };
