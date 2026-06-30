import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Grid3X3, History, LayoutDashboard, List, Loader2, Play, RefreshCw, Shield,
} from 'lucide-react';
import { FilterChipBar } from '@/components/layout/FilterChipBar';
import { intelligenceApi } from '@/api/client';
import { BarChart } from '@/components/insights/chartHelpers';
import { cn } from '@/lib/utils';

const RISK_SUBS = ['dashboard', 'list', 'heatmap', 'domains', 'history'] as const;
export type RiskSub = (typeof RISK_SUBS)[number];

const severityColor = (s: string) => {
  if (s === 'critical') return 'text-red-400 bg-red-500/10';
  if (s === 'high') return 'text-orange-400 bg-orange-500/10';
  if (s === 'medium') return 'text-amber-400 bg-amber-500/10';
  return 'text-sky-400 bg-sky-500/10';
};

const heatColor = (score: number) => {
  if (score >= 80) return 'bg-red-500/80';
  if (score >= 60) return 'bg-orange-500/70';
  if (score >= 40) return 'bg-amber-500/60';
  return 'bg-emerald-500/50';
};

interface Props {
  projectId?: string;
  sub: RiskSub;
  onSubChange: (sub: RiskSub) => void;
}

export function IntelligenceRisksTab({ projectId, sub, onSubChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dash, setDash] = useState<Record<string, unknown> | null>(null);
  const [risks, setRisks] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, r, h] = await Promise.all([
        intelligenceApi.risks.dashboard(projectId),
        intelligenceApi.risks.get(projectId),
        intelligenceApi.risks.history(50, projectId),
      ]);
      setDash(d.data);
      setRisks(r.data);
      setHistory(h.data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await intelligenceApi.risks.generate(projectId);
      await load();
    } finally {
      setGenerating(false);
    }
  };

  const kpis = (dash?.kpis || {}) as Record<string, number>;
  const entityScores = (dash?.entityScores || risks?.entityScores || {}) as Record<string, number>;
  const byDomain = (dash?.byDomain || risks?.byDomain || {}) as Record<string, number>;
  const domainLabels = (dash?.domainLabels || {}) as Record<string, string>;
  const topRisks = (dash?.topRisks || (risks?.items as unknown[]) || []) as Array<{
    id: string; title: string; description: string; score: number; severity: string; domain: string; link: string;
  }>;
  const heatMap = (dash?.heatMap || risks?.heatMap) as {
    domains?: string[];
    domainLabels?: Record<string, string>;
    projects?: Array<{ projectId: string; name: string; overallScore: number; cells: Array<{ domain: string; score: number; severity: string }> }>;
  } | undefined;
  const projectRisks = (dash?.projectRisks || []) as Array<{ projectId: string; name: string; score: number; severity: string; link: string }>;

  const subNav = (
    <FilterChipBar
      items={[
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'list', label: 'All Risks', icon: List },
        { id: 'heatmap', label: 'Heat Map', icon: Grid3X3 },
        { id: 'domains', label: 'By Domain', icon: Shield },
        { id: 'history', label: 'History', icon: History },
      ]}
      active={sub}
      onChange={(id) => onSubChange(id as RiskSub)}
    />
  );

  if (loading && !topRisks.length) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-red-400" size={28} />
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-4">
      <div className="command-card flex flex-wrap items-center gap-6 p-6">
        <div>
          <p className="text-[10px] uppercase text-slate-500">Overall Organization Risk</p>
          <p className="font-mono text-5xl font-bold text-red-400">{kpis.overallScore ?? risks?.overallScore ?? 0}</p>
          <p className="text-xs text-slate-500">/100 — {String(risks?.overallSeverity || 'low')} severity</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Project', key: 'project' },
            { label: 'Equipment', key: 'equipment' },
            { label: 'Vendor', key: 'vendor' },
            { label: 'Workforce', key: 'workforce' },
          ].map((e) => (
            <div key={e.key} className="rounded-lg bg-white/5 px-3 py-2 text-center">
              <p className="text-[10px] text-slate-500">{e.label}</p>
              <p className="font-mono text-lg font-bold text-white">{entityScores[e.key] ?? '—'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Critical', value: kpis.critical ?? 0 },
          { label: 'High', value: kpis.high ?? 0 },
          { label: 'Domains', value: kpis.domains ?? 8 },
          { label: 'Projects Scored', value: kpis.projectsScored ?? 0 },
        ].map((k) => (
          <div key={k.label} className="command-card p-4">
            <p className="text-[10px] uppercase text-slate-500">{k.label}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-white">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {topRisks.slice(0, 5).map((r) => (
          <Link key={r.id} to={r.link} className="command-card flex items-center justify-between px-4 py-3 hover:border-red-500/30">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{r.title}</p>
              <p className="truncate text-xs text-slate-500">{r.description}</p>
            </div>
            <div className="ml-3 flex shrink-0 items-center gap-2">
              <span className={cn('rounded px-1.5 py-0.5 text-[10px] uppercase', severityColor(r.severity))}>{r.severity}</span>
              <span className="font-mono text-sm text-red-400">{r.score}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-1 rounded-lg bg-red-500/20 px-4 py-2 text-xs text-red-300 disabled:opacity-50">
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Recalculate All
        </button>
        <button onClick={load} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400 hover:text-white">
          <RefreshCw size={14} className="inline" /> Refresh
        </button>
      </div>
    </div>
  );

  const renderList = () => (
    <div className="space-y-2">
      {topRisks.map((r) => (
        <div key={r.id} className="command-card flex items-center justify-between p-4">
          <div>
            <p className="font-medium text-white">{r.title}</p>
            <p className="text-sm text-slate-400">{r.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn('rounded px-2 py-0.5 text-[10px] uppercase', severityColor(r.severity))}>{r.severity}</span>
            <span className="font-mono text-lg text-red-400">{r.score}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderHeatMap = () => {
    const domains = heatMap?.domains || Object.keys(byDomain);
    const labels = heatMap?.domainLabels || domainLabels;
    const rows = heatMap?.projects || [];

    if (!rows.length) {
      return (
        <div className="command-card p-6 text-center text-sm text-slate-500">
          Heat map available at organization level. Recalculate risks to populate project × domain matrix.
        </div>
      );
    }

    return (
      <div className="command-card overflow-x-auto p-4">
        <table className="w-full min-w-[640px] text-xs">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left text-slate-500">Project</th>
              {domains.map((d) => (
                <th key={d} className="px-1 py-2 text-center text-[10px] text-slate-500">{labels[d] || d}</th>
              ))}
              <th className="px-2 py-2 text-center text-slate-500">Overall</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.projectId} className="border-t border-white/5">
                <td className="max-w-[120px] truncate px-2 py-2 font-medium text-white">{row.name}</td>
                {domains.map((d) => {
                  const cell = row.cells.find((c) => c.domain === d);
                  const score = cell?.score ?? 0;
                  return (
                    <td key={d} className="px-1 py-2 text-center">
                      <span className={cn('inline-block min-w-[2rem] rounded px-1 py-1 font-mono text-white', heatColor(score))} title={`${score} — ${cell?.severity}`}>
                        {score}
                      </span>
                    </td>
                  );
                })}
                <td className="px-2 py-2 text-center font-mono font-bold text-red-400">{row.overallScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-500/50" /> Low (&lt;40)</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-500/60" /> Medium</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-orange-500/70" /> High</span>
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-500/80" /> Critical</span>
        </div>
      </div>
    );
  };

  const renderDomains = () => (
    <div className="space-y-4">
      <BarChart
        title="Risk by Domain"
        labels={Object.keys(byDomain).map((d) => domainLabels[d] || d)}
        values={Object.values(byDomain)}
        color="#ef4444"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(byDomain).map(([domain, score]) => (
          <div key={domain} className="command-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white">{domainLabels[domain] || domain}</p>
              <span className={cn('rounded px-2 py-0.5 text-[10px] uppercase', severityColor(score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low'))}>
                {score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low'}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-red-500/60" style={{ width: `${score}%` }} />
            </div>
            <p className="mt-1 font-mono text-lg text-red-400">{score}</p>
          </div>
        ))}
      </div>
      {projectRisks.length > 0 && (
        <div className="command-card overflow-hidden">
          <p className="border-b border-white/5 px-4 py-3 text-sm font-semibold text-white">Project Risk Scores</p>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-white/5">
              {projectRisks.map((p) => (
                <tr key={p.projectId}>
                  <td className="px-4 py-3 text-white">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-red-400">{p.score}</td>
                  <td className="px-4 py-3"><Link to={p.link} className="text-xs text-violet-400 hover:underline">Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="command-card divide-y divide-white/5">
      {history.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Risk snapshots appear after auto-generation or manual recalculate</p>}
      {history.map((h) => (
        <div key={String(h.id)} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">{h.scope === 'organization' ? 'Organization' : String(h.projectName || h.projectId)}</p>
            <p className="text-[10px] text-slate-500">{h.at ? new Date(String(h.at)).toLocaleString() : ''}</p>
          </div>
          <span className="font-mono text-red-400">{String(h.overallScore)}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {subNav}
      {sub === 'dashboard' && renderDashboard()}
      {sub === 'list' && renderList()}
      {sub === 'heatmap' && renderHeatMap()}
      {sub === 'domains' && renderDomains()}
      {sub === 'history' && renderHistory()}
    </div>
  );
}

export { RISK_SUBS };
