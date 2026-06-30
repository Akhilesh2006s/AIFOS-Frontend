import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, BarChart3, Brain, History, LayoutDashboard, List,
  Loader2, Play, RefreshCw, Star,
} from 'lucide-react';
import { intelligenceApi } from '@/api/client';
import { cn, formatDate } from '@/lib/utils';

const REC_SUBS = ['dashboard', 'list', 'history', 'scoring'] as const;
export type RecSub = (typeof REC_SUBS)[number];

const severityColor = (s: string) => {
  if (s === 'critical') return 'text-red-400 bg-red-500/10';
  if (s === 'warning') return 'text-amber-400 bg-amber-500/10';
  return 'text-sky-400 bg-sky-500/10';
};

const scoreColor = (score: number) => {
  if (score >= 70) return 'text-red-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-sky-400';
};

interface Props {
  projectId?: string;
  sub: RecSub;
  onSubChange: (sub: RecSub) => void;
}

export function IntelligenceRecommendationsTab({ projectId, sub, onSubChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [dash, setDash] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, dashboard, hist] = await Promise.all([
        intelligenceApi.recommendations.list(projectId),
        intelligenceApi.recommendations.dashboard(projectId),
        intelligenceApi.recommendations.history(50),
      ]);
      setItems(list.data);
      setDash(dashboard.data);
      setHistory(hist.data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await intelligenceApi.recommendations.generate(projectId);
      await load();
    } finally {
      setGenerating(false);
    }
  };

  const subNav = (
    <div className="flex flex-wrap gap-1 border-b border-white/5 pb-2">
      {([
        { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'list' as const, label: 'All Recommendations', icon: List },
        { id: 'history' as const, label: 'History', icon: History },
        { id: 'scoring' as const, label: 'Scoring', icon: BarChart3 },
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

  if (loading && !items.length) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-violet-400" size={28} />
      </div>
    );
  }

  const kpis = (dash?.kpis || {}) as Record<string, number>;
  const scoreBands = (dash?.scoreBands || {}) as Record<string, number>;

  const renderDashboard = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          { label: 'Total', value: kpis.total ?? 0, icon: Brain },
          { label: 'Critical', value: kpis.critical ?? 0, icon: AlertTriangle },
          { label: 'Avg Score', value: kpis.avgScore ?? 0, icon: Star },
          { label: 'Generated (24h)', value: kpis.generated24h ?? 0, icon: RefreshCw },
          { label: 'Warnings', value: kpis.warning ?? 0, icon: AlertTriangle },
        ].map((k) => (
          <div key={k.label} className="command-card p-4">
            <div className="flex items-center gap-2">
              <k.icon size={14} className="text-violet-400" />
              <p className="text-[10px] uppercase text-slate-500">{k.label}</p>
            </div>
            <p className="mt-1 font-mono text-2xl font-bold text-white">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="command-card p-5">
          <h3 className="font-semibold text-white">Top Recommendations</h3>
          <ul className="mt-3 space-y-2">
            {((dash?.topRecommendations as Array<Record<string, unknown>>) || items).slice(0, 5).map((r) => (
              <li key={String(r.id)} className="flex items-start justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{String(r.title)}</p>
                  <p className="truncate text-xs text-slate-500">{String(r.message)}</p>
                </div>
                <span className={cn('shrink-0 font-mono text-sm', scoreColor(Number(r.score ?? 0)))}>{String(r.score ?? '—')}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="command-card p-5">
          <h3 className="font-semibold text-white">By Type</h3>
          <ul className="mt-3 space-y-2">
            {((dash?.byType as Array<{ type: string; count: number; label: string }>) || []).map((t) => (
              <li key={t.type} className="flex justify-between text-sm">
                <span className="text-slate-400">{t.label}</span>
                <span className="font-mono text-white">{t.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-1 rounded-lg bg-accent/20 px-4 py-2 text-xs text-accent disabled:opacity-50">
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Regenerate
        </button>
        <button onClick={load} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400 hover:text-white">Refresh</button>
      </div>
    </div>
  );

  const renderList = () => (
    <div className="space-y-3">
      {items.map((r) => (
        <div key={String(r.id)} className="command-card flex items-start justify-between gap-4 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-white">{String(r.title)}</p>
              <span className={cn('rounded px-1.5 py-0.5 text-[10px] uppercase', severityColor(String(r.severity)))}>{String(r.severity)}</span>
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] capitalize text-slate-500">{String(r.type).replace(/_/g, ' ')}</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">{String(r.message)}</p>
            <p className="mt-1 text-[10px] uppercase text-slate-600">{String(r.domain)}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className={cn('font-mono text-xl font-bold', scoreColor(Number(r.score ?? 0)))}>{String(r.score ?? '—')}</span>
            {r.link != null && <Link to={String(r.link)} className="text-xs text-violet-400 hover:underline">Open →</Link>}
          </div>
        </div>
      ))}
      {!items.length && <p className="py-8 text-center text-sm text-slate-500">No recommendations — system will auto-generate from operational data</p>}
    </div>
  );

  const renderHistory = () => (
    <div className="command-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Recommendation</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {history.map((h) => (
            <tr key={String(h.id)}>
              <td className="px-4 py-3 text-xs text-slate-500">{h.at ? formatDate(String(h.at)) : '—'}</td>
              <td className="px-4 py-3 text-white">{String(h.title)}</td>
              <td className="px-4 py-3 text-xs capitalize text-slate-400">{String(h.typeLabel || h.type).replace(/_/g, ' ')}</td>
              <td className={cn('px-4 py-3 font-mono', scoreColor(Number(h.score)))}>{String(h.score)}</td>
              <td className="px-4 py-3 capitalize text-slate-400">{String(h.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!history.length && <p className="p-6 text-center text-sm text-slate-500">No history yet</p>}
    </div>
  );

  const renderScoring = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'High (70+)', value: scoreBands.high ?? 0, color: 'text-red-400' },
          { label: 'Medium (40–69)', value: scoreBands.medium ?? 0, color: 'text-amber-400' },
          { label: 'Low (<40)', value: scoreBands.low ?? 0, color: 'text-sky-400' },
        ].map((b) => (
          <div key={b.label} className="command-card p-5 text-center">
            <p className="text-[10px] uppercase text-slate-500">{b.label}</p>
            <p className={cn('mt-2 font-mono text-3xl font-bold', b.color)}>{b.value}</p>
          </div>
        ))}
      </div>
      <div className="command-card p-5">
        <h3 className="font-semibold text-white">Scoring model</h3>
        <p className="mt-2 text-sm text-slate-400">
          Deterministic scores from severity (critical=85, warning=55, info=25), recommendation type priority,
          metric impact, and rule-engine triggers. No AI — pure business rules.
        </p>
        <ul className="mt-4 space-y-2">
          {items.slice(0, 10).map((r) => (
            <li key={String(r.id)} className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-violet-500/60" style={{ width: `${Number(r.score ?? 0)}%` }} />
              </div>
              <span className="w-8 font-mono text-xs text-white">{String(r.score)}</span>
              <span className="hidden flex-1 truncate text-xs text-slate-500 sm:block">{String(r.title)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {subNav}
      {sub === 'dashboard' && renderDashboard()}
      {sub === 'list' && renderList()}
      {sub === 'history' && renderHistory()}
      {sub === 'scoring' && renderScoring()}
    </div>
  );
}

export { REC_SUBS };
