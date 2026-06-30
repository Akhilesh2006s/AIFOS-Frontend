import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Archive, ArrowLeft, CheckCircle2, Clock, ExternalLink, FileText, History,
  RefreshCw, RotateCcw, Search, Send, XCircle,
} from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { moduleApi } from '@/api/client';
import { cn, formatDate } from '@/lib/utils';
import { explorerPath, resolveEntityLink } from '@/lib/explorerLinks';

type DocItem = {
  id: string;
  title: string;
  category: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  version: number;
  projectId: string;
  tags?: string[];
  approvalStatus: string;
  ocrStatus?: string;
  signatureStatus?: string;
  status: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedEntityLink?: string;
  uploadedAt: string;
  uploadedBy?: string;
  link: string;
};

type Dashboard = {
  totalDocuments: number;
  pendingApprovals: number;
  approvedCount: number;
  draftCount: number;
  archivedCount: number;
  byCategory: Array<{ category: string; count: number }>;
  recentUploads: DocItem[];
  pendingQueue: DocItem[];
};

const APPROVAL_STYLE: Record<string, string> = {
  draft: 'bg-slate-500/20 text-slate-300',
  pending: 'bg-amber-500/20 text-amber-300',
  approved: 'bg-emerald-500/20 text-emerald-300',
  rejected: 'bg-red-500/20 text-red-300',
};

const TABS = ['browse', 'approvals', 'archive'] as const;

export function DocumentCenterPage() {
  const { docId } = useParams<{ docId?: string }>();
  if (docId) return <DocumentDetail id={docId} />;
  return <DocumentCenterList />;
}

function DocumentCenterList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as (typeof TABS)[number]) || 'browse';
  const q = searchParams.get('q') || '';
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [results, setResults] = useState<DocItem[]>([]);
  const [searchInput, setSearchInput] = useState(q);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, search] = await Promise.all([
        moduleApi.documents.centerDashboard(),
        moduleApi.documents.search({
          ...(q ? { q } : {}),
          ...(tab === 'approvals' ? { approvalStatus: 'pending' } : {}),
          ...(tab === 'archive' ? { includeArchived: true } : {}),
        }),
      ]);
      setDashboard(dash.data);
      setResults(search.data);
    } finally {
      setLoading(false);
    }
  }, [q, tab]);

  useEffect(() => { load(); }, [load]);

  const setTab = (t: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    if (q) next.set('q', q);
    else next.delete('q');
    setSearchParams(next);
  };

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    if (searchInput.trim()) next.set('q', searchInput.trim());
    else next.delete('q');
    setSearchParams(next);
  };

  const displayDocs = tab === 'approvals'
    ? (dashboard?.pendingQueue ?? results)
    : results;

  return (
    <ModulePageLayout
      title="Enterprise Document Center"
      subtitle="Central repository — version control, approvals, entity links, global search"
      loading={loading}
      stats={[
        { label: 'Total Active', value: dashboard?.totalDocuments ?? 0, color: '#38BDF8' },
        { label: 'Pending Approval', value: dashboard?.pendingApprovals ?? 0, color: '#EAB308' },
        { label: 'Approved', value: dashboard?.approvedCount ?? 0, color: '#22C55E' },
        { label: 'Draft', value: dashboard?.draftCount ?? 0, color: '#94A3B8' },
        { label: 'Archived', value: dashboard?.archivedCount ?? 0, color: '#64748B' },
      ]}
      heroActions={
        <Link to="/business" className="btn-ghost flex items-center gap-2 text-sm">
          <ArrowLeft size={14} /> Business
        </Link>
      }
    >
      <form onSubmit={runSearch} className="mb-4 flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
          <Search size={16} className="text-slate-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search title, filename, tags, OCR text…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
        </div>
        <button type="submit" className="btn-primary text-sm">Search</button>
        <button type="button" onClick={() => load()} className="btn-ghost flex items-center gap-1 text-sm">
          <RefreshCw size={14} />
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs capitalize',
              tab === t ? 'bg-accent/20 text-accent' : 'bg-white/5 text-slate-400 hover:text-white',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {dashboard?.byCategory && dashboard.byCategory.length > 0 && tab === 'browse' && !q && (
        <div className="mb-4 flex flex-wrap gap-2">
          {dashboard.byCategory.map((c) => (
            <span key={c.category} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
              {c.category.replace(/_/g, ' ')} · {c.count}
            </span>
          ))}
        </div>
      )}

      <div className="command-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">v</th>
              <th className="px-4 py-3">Uploaded</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {displayDocs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No documents found</td>
              </tr>
            ) : displayDocs.map((d) => (
              <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <Link to={explorerPath('document', d.id)} className="font-medium text-white hover:text-sky-300">
                    {d.title}
                  </Link>
                  <p className="text-[10px] text-slate-500">{d.fileName}</p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{d.category.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3">
                  <span className={cn('rounded px-1.5 py-0.5 text-[10px]', APPROVAL_STYLE[d.approvalStatus] || APPROVAL_STYLE.draft)}>
                    {d.approvalStatus}
                  </span>
                  {d.status === 'archived' && (
                    <span className="ml-1 rounded bg-slate-600/30 px-1.5 py-0.5 text-[10px] text-slate-400">archived</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs">
                  {d.relatedEntityType ? (
                    <Link to={d.relatedEntityLink || '#'} className="text-sky-400 hover:underline">
                      {d.relatedEntityType.replace(/_/g, ' ')}
                    </Link>
                  ) : (
                    <Link to={`/projects/${d.projectId}?tab=documents`} className="text-slate-500 hover:text-sky-400">
                      project
                    </Link>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{d.version}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDate(d.uploadedAt)}</td>
                <td className="px-4 py-3">
                  <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
                    <ExternalLink size={14} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModulePageLayout>
  );
}

function DocumentDetail({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<Record<string, unknown> | null>(null);
  const [versions, setVersions] = useState<Array<Record<string, unknown>>>([]);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [detail, vers] = await Promise.all([
        moduleApi.documents.get(id),
        moduleApi.documents.versions(id),
      ]);
      setDoc(detail.data);
      setVersions(vers.data);
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

  if (loading && !doc) {
    return (
      <ModulePageLayout title="Document" subtitle="Loading…" loading>
        <div />
      </ModulePageLayout>
    );
  }

  if (!doc) {
    return (
      <ModulePageLayout title="Document not found" subtitle="">
        <Link to="/business/documents" className="text-sky-400 text-sm">← Back to Document Center</Link>
      </ModulePageLayout>
    );
  }

  const fileUrl = String(doc.fileUrl || '');
  const mimeType = String(doc.mimeType || '');
  const approvalStatus = String(doc.approvalStatus || 'draft');
  const status = String(doc.status || 'active');
  const isPdf = mimeType.includes('pdf') || fileUrl.toLowerCase().includes('.pdf');
  const isImage = mimeType.startsWith('image/');

  return (
    <ModulePageLayout
      title={String(doc.title)}
      subtitle={`${String(doc.category).replace(/_/g, ' ')} · v${doc.version}`}
      loading={loading}
      heroActions={
        <Link to="/business/documents" className="btn-ghost flex items-center gap-2 text-sm">
          <ArrowLeft size={14} /> Document Center
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="command-card overflow-hidden">
            <div className="border-b border-white/5 px-4 py-2 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-2">
                <FileText size={14} /> Browser preview
              </span>
              <a href={fileUrl} target="_blank" rel="noreferrer" className="text-xs text-sky-400 flex items-center gap-1">
                Open in tab <ExternalLink size={12} />
              </a>
            </div>
            <div className="min-h-[320px] bg-black/30 flex items-center justify-center p-2">
              {isPdf ? (
                <iframe src={fileUrl} title="Preview" className="h-[480px] w-full rounded" />
              ) : isImage ? (
                <img src={fileUrl} alt={String(doc.title)} className="max-h-[480px] max-w-full object-contain" />
              ) : (
                <p className="text-sm text-slate-500">Preview not available — download to view</p>
              )}
            </div>
          </div>

          {versions.length > 1 && (
            <div className="command-card p-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <History size={14} /> Version history
              </h3>
              <ul className="space-y-2">
                {versions.map((v) => (
                  <li key={String(v.id)} className="flex items-center justify-between text-xs">
                    <Link
                      to={explorerPath('document', String(v.id))}
                      className={cn('text-slate-300 hover:text-sky-300', v.isLatest ? 'font-semibold text-white' : '')}
                    >
                      v{v.version as number} — {formatDate(String(v.uploadedAt))}
                    </Link>
                    <span className={cn('rounded px-1.5 py-0.5', APPROVAL_STYLE[String(v.approvalStatus)] || '')}>
                      {String(v.approvalStatus)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="command-card p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Approval</span>
              <span className={cn('rounded px-2 py-0.5 text-xs', APPROVAL_STYLE[approvalStatus])}>{approvalStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">OCR</span>
              <span className="text-slate-300">{String(doc.ocrStatus || 'pending')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Signature</span>
              <span className="text-slate-300">{String(doc.signatureStatus || 'ready')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Uploaded by</span>
              <span className="text-slate-300">{String(doc.uploadedBy || '—')}</span>
            </div>
            {(doc.tags as string[] | undefined)?.length ? (
              <div>
                <span className="text-slate-500 text-xs">Tags</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(doc.tags as string[]).map((t) => (
                    <span key={t} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">{t}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {doc.relatedEntityType ? (
              <div>
                <span className="text-slate-500 text-xs">Linked entity</span>
                <p className="mt-1">
                  <Link
                    to={resolveEntityLink(String(doc.relatedEntityType), String(doc.relatedEntityId), doc.projectId ? `/explore/project/${doc.projectId}` : '#')}
                    className="text-sky-400 hover:underline text-xs"
                  >
                    {String(doc.relatedEntityType).replace(/_/g, ' ')}
                  </Link>
                </p>
              </div>
            ) : null}
          </div>

          <div className="command-card p-4 flex flex-col gap-2">
            {approvalStatus === 'draft' && status === 'active' && (
              <button
                type="button"
                disabled={acting}
                onClick={() => act(() => moduleApi.documents.submitApproval(id))}
                className="btn-primary flex items-center justify-center gap-2 text-sm"
              >
                <Send size={14} /> Submit for approval
              </button>
            )}
            {approvalStatus === 'pending' && (
              <>
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => act(() => moduleApi.documents.approve(id))}
                  className="btn-primary flex items-center justify-center gap-2 text-sm"
                >
                  <CheckCircle2 size={14} /> Approve
                </button>
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => act(() => moduleApi.documents.reject(id, 'Rejected from Document Center'))}
                  className="btn-ghost flex items-center justify-center gap-2 text-sm text-red-400"
                >
                  <XCircle size={14} /> Reject
                </button>
              </>
            )}
            {status === 'active' ? (
              <button
                type="button"
                disabled={acting}
                onClick={() => act(() => moduleApi.documents.archive(id))}
                className="btn-ghost flex items-center justify-center gap-2 text-sm"
              >
                <Archive size={14} /> Archive
              </button>
            ) : (
              <button
                type="button"
                disabled={acting}
                onClick={() => act(() => moduleApi.documents.restore(id))}
                className="btn-ghost flex items-center justify-center gap-2 text-sm"
              >
                <RotateCcw size={14} /> Restore
              </button>
            )}
          </div>

          <p className="text-[10px] text-slate-600 flex items-center gap-1">
            <Clock size={10} /> OCR & digital signature hooks ready for Phase 3 integration
          </p>
        </div>
      </div>
    </ModulePageLayout>
  );
}
