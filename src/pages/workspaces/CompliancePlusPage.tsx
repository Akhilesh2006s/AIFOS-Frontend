import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, CheckCircle2, Clock, ExternalLink, FileText,
  RefreshCw, RotateCcw, Send, XCircle, Zap,
} from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { ModuleTabs } from '@/components/layout/ModuleTabs';
import { moduleApi } from '@/api/client';
import { cn, formatDate } from '@/lib/utils';
import { explorerPath } from '@/lib/explorerLinks';

type ComplianceItem = {
  id?: string;
  _id?: string;
  entityType: string;
  entityId: string;
  complianceCategory: string;
  categoryLabel?: string;
  documentType: string;
  documentNumber?: string;
  expiryDate?: string;
  status: string;
  renewalStatus: string;
  approvalStatus: string;
  alertTier?: string;
  ownerName?: string;
  projectId?: string;
  linkedDocumentIds?: string[];
  escalationLevel?: number;
  link?: string;
};

type Dashboard = {
  total: number;
  valid: number;
  expiringSoon: number;
  expired: number;
  pendingRenewals: number;
  pendingApprovals: number;
  escalated: number;
  byCategory: Array<{ category: string; label: string; count: number }>;
  renewalQueue: ComplianceItem[];
  approvalQueue: ComplianceItem[];
  alerts: Array<ComplianceItem & { alertTier: string }>;
  links: Record<string, string>;
};

type TimelineEvent = {
  id: string;
  recordId: string;
  documentType: string;
  action: string;
  actor?: string;
  at: string;
  details?: string;
  link: string;
};

const TABS = ['browse', 'renewals', 'approvals', 'timeline'] as const;
const CATEGORIES = [
  { value: '', label: 'All categories' },
  { value: 'company', label: 'Company' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'operator', label: 'Operator' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'labour', label: 'Labour' },
  { value: 'contract', label: 'Contract' },
];

const RENEWAL_STYLE: Record<string, string> = {
  valid: 'bg-emerald-500/20 text-emerald-300',
  renewal_due: 'bg-amber-500/20 text-amber-300',
  renewal_in_progress: 'bg-sky-500/20 text-sky-300',
  renewed: 'bg-violet-500/20 text-violet-300',
  expired: 'bg-red-500/20 text-red-300',
};

const APPROVAL_STYLE: Record<string, string> = {
  draft: 'bg-slate-500/20 text-slate-300',
  pending: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-emerald-500/20 text-emerald-300',
  rejected: 'bg-red-500/20 text-red-300',
};

export function CompliancePlusPage() {
  const { recordId } = useParams<{ recordId?: string }>();
  if (recordId) return <ComplianceDetail id={recordId} />;
  return <CompliancePlusList />;
}

function CompliancePlusList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as (typeof TABS)[number]) || 'browse';
  const category = searchParams.get('category') || '';
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [records, setRecords] = useState<ComplianceItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, recs, tl] = await Promise.all([
        moduleApi.compliance.centerDashboard(),
        tab === 'renewals'
          ? moduleApi.compliance.renewals('due')
          : moduleApi.compliance.records(undefined, category || undefined),
        tab === 'timeline' ? moduleApi.compliance.timeline() : Promise.resolve({ data: [] }),
      ]);
      setDashboard(dash.data);
      setRecords(recs.data);
      setTimeline(tl.data);
    } finally {
      setLoading(false);
    }
  }, [tab, category]);

  useEffect(() => { load(); }, [load]);

  const setTab = (t: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    setSearchParams(next);
  };

  const displayRecords = tab === 'approvals'
    ? (dashboard?.approvalQueue ?? [])
    : tab === 'renewals'
      ? records
      : records;

  return (
    <ModulePageLayout
      title="Compliance+"
      subtitle="Company · Equipment · Operator · Vendor · Labour · Contract — renewals, approvals, escalations"
      loading={loading}
      stats={[
        { label: 'Total Records', value: dashboard?.total ?? 0, color: '#38BDF8' },
        { label: 'Expiring Soon', value: dashboard?.expiringSoon ?? 0, color: '#EAB308' },
        { label: 'Expired', value: dashboard?.expired ?? 0, color: '#EF4444' },
        { label: 'Pending Renewals', value: dashboard?.pendingRenewals ?? 0, color: '#8B5CF6' },
        { label: 'Pending Approvals', value: dashboard?.pendingApprovals ?? 0, color: '#F97316' },
        { label: 'Escalated', value: dashboard?.escalated ?? 0, color: '#DC2626' },
      ]}
      heroActions={
        <Link to="/business" className="btn-ghost flex items-center gap-2 text-sm">
          <ArrowLeft size={14} /> Business
        </Link>
      }
    >
      {(dashboard?.alerts?.length ?? 0) > 0 && tab === 'browse' && (
        <div className="command-card mb-4 border-amber-500/30 bg-amber-500/5 p-4">
          <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
            <AlertTriangle size={14} /> Active compliance alerts
          </h3>
          <ul className="mt-2 space-y-1 text-sm">
            {dashboard!.alerts.slice(0, 5).map((a) => (
              <li key={a.id || a._id}>
                <Link to={a.link?.startsWith('/explore') ? a.link : explorerPath('compliance-record', a.id ?? '')} className="text-slate-300 hover:text-sky-300">
                  <span className="text-amber-400">{a.alertTier?.replace('_', ' ')}</span> — {a.documentType} {a.documentNumber}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <ModuleTabs
          className="min-w-0 flex-1"
          tabs={TABS.map((t) => ({ id: t, label: t }))}
          active={tab}
          onChange={(id) => setTab(id as (typeof TABS)[number])}
        />
        {tab === 'browse' && (
          <select
            value={category}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              next.set('tab', 'browse');
              if (e.target.value) next.set('category', e.target.value);
              else next.delete('category');
              setSearchParams(next);
            }}
            className="select-field shrink-0 text-xs"
          >
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        )}
        <button type="button" onClick={() => load()} className="btn-ghost btn-sm shrink-0" aria-label="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {tab === 'timeline' ? (
        <div className="command-card divide-y divide-white/5">
          {timeline.length === 0 ? (
            <p className="px-4 py-8 text-center text-slate-500">No timeline events</p>
          ) : timeline.map((e) => (
            <Link key={e.id} to={e.link} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]">
              <div>
                <p className="text-sm text-white">{e.documentType}</p>
                <p className="text-[10px] text-slate-500">{e.action.replace(/_/g, ' ')} · {e.actor || 'system'}</p>
              </div>
              <span className="text-xs text-slate-500">{formatDate(e.at)}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="command-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Renewal</th>
                <th className="px-4 py-3">Approval</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Owner</th>
              </tr>
            </thead>
            <tbody>
              {displayRecords.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No records</td></tr>
              ) : displayRecords.map((r) => {
                const id = r.id || r._id || '';
                return (
                  <tr key={id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <Link to={explorerPath('compliance-record', id)} className="font-medium text-white hover:text-sky-300">
                        {r.documentType}
                      </Link>
                      <p className="text-[10px] text-slate-500">{r.documentNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{r.categoryLabel || r.complianceCategory}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{r.entityType} · {r.entityId}</td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded px-1.5 py-0.5 text-[10px]', RENEWAL_STYLE[r.renewalStatus] || '')}>
                        {r.renewalStatus?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded px-1.5 py-0.5 text-[10px]', APPROVAL_STYLE[r.approvalStatus] || '')}>
                        {r.approvalStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.expiryDate ? formatDate(r.expiryDate) : '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.ownerName || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ModulePageLayout>
  );
}

function ComplianceDetail({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [linkedDocs, setLinkedDocs] = useState<Array<Record<string, unknown>>>([]);
  const [acting, setActing] = useState(false);
  const [renewExpiry, setRenewExpiry] = useState('');
  const [showRenew, setShowRenew] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await moduleApi.compliance.get(id);
      setRecord(detail.data);
      const docs = await moduleApi.documents.byEntity('compliance_record', id).catch(() => ({ data: [] }));
      setLinkedDocs(docs.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<unknown>) => {
    setActing(true);
    try {
      await fn();
      await load();
    } finally {
      setActing(false);
    }
  };

  if (loading && !record) {
    return <ModulePageLayout title="Compliance" subtitle="Loading…" loading><div /></ModulePageLayout>;
  }
  if (!record) {
    return (
      <ModulePageLayout title="Not found" subtitle="">
        <Link to="/business/compliance" className="text-sky-400 text-sm">← Back</Link>
      </ModulePageLayout>
    );
  }

  const renewalStatus = String(record.renewalStatus || 'valid');
  const approvalStatus = String(record.approvalStatus || 'approved');
  const auditTrail = (record.auditTrail as Array<Record<string, unknown>>) || [];
  const renewalHistory = (record.renewalHistory as Array<Record<string, unknown>>) || [];

  return (
    <ModulePageLayout
      title={String(record.documentType)}
      subtitle={`${record.categoryLabel || record.complianceCategory} · ${record.entityType}`}
      loading={loading}
      heroActions={
        <Link to="/business/compliance" className="btn-ghost flex items-center gap-2 text-sm">
          <ArrowLeft size={14} /> Compliance+
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="command-card p-4 grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500">Number</span><p className="text-white font-mono">{String(record.documentNumber || '—')}</p></div>
            <div><span className="text-slate-500">Expiry</span><p className="text-white">{record.expiryDate ? formatDate(String(record.expiryDate)) : '—'}</p></div>
            <div><span className="text-slate-500">Entity</span><p className="text-white">{String(record.entityType)} · {String(record.entityId)}</p></div>
            <div><span className="text-slate-500">Owner</span><p className="text-white">{String(record.ownerName || '—')}</p></div>
            <div><span className="text-slate-500">Jurisdiction</span><p className="text-white">{String(record.jurisdiction || '—')}</p></div>
            <div><span className="text-slate-500">Escalation</span><p className="text-white">Level {Number(record.escalationLevel || 0)}</p></div>
          </div>

          <div className="command-card p-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <FileText size={14} /> Linked documents
            </h3>
            {linkedDocs.length === 0 ? (
              <p className="text-xs text-slate-500">No documents linked — upload via Document Center with entity type compliance_record</p>
            ) : (
              <ul className="space-y-2">
                {linkedDocs.map((d) => (
                  <li key={String(d.id || d._id)} className="flex items-center justify-between text-xs">
                    <Link to={explorerPath('document', String(d.id || d._id))} className="text-sky-400 hover:underline">{String(d.title)}</Link>
                    <a href={String(d.fileUrl)} target="_blank" rel="noreferrer" className="text-slate-500"><ExternalLink size={12} /></a>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/business/documents" className="mt-3 inline-block text-xs text-sky-400 hover:underline">
              Open Document Center →
            </Link>
          </div>

          {(renewalHistory.length > 0 || auditTrail.length > 0) && (
            <div className="command-card p-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <Clock size={14} /> Renewal & audit history
              </h3>
              <ul className="space-y-2 text-xs">
                {([...renewalHistory, ...auditTrail] as Array<Record<string, unknown>>)
                  .sort((a, b) => new Date(String(b.at)).getTime() - new Date(String(a.at)).getTime())
                  .slice(0, 15)
                  .map((h, i) => (
                    <li key={i} className="flex justify-between text-slate-400">
                      <span>{String(h.action)} · {String(h.actor || 'system')}</span>
                      <span>{formatDate(String(h.at))}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="command-card p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Renewal</span>
              <span className={cn('rounded px-2 py-0.5 text-xs', RENEWAL_STYLE[renewalStatus])}>{renewalStatus.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Approval</span>
              <span className={cn('rounded px-2 py-0.5 text-xs', APPROVAL_STYLE[approvalStatus])}>{approvalStatus}</span>
            </div>
            {record.alertTier ? (
              <div className="flex justify-between">
                <span className="text-slate-500">Alert tier</span>
                <span className="text-amber-300 text-xs">{String(record.alertTier).replace(/_/g, ' ')}</span>
              </div>
            ) : null}
          </div>

          <div className="command-card p-4 flex flex-col gap-2">
            {['valid', 'renewal_due', 'expired'].includes(renewalStatus) && renewalStatus !== 'renewal_in_progress' && (
              <button
                type="button"
                disabled={acting}
                onClick={() => act(() => moduleApi.compliance.startRenewal(id))}
                className="btn-primary flex items-center justify-center gap-2 text-sm"
              >
                <RotateCcw size={14} /> Start renewal
              </button>
            )}
            {renewalStatus === 'renewal_in_progress' && !showRenew && (
              <button type="button" onClick={() => setShowRenew(true)} className="btn-primary text-sm">
                Complete renewal
              </button>
            )}
            {showRenew && (
              <div className="space-y-2">
                <input
                  type="date"
                  value={renewExpiry}
                  onChange={(e) => setRenewExpiry(e.target.value)}
                  className="w-full rounded border border-white/10 bg-black/20 px-2 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  disabled={acting || !renewExpiry}
                  onClick={() => act(() => moduleApi.compliance.completeRenewal(id, { newExpiry: renewExpiry }))}
                  className="btn-primary w-full text-sm"
                >
                  Submit renewal
                </button>
              </div>
            )}
            {approvalStatus === 'pending' && (
              <>
                <button type="button" disabled={acting} onClick={() => act(() => moduleApi.compliance.approve(id))} className="btn-primary flex items-center justify-center gap-2 text-sm">
                  <CheckCircle2 size={14} /> Approve
                </button>
                <button type="button" disabled={acting} onClick={() => act(() => moduleApi.compliance.reject(id, 'Rejected'))} className="btn-ghost text-red-400 text-sm flex items-center justify-center gap-2">
                  <XCircle size={14} /> Reject
                </button>
              </>
            )}
            {approvalStatus !== 'pending' && renewalStatus !== 'renewal_in_progress' && (
              <button type="button" disabled={acting} onClick={() => act(() => moduleApi.compliance.submitApproval(id))} className="btn-ghost flex items-center justify-center gap-2 text-sm">
                <Send size={14} /> Submit for approval
              </button>
            )}
            <button type="button" disabled={acting} onClick={() => act(() => moduleApi.compliance.escalate(id))} className="btn-ghost flex items-center justify-center gap-2 text-sm text-amber-400">
              <Zap size={14} /> Escalate
            </button>
          </div>
        </div>
      </div>
    </ModulePageLayout>
  );
}
