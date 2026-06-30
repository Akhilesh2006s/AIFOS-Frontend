import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Calendar, CalendarDays, FileText, LayoutDashboard, Loader2, Play, RefreshCw, Users,
} from 'lucide-react';
import { FilterChipBar } from '@/components/layout/FilterChipBar';
import { intelligenceApi } from '@/api/client';
import { formatCurrency } from '@/lib/utils';

const BRIEF_SUBS = ['dashboard', 'daily', 'weekly', 'monthly', 'summaries'] as const;
export type BriefSub = (typeof BRIEF_SUBS)[number];

interface Props {
  projectId?: string;
  sub: BriefSub;
  onSubChange: (sub: BriefSub) => void;
}

export function IntelligenceExecutiveBriefTab({ projectId, sub, onSubChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dash, setDash] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await intelligenceApi.brief.dashboard(projectId);
      setDash(d.data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await intelligenceApi.brief.generate();
      await load();
    } finally {
      setGenerating(false);
    }
  };

  const kpis = (dash?.kpis || {}) as Record<string, number>;
  const brief = dash?.brief as Record<string, unknown> | undefined;
  const daily = dash?.daily as Record<string, unknown> | undefined;
  const weekly = dash?.weekly as Record<string, unknown> | undefined;
  const monthly = dash?.monthly as Record<string, unknown> | undefined;
  const topRisks = (dash?.topRisks || []) as Array<{ title: string; score: number; severity: string; link: string }>;
  const topRecs = (dash?.topRecommendations || []) as Array<{ title: string; message: string; score: number; link: string }>;
  const topOpps = (dash?.topOpportunities || []) as Array<{ title: string; message: string; score: number; link: string }>;
  const forecast = dash?.forecastSummary as Record<string, unknown> | undefined;
  const health = dash?.operationalHealth as { score?: number; label?: string } | undefined;

  const subNav = (
    <FilterChipBar
      items={[
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'daily', label: 'Daily', icon: Calendar },
        { id: 'weekly', label: 'Weekly', icon: CalendarDays },
        { id: 'monthly', label: 'Monthly', icon: FileText },
        { id: 'summaries', label: 'Summaries', icon: Briefcase },
      ]}
      active={sub}
      onChange={(id) => onSubChange(id as BriefSub)}
    />
  );

  if (loading && !dash) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-sky-400" size={28} />
      </div>
    );
  }

  const renderIntelCards = () => (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="command-card p-4">
        <h3 className="mb-3 font-semibold text-red-400">Top Risks</h3>
        <ul className="space-y-2">
          {topRisks.slice(0, 5).map((r, i) => (
            <li key={i}><Link to={r.link} className="flex justify-between text-sm hover:text-red-300"><span>{r.title}</span><span className="font-mono">{r.score}</span></Link></li>
          ))}
        </ul>
      </div>
      <div className="command-card p-4">
        <h3 className="mb-3 font-semibold text-violet-400">Top Recommendations</h3>
        <ul className="space-y-2">
          {topRecs.slice(0, 5).map((r, i) => (
            <li key={i}><Link to={r.link} className="block text-sm hover:text-violet-300"><span className="font-medium">{r.title}</span><span className="ml-2 font-mono text-violet-400">{r.score}</span></Link></li>
          ))}
        </ul>
      </div>
      <div className="command-card p-4">
        <h3 className="mb-3 font-semibold text-emerald-400">Top Opportunities</h3>
        <ul className="space-y-2">
          {topOpps.slice(0, 5).map((o, i) => (
            <li key={i} className="text-sm text-slate-300">{o.title} — <span className="text-emerald-400">{o.score}</span></li>
          ))}
        </ul>
      </div>
      <div className="command-card p-4">
        <h3 className="mb-3 font-semibold text-amber-400">Forecast Summary</h3>
        <ul className="space-y-1 text-sm text-slate-400">
          <li>Budget: {forecast?.budget && typeof forecast.budget === 'object' && 'amount' in (forecast.budget as object) ? formatCurrency(Number((forecast.budget as { amount: number }).amount)) : '—'}</li>
          <li>Attendance: {(forecast?.attendance as { percent?: number })?.percent ?? '—'}%</li>
          <li>Productivity: {(forecast?.productivity as { percent?: number })?.percent ?? '—'}%</li>
          <li>Accuracy: {String(forecast?.overallAccuracy ?? '—')}%</li>
        </ul>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-4">
      <div className="command-card p-6">
        <p className="text-[10px] uppercase text-slate-500">Executive Brief — No AI, template-driven</p>
        <p className="mt-2 text-sm text-slate-300">{String(brief?.summary || '')}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Operational Health', value: `${health?.score ?? kpis.operationalHealth ?? 0} (${health?.label ?? '—'})` },
          { label: 'Overall Risk', value: kpis.overallRisk ?? 0 },
          { label: 'Critical Recs', value: kpis.criticalRecommendations ?? 0 },
          { label: 'Forecast Accuracy', value: `${kpis.forecastAccuracy ?? 0}%` },
        ].map((k) => (
          <div key={k.label} className="command-card p-4">
            <p className="text-[10px] uppercase text-slate-500">{k.label}</p>
            <p className="mt-1 font-mono text-xl font-bold text-white">{k.value}</p>
          </div>
        ))}
      </div>
      {renderIntelCards()}
      <div className="flex gap-2">
        <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-1 rounded-lg bg-sky-500/20 px-4 py-2 text-xs text-sky-300 disabled:opacity-50">
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Regenerate Briefs
        </button>
        <button onClick={load} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400 hover:text-white">
          <RefreshCw size={14} className="inline" /> Refresh
        </button>
      </div>
    </div>
  );

  const renderDaily = () => (
    <div className="space-y-4">
      <div className="command-card p-5">
        <h2 className="text-lg font-bold text-white">{String(daily?.title || 'Daily Executive Brief')}</h2>
        <p className="mt-2 text-sm text-slate-400">{String(daily?.headline || '')}</p>
      </div>
      {renderIntelCards()}
    </div>
  );

  const renderWeekly = () => (
    <div className="space-y-4">
      <div className="command-card p-5">
        <h2 className="text-lg font-bold text-white">{String(weekly?.title || 'Weekly Executive Brief')}</h2>
        <p className="mt-2 text-sm text-slate-400">{String(weekly?.headline || '')}</p>
      </div>
      {renderIntelCards()}
    </div>
  );

  const renderMonthly = () => (
    <div className="space-y-4">
      <div className="command-card p-5">
        <h2 className="text-lg font-bold text-white">{String(monthly?.title || 'Monthly Executive Report')}</h2>
        <p className="mt-2 text-sm text-slate-400">{String(monthly?.headline || '')}</p>
      </div>
      {renderIntelCards()}
    </div>
  );

  const renderSummaries = () => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[
        { label: 'Financial', path: '/intelligence/brief/financial', icon: Briefcase },
        { label: 'Operational', path: 'operational', icon: LayoutDashboard },
        { label: 'Workforce', path: 'workforce', icon: Users },
        { label: 'Asset', path: 'asset', icon: Briefcase },
        { label: 'Procurement', path: 'procurement', icon: Briefcase },
      ].map((s) => (
        <Link key={s.label} to={`/intelligence?tab=briefs&sub=summaries`} className="command-card flex items-center gap-3 p-4 hover:border-sky-500/30">
          <s.icon size={20} className="text-sky-400" />
          <div>
            <p className="font-medium text-white">{s.label} Summary</p>
            <p className="text-[10px] text-slate-500">Template + live data</p>
          </div>
        </Link>
      ))}
      <div className="command-card col-span-full p-4 text-sm text-slate-400">
        Summaries pull from Financial, Operations, Workforce, Assets, and Supply Chain modules — generated deterministically from operational intelligence engines.
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {subNav}
      {sub === 'dashboard' && renderDashboard()}
      {sub === 'daily' && renderDaily()}
      {sub === 'weekly' && renderWeekly()}
      {sub === 'monthly' && renderMonthly()}
      {sub === 'summaries' && renderSummaries()}
    </div>
  );
}

export { BRIEF_SUBS };
