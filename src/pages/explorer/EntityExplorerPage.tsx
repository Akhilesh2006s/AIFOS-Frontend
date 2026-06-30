import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft, FileText, History, Lightbulb,
  Link2, ListTodo, Receipt, Shield, Sparkles,
} from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { ModuleTabs } from '@/components/layout/ModuleTabs';
import { ErrorState } from '@/components/ui/ErrorState';
import { ExplorerChainViz } from '@/components/explorer/ExplorerChainViz';
import { ExplorerRelationshipPanel } from '@/components/explorer/ExplorerRelationshipPanel';
import { ExplorerWorkflowPanel } from '@/components/explorer/ExplorerWorkflowPanel';
import { ExplorerBreadcrumbTrail } from '@/components/explorer/ExplorerBreadcrumbTrail';
import { explorerApi } from '@/api/client';
import { explorerPath } from '@/lib/explorerLinks';
import { cn, formatCurrency } from '@/lib/utils';
import type { ExplorerView } from '@/types/explorer';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'financial', label: 'Financial' },
  { id: 'documents', label: 'Documents' },
  { id: 'activities', label: 'Activities' },
  { id: 'audit', label: 'Audit' },
  { id: 'intelligence', label: 'Intelligence' },
];

const SEVERITY_STYLE = {
  critical: 'border-red-500/40 bg-red-500/10 text-red-300',
  high: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  medium: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  info: 'border-white/10 bg-white/5 text-slate-300',
};

function formatWhen(iso: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export function EntityExplorerPage() {
  const { entityType, entityId, prNumber } = useParams<{
    entityType: string;
    entityId?: string;
    prNumber?: string;
  }>();
  const location = useLocation();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState<ExplorerView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isByNumber = location.pathname.includes('/by-number/');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = isByNumber && prNumber
        ? await explorerApi.byPrNumber(prNumber)
        : await explorerApi.get(entityType!, entityId!);
      setData(res.data as ExplorerView);
    } catch {
      setError('Could not load operational traceability for this entity.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, prNumber, isByNumber]);

  useEffect(() => { load(); }, [load]);

  const title = data?.title ?? (isByNumber ? prNumber : entityId) ?? 'Explorer';
  const typeLabel = (data?.entityType ?? entityType ?? '').replace(/-/g, ' ');

  return (
    <ModulePageLayout
      hideWorkspace
      title={title}
      subtitle={data ? `${typeLabel} · ${data.subtitle}` : 'Operational Chain Explorer'}
      loading={loading}
      tabs={
        <ModuleTabs
          tabs={TABS}
          active={tab}
          onChange={setTab}
          accent="#A78BFA"
        />
      }
      breadcrumbs={[
        { label: 'Mission Control', path: '/mission-control' },
        { label: 'Explorer', path: '/mission-control' },
        { label: title },
      ]}
      heroActions={
        <Link
          to={data?.projectId ? `/projects/${data.projectId}` : '/mission-control'}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft size={14} />
          Back
        </Link>
      }
    >
      {error && !loading && <ErrorState title="Explorer unavailable" message={error} onRetry={load} />}

      {data && (
        <div className="space-y-6">
          {tab === 'overview' && (
            <>
              <header className="command-card explorer-hero p-5">
                <ExplorerBreadcrumbTrail crumbs={data.breadcrumbs ?? [{ label: title }]} />
                <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-400">
                      Operational Chain Explorer
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-white">{data.title}</h2>
                    <p className="mt-1 text-sm text-slate-400">{data.subtitle}</p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="rounded-full border border-white/10 px-2.5 py-1 capitalize">
                        {data.status.replace(/_/g, ' ')}
                      </span>
                      {data.owner && <span>Owner: {data.owner}</span>}
                      {data.projectName && (
                        <Link to={`/projects/${data.projectId}`} className="text-sky-400 hover:underline">
                          {data.projectName}
                        </Link>
                      )}
                    </div>
                  </div>
                  {data.nextAction && (
                    <div className={cn('max-w-sm rounded-xl border p-4', SEVERITY_STYLE[data.nextAction.urgency === 'critical' ? 'critical' : 'high'])}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Next action</p>
                      <p className="mt-1 text-sm font-medium">{data.nextAction.label}</p>
                      <p className="mt-1 text-xs opacity-90">{data.nextAction.detail}</p>
                    </div>
                  )}
                </div>
              </header>

              {data.intelligence && (
                <div className={cn('command-card flex gap-3 p-4', SEVERITY_STYLE[data.intelligence.severity])}>
                  <Sparkles className="mt-0.5 shrink-0" size={18} />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Executive recommendation</p>
                    <p className="mt-1 text-sm">{data.intelligence.recommendation}</p>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.kpis.map((k) => (
                  <div key={k.label} className="command-card p-4">
                    <p className="text-[10px] uppercase text-slate-500">{k.label}</p>
                    <p className={cn('mt-1 font-mono text-lg font-semibold text-white', k.accent)}>{k.value}</p>
                  </div>
                ))}
              </div>

              <ExplorerChainViz projectName={data.projectName} nodes={data.chain} />
            </>
          )}

          {tab === 'timeline' && (
            <TimelinePanel events={data.timeline} empty="No workflow history recorded yet." />
          )}

          {tab === 'relationships' && (
            <ExplorerRelationshipPanel
              upstream={data.upstream ?? []}
              downstream={data.downstream ?? []}
              relationships={data.relationships}
              fullChain={data.chain}
              projectName={data.projectName}
            />
          )}

          {tab === 'workflow' && (
            <ExplorerWorkflowPanel workflow={data.workflow} status={data.status} owner={data.owner} />
          )}

          {tab === 'financial' && (
            <div className="command-card p-6">
              {data.financial ? (
                <>
                  <div className="flex items-center gap-2 text-violet-400">
                    <Receipt size={18} />
                    <p className="text-sm font-semibold">{data.financial.label}</p>
                  </div>
                  {data.financial.amount != null && (
                    <p className="mt-3 font-mono text-3xl font-semibold text-amber-400">
                      {formatCurrency(data.financial.amount)}
                    </p>
                  )}
                  {data.financial.detail && <p className="mt-2 text-sm text-slate-400">{data.financial.detail}</p>}
                </>
              ) : (
                <p className="text-sm text-slate-500">No financial impact data for this entity.</p>
              )}
            </div>
          )}

          {tab === 'documents' && (
            <div className="command-card divide-y divide-white/5">
              {data.documents.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">No documents linked.</p>
              ) : (
                data.documents.map((d) => (
                  <Link key={d.id} to={explorerPath('document', d.id)} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03]">
                    <FileText size={16} className="text-sky-400" />
                    <div>
                      <p className="text-sm text-white">{d.title}</p>
                      <p className="text-xs text-slate-500">{d.category}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {tab === 'activities' && (
            <ActivityPanel items={data.activities} />
          )}

          {tab === 'audit' && (
            <TimelinePanel events={data.audit} empty="No audit trail entries." icon={Shield} />
          )}

          {tab === 'intelligence' && (
            <div className="space-y-4">
              {data.intelligence ? (
                <div className={cn('command-card p-5', SEVERITY_STYLE[data.intelligence.severity])}>
                  <div className="flex items-center gap-2">
                    <Lightbulb size={18} />
                    <p className="font-semibold">Recommendation</p>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed">{data.intelligence.recommendation}</p>
                  {data.intelligence.blockers && data.intelligence.blockers.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs">
                      {data.intelligence.blockers.map((b) => (
                        <li key={b} className="text-red-300">• Blocked: {b}</li>
                      ))}
                    </ul>
                  )}
                  {data.intelligence.actionLabel && (
                    <p className="mt-3 text-xs font-medium uppercase tracking-wider opacity-80">
                      Suggested: {data.intelligence.actionLabel}
                    </p>
                  )}
                </div>
              ) : (
                <p className="command-card p-6 text-sm text-slate-500">No intelligence narrative for this entity.</p>
              )}
              <div className="command-card p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Link2 size={16} className="text-violet-400" />
                  Traceability questions
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-400">
                  <li>Where did this come from? — follow upstream nodes in the operational chain.</li>
                  <li>What is it affecting? — downstream milestones, equipment idle, and budget impact.</li>
                  <li>Who owns it? — {data.owner ?? 'see workflow timeline'}.</li>
                  <li>What should happen next? — {data.nextAction?.label ?? 'monitor relationships tab'}.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </ModulePageLayout>
  );
}

function TimelinePanel({
  events,
  empty,
  icon: Icon = History,
}: {
  events: ExplorerView['timeline'];
  empty: string;
  icon?: typeof History;
}) {
  if (!events.length) {
    return <p className="command-card p-6 text-sm text-slate-500">{empty}</p>;
  }
  return (
    <div className="command-card divide-y divide-white/5">
      {events.map((e, i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          <Icon size={16} className="mt-0.5 shrink-0 text-slate-500" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-white">{e.title}</p>
              <span className="text-[10px] text-slate-500">{formatWhen(e.at)}</span>
            </div>
            {e.detail && <p className="mt-0.5 text-xs text-slate-500">{e.detail}</p>}
            {e.actor && <p className="mt-1 text-[10px] text-slate-600">by {e.actor}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityPanel({ items }: { items: ExplorerView['activities'] }) {
  if (!items.length) {
    return (
      <p className="command-card flex items-center gap-2 p-6 text-sm text-slate-500">
        <ListTodo size={16} />
        No recent activities.
      </p>
    );
  }
  return (
    <div className="command-card divide-y divide-white/5">
      {items.map((a, i) => (
        <div key={i} className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-white">{a.title}</p>
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] uppercase text-slate-500">{a.type}</span>
            <span className="text-[10px] text-slate-600">{formatWhen(a.at)}</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">{a.message}</p>
        </div>
      ))}
    </div>
  );
}
