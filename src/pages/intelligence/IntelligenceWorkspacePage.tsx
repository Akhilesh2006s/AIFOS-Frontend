import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, Brain, Play, RefreshCw, Shield, TrendingUp, Zap,
} from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { ErrorState } from '@/components/ui/ErrorState';
import { intelligenceApi } from '@/api/client';
import { IntelligenceRulesTab, type RuleSub } from '@/components/intelligence/IntelligenceRulesTab';
import { IntelligenceRecommendationsTab, type RecSub } from '@/components/intelligence/IntelligenceRecommendationsTab';
import { IntelligencePredictionsTab, type PredSub } from '@/components/intelligence/IntelligencePredictionsTab';
import { IntelligenceRisksTab, type RiskSub } from '@/components/intelligence/IntelligenceRisksTab';
import { IntelligenceExecutiveBriefTab, type BriefSub } from '@/components/intelligence/IntelligenceExecutiveBriefTab';
import { useContextStore } from '@/store/context';
import { cn } from '@/lib/utils';

const TABS = ['rules', 'recommendations', 'predictions', 'risks', 'briefs', 'dashboard'] as const;
type TabId = (typeof TABS)[number];

const severityColor = (s: string) => {
  if (s === 'critical' || s === 'high') return 'text-red-400 bg-red-500/10';
  if (s === 'warning' || s === 'medium') return 'text-amber-400 bg-amber-500/10';
  return 'text-sky-400 bg-sky-500/10';
};

export function IntelligenceWorkspacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as TabId) || 'rules';
  const ruleSub = (searchParams.get('sub') as RuleSub) || 'dashboard';
  const recSub = (searchParams.get('sub') as RecSub) || 'dashboard';
  const predSub = (searchParams.get('sub') as PredSub) || 'dashboard';
  const riskSub = (searchParams.get('sub') as RiskSub) || 'dashboard';
  const briefSub = (searchParams.get('sub') as BriefSub) || 'dashboard';
  const activeProject = useContextStore((s) => s.activeProject);
  const projectId = activeProject?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);

  const setBriefSub = (sub: BriefSub) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'briefs');
    next.set('sub', sub);
    setSearchParams(next);
  };

  const setRiskSub = (sub: RiskSub) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'risks');
    next.set('sub', sub);
    setSearchParams(next);
  };

  const setPredSub = (sub: PredSub) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'predictions');
    next.set('sub', sub);
    setSearchParams(next);
  };

  const setRecSub = (sub: RecSub) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'recommendations');
    next.set('sub', sub);
    setSearchParams(next);
  };

  const setRuleSub = (sub: RuleSub) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'rules');
    next.set('sub', sub);
    setSearchParams(next);
  };

  const setTab = (id: TabId) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', id);
    setSearchParams(next);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dash = await intelligenceApi.dashboard(projectId);
      setDashboard(dash.data);
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load intelligence');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const tabs = (
    <div className="flex flex-wrap gap-1 border-b border-white/5 pb-1">
      {TABS.map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition',
            tab === t ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:text-white hover:bg-white/5',
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );

  if (error) return <ErrorState message={error} onRetry={load} />;

  const kpis = (dashboard?.kpis || {}) as Record<string, number>;

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Overall Risk', value: kpis.overallRisk ?? '—', icon: Shield, accent: 'text-red-400' },
          { label: 'Active Rules', value: kpis.activeRules ?? 0, icon: Zap, accent: 'text-amber-400' },
          { label: 'Recommendations', value: kpis.recommendations ?? 0, icon: Brain, accent: 'text-violet-400' },
          { label: 'Critical Recs', value: kpis.criticalRecommendations ?? 0, icon: AlertTriangle, accent: 'text-red-400' },
          { label: 'Rules (24h)', value: kpis.rulesTriggered24h ?? 0, icon: Play, accent: 'text-sky-400' },
          { label: 'Budget Forecast', value: kpis.budgetForecast ? `₹${Number(kpis.budgetForecast).toLocaleString('en-IN')}` : '—', icon: TrendingUp, accent: 'text-emerald-400' },
        ].map((k) => (
          <div key={k.label} className="command-card p-4">
            <div className="flex items-center gap-2">
              <k.icon size={16} className={k.accent} />
              <p className="text-[10px] uppercase tracking-wider text-slate-500">{k.label}</p>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold text-white">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="command-card p-5">
          <h3 className="font-semibold text-white">Top Recommendations</h3>
          <ul className="mt-3 space-y-2">
            {((dashboard?.topRecommendations as Array<Record<string, unknown>>) || []).map((r) => (
              <li key={String(r.id)} className="flex items-start justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-white">{String(r.title)}</p>
                  <p className="text-xs text-slate-500">{String(r.message)}</p>
                </div>
                <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase', severityColor(String(r.severity)))}>{String(r.severity)}</span>
              </li>
            ))}
            {!(dashboard?.topRecommendations as unknown[])?.length && <p className="text-sm text-slate-500">No recommendations</p>}
          </ul>
          <button onClick={() => setTab('recommendations')} className="mt-3 text-xs text-violet-400 hover:underline">View all →</button>
        </div>

        <div className="command-card p-5">
          <h3 className="font-semibold text-white">Top Risks</h3>
          <ul className="mt-3 space-y-2">
            {((dashboard?.topRisks as Array<Record<string, unknown>>) || []).map((r) => (
              <li key={String(r.id)} className="flex items-start justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-white">{String(r.title)}</p>
                  <p className="text-xs text-slate-500">{String(r.description)}</p>
                </div>
                <span className="font-mono text-sm text-red-400">{String(r.score)}</span>
              </li>
            ))}
            {!(dashboard?.topRisks as unknown[])?.length && <p className="text-sm text-slate-500">No risks detected</p>}
          </ul>
          <button onClick={() => setTab('risks')} className="mt-3 text-xs text-violet-400 hover:underline">View all →</button>
        </div>
      </div>

      {dashboard?.briefSummary != null && (
        <div className="command-card p-5">
          <h3 className="font-semibold text-white">Executive Summary</h3>
          <p className="mt-2 text-sm text-slate-400">{String(dashboard.briefSummary)}</p>
          <button onClick={() => setTab('briefs')} className="mt-3 text-xs text-violet-400 hover:underline">Full brief →</button>
        </div>
      )}
    </div>
  );

  const content = () => {
    switch (tab) {
      case 'rules':
        return <IntelligenceRulesTab projectId={projectId} sub={ruleSub} onSubChange={setRuleSub} />;
      case 'recommendations':
        return <IntelligenceRecommendationsTab projectId={projectId} sub={recSub} onSubChange={setRecSub} />;
      case 'predictions':
        return <IntelligencePredictionsTab projectId={projectId} sub={predSub} onSubChange={setPredSub} />;
      case 'risks':
        return <IntelligenceRisksTab projectId={projectId} sub={riskSub} onSubChange={setRiskSub} />;
      case 'briefs':
        return <IntelligenceExecutiveBriefTab projectId={projectId} sub={briefSub} onSubChange={setBriefSub} />;
      default: return renderDashboard();
    }
  };

  return (
    <ModulePageLayout
      title="Operational Intelligence"
      subtitle="Rules & automation · recommendations · predictions · risks · executive briefs"
      loading={loading && tab !== 'rules' && tab !== 'recommendations' && tab !== 'predictions' && tab !== 'risks' && tab !== 'briefs'}
      tabs={tabs}
      heroActions={
        <button onClick={load} className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white">
          <RefreshCw size={14} /> Refresh
        </button>
      }
    >
      {content()}
    </ModulePageLayout>
  );
}
