import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, CheckCircle2, FileText, Plus, RefreshCw, Send, XCircle,
} from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { ErrorState } from '@/components/ui/ErrorState';
import { moduleApi } from '@/api/client';
import { unwrapList } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/utils';
import { explorerPath } from '@/lib/explorerLinks';

type BillRow = {
  id: string;
  billNumber: string;
  invoiceNumber: string;
  vendorId: string;
  projectId: string;
  purchaseOrderId: string;
  totalAmount: number;
  status: string;
  exceptionCount: number;
  link: string;
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-slate-400',
  submitted: 'text-sky-400',
  matching: 'text-emerald-400',
  exception: 'text-red-400',
  approved: 'text-violet-400',
  ready_for_payment: 'text-green-400',
  cancelled: 'text-slate-600',
};

const TABS = [
  { id: 'all', statuses: [] as string[] },
  { id: 'pending', statuses: ['draft', 'submitted'] },
  { id: 'review', statuses: ['submitted', 'matching'] },
  { id: 'exceptions', statuses: ['exception'] },
  { id: 'approved', statuses: ['approved'] },
  { id: 'ready', statuses: ['ready_for_payment'] },
];

export function VendorBillsPage() {
  const { billId } = useParams<{ billId?: string }>();
  if (billId) return <VendorBillDetail billId={billId} />;
  return <VendorBillsList />;
}

function VendorBillsList() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'all';
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<BillRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [showCreate, setShowCreate] = useState(searchParams.get('action') === 'create');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, dash] = await Promise.all([
        moduleApi.business.vendorBills.list(),
        moduleApi.business.vendorBills.dashboard(),
      ]);
      setBills(unwrapList(list.data));
      setCounts(dash.data.counts || {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tabDef = TABS.find((t) => t.id === tab) || TABS[0];
  const filtered = tabDef.statuses.length
    ? bills.filter((b) => tabDef.statuses.includes(b.status))
    : bills;

  return (
    <ModulePageLayout
      title="Vendor Bills"
      subtitle="Three-way matching — PO · GRN · Vendor Invoice"
      loading={loading}
      stats={[
        { label: 'Pending', value: counts.pending ?? 0, color: '#38BDF8' },
        { label: 'Exceptions', value: counts.exceptions ?? 0, color: '#EF4444' },
        { label: 'Approved', value: counts.approved ?? 0, color: '#8B5CF6' },
        { label: 'Ready to Pay', value: counts.readyForPayment ?? 0, color: '#22C55E' },
      ]}
      heroActions={
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={14} /> Create Vendor Bill
          </button>
          <Link to="/business" className="btn-ghost flex items-center gap-2 text-sm">
            <ArrowLeft size={14} /> Business
          </Link>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.id}
            to={`/business/vendor-bills?tab=${t.id}`}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${tab === t.id ? 'bg-sky-500/20 text-sky-300' : 'text-slate-500 hover:text-white'}`}
          >
            {t.id}
          </Link>
        ))}
      </div>

      {showCreate && <CreateBillForm onClose={() => setShowCreate(false)} onCreated={load} />}

      <div className="command-card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Bill #</th>
              <th className="px-5 py-3">Invoice</th>
              <th className="px-5 py-3">Vendor</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">No vendor bills</td></tr>
            ) : filtered.map((b) => (
              <tr key={b.id}>
                <td className="px-5 py-3 font-mono text-xs">{b.billNumber}</td>
                <td className="px-5 py-3">{b.invoiceNumber}</td>
                <td className="px-5 py-3 text-slate-400">{b.vendorId.slice(-8)}</td>
                <td className="px-5 py-3 font-mono text-xs">{formatCurrency(b.totalAmount)}</td>
                <td className={`px-5 py-3 text-xs capitalize ${STATUS_COLORS[b.status] || ''}`}>
                  {b.status.replace(/_/g, ' ')}
                  {b.exceptionCount > 0 && <span className="ml-1 text-red-400">({b.exceptionCount})</span>}
                </td>
                <td className="px-5 py-3">
                  <Link to={explorerPath('vendor-bill', b.id)} className="text-accent hover:underline text-xs">Explore</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModulePageLayout>
  );
}

function CreateBillForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [pos, setPos] = useState<Array<{ _id: string; poNumber: string; vendorId: string; totalAmount: number }>>([]);
  const [form, setForm] = useState({
    purchaseOrderId: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    totalAmount: '',
    submit: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    moduleApi.procurement.pos().then((r) => {
      const open = (r.data as Array<{ _id: string; poNumber: string; vendorId: string; totalAmount: number; status: string }>)
        .filter((p) => ['issued', 'partial_received', 'received', 'partially_delivered'].includes(p.status));
      setPos(open);
    });
  }, []);

  const selectedPo = pos.find((p) => p._id === form.purchaseOrderId);

  const submit = async () => {
    if (!form.purchaseOrderId || !form.invoiceNumber) return;
    setSaving(true);
    try {
      await moduleApi.business.vendorBills.create({
        purchaseOrderId: form.purchaseOrderId,
        vendorId: selectedPo?.vendorId,
        projectId: undefined,
        invoiceNumber: form.invoiceNumber,
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate || undefined,
        totalAmount: Number(form.totalAmount) || selectedPo?.totalAmount,
        submit: form.submit,
      });
      onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="command-card mb-4 p-5">
      <h3 className="text-sm font-semibold text-white">Create Vendor Bill</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-slate-500">
          Purchase Order
          <select
            value={form.purchaseOrderId}
            onChange={(e) => setForm({ ...form, purchaseOrderId: e.target.value, totalAmount: String(pos.find((p) => p._id === e.target.value)?.totalAmount ?? '') })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
          >
            <option value="">Select PO…</option>
            {pos.map((p) => <option key={p._id} value={p._id}>{p.poNumber} — {formatCurrency(p.totalAmount)}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-500">
          Invoice Number
          <input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
        </label>
        <label className="text-xs text-slate-500">
          Invoice Date
          <input type="date" value={form.invoiceDate} onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
        </label>
        <label className="text-xs text-slate-500">
          Total Amount
          <input type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
        </label>
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" disabled={saving} onClick={submit} className="btn-primary text-sm">Create & Match</button>
        <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
      </div>
    </div>
  );
}

function VendorBillDetail({ billId }: { billId: string }) {
  const [bill, setBill] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await moduleApi.business.vendorBills.get(billId);
      setBill(r.data);
    } catch {
      setError('Vendor bill not found or access denied.');
      setBill(null);
    } finally {
      setLoading(false);
    }
  }, [billId]);

  useEffect(() => { load(); }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setActionLoading(true);
    try {
      await fn();
      load();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <ModulePageLayout title="Vendor Bill" subtitle="Loading…" loading><div /></ModulePageLayout>;
  }
  if (error || !bill) {
    return (
      <ModulePageLayout
        title="Vendor Bill"
        subtitle="Not found"
        breadcrumbs={[
          { label: 'Business', path: '/business' },
          { label: 'Vendor Bills', path: '/business/vendor-bills' },
          { label: 'Not found' },
        ]}
      >
        <ErrorState title="Bill not found" message={error || undefined} onRetry={load} />
      </ModulePageLayout>
    );
  }

  const status = String(bill.status);
  const exceptions = (bill.exceptions as Array<{ code: string; reason: string; severity: string; suggestedResolution: string }>) || [];
  const poSummary = bill.poSummary as Record<string, unknown> | null;
  const grnSummary = bill.grnSummary as Record<string, unknown> | null;
  const matching = bill.matchingStatus as Record<string, boolean> | null;
  const variance = bill.varianceAnalysis as Record<string, number> | null;
  const audit = (bill.auditTrail as Array<{ action: string; actor?: string; at: string; comment?: string }>) || [];

  return (
    <ModulePageLayout
      title={String(bill.billNumber)}
      subtitle={`Invoice ${bill.invoiceNumber} · ${status.replace(/_/g, ' ')}`}
      breadcrumbs={[
        { label: 'Business', path: '/business' },
        { label: 'Vendor Bills', path: '/business/vendor-bills' },
        { label: String(bill.billNumber) },
      ]}
      heroActions={
        <div className="flex gap-2">
          {status === 'ready_for_payment' && (
            <button
              type="button"
              className="btn-primary text-sm"
              onClick={() => {
                moduleApi.business.payments.create({ vendorBillId: billId, schedule: true }).then(() => {
                  window.location.href = '/business/payments';
                });
              }}
            >
              Schedule Payment
            </button>
          )}
          <Link to="/business/vendor-bills" className="btn-ghost flex items-center gap-2 text-sm">
            <ArrowLeft size={14} /> Back
          </Link>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {['match', 'approve', 'reject', 'send-back'].map((a) => (
          <button
            key={a}
            type="button"
            disabled={actionLoading}
            onClick={() => {
              if (a === 'match') run(() => moduleApi.business.vendorBills.match(billId));
              if (a === 'approve') run(() => moduleApi.business.vendorBills.approve(billId));
              if (a === 'reject') run(() => moduleApi.business.vendorBills.reject(billId, 'Rejected for review'));
              if (a === 'send-back') run(() => moduleApi.business.vendorBills.sendBack(billId, 'Sent back for correction'));
            }}
            className="btn-ghost flex items-center gap-1 text-xs capitalize"
          >
            {a === 'match' && <RefreshCw size={12} />}
            {a === 'approve' && <CheckCircle2 size={12} />}
            {a === 'reject' && <XCircle size={12} />}
            {a === 'send-back' && <Send size={12} />}
            {a.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SummaryCard title="Invoice Summary" icon={<FileText size={16} className="text-sky-400" />}>
          <Row label="Invoice #" value={String(bill.invoiceNumber)} />
          <Row label="Date" value={formatDate(String(bill.invoiceDate))} />
          <Row label="Due" value={bill.dueDate ? formatDate(String(bill.dueDate)) : '—'} />
          <Row label="Subtotal" value={formatCurrency(Number(bill.subtotal))} />
          <Row label="GST" value={formatCurrency(Number(bill.gstAmount))} />
          <Row label="Total" value={formatCurrency(Number(bill.totalAmount))} accent />
        </SummaryCard>
        <SummaryCard title="PO Summary" icon={<FileText size={16} className="text-amber-400" />}>
          {poSummary ? (
            <>
              <Row label="PO" value={String(poSummary.poNumber)} />
              <Row label="Status" value={String(poSummary.status)} />
              <Row label="PO Total" value={formatCurrency(Number(poSummary.totalAmount))} />
              <Link to="/procurement?tab=po" className="mt-2 text-xs text-accent hover:underline">Open PO →</Link>
            </>
          ) : <p className="text-sm text-slate-500">No PO linked</p>}
        </SummaryCard>
        <SummaryCard title="GRN Summary" icon={<FileText size={16} className="text-emerald-400" />}>
          {grnSummary ? (
            <>
              <Row label="GRN" value={String(grnSummary.grnNumber)} />
              <Row label="Received" value={grnSummary.receivedAt ? formatDate(String(grnSummary.receivedAt)) : '—'} />
              <Row label="GRN Value" value={formatCurrency(Number((bill.matchSummary as Record<string, number>)?.grnTotal ?? 0))} />
              <Link to="/inventory?tab=grn" className="mt-2 text-xs text-accent hover:underline">Open GRN →</Link>
            </>
          ) : <p className="text-sm text-red-400">No GRN — matching will fail</p>}
        </SummaryCard>
      </div>

      {matching && (
        <div className="command-card mt-4 p-5">
          <h3 className="text-sm font-semibold text-white">Matching Status</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(matching).filter(([k]) => k.endsWith('Match') || k === 'grnPresent').map(([k, v]) => (
              <span key={k} className={`rounded-full px-2 py-1 text-[10px] ${v ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                {k.replace(/([A-Z])/g, ' $1').trim()}: {v ? '✓' : '✗'}
              </span>
            ))}
          </div>
        </div>
      )}

      {variance && (
        <div className="command-card mt-4 p-5">
          <h3 className="text-sm font-semibold text-white">Variance Analysis</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-3 text-sm">
            <div><span className="text-slate-500">PO</span><p className="font-mono">{formatCurrency(variance.poTotal)}</p></div>
            <div><span className="text-slate-500">GRN</span><p className="font-mono">{formatCurrency(variance.grnTotal)}</p></div>
            <div><span className="text-slate-500">Bill</span><p className="font-mono">{formatCurrency(variance.billTotal)}</p></div>
          </div>
          <p className={`mt-2 text-sm ${variance.varianceAmount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            Variance: {formatCurrency(variance.varianceAmount)} ({variance.variancePercent}%)
          </p>
        </div>
      )}

      {exceptions.length > 0 && (
        <div className="command-card mt-4 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <AlertTriangle size={16} className="text-red-400" /> Exceptions ({exceptions.length})
          </h3>
          <ul className="mt-3 space-y-3">
            {exceptions.map((e, i) => (
              <li key={i} className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                <p className="text-sm font-medium text-white">{e.reason}</p>
                <p className="mt-1 text-xs text-slate-400">{e.suggestedResolution}</p>
                <span className="mt-1 inline-block text-[10px] uppercase text-red-400">{e.severity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="command-card mt-4 p-5">
        <h3 className="text-sm font-semibold text-white">Approval Timeline</h3>
        <ul className="mt-3 divide-y divide-white/5">
          {audit.map((a, i) => (
            <li key={i} className="flex justify-between py-2 text-sm">
              <span className="text-slate-300 capitalize">{a.action.replace(/_/g, ' ')}</span>
              <span className="text-xs text-slate-500">{formatDate(a.at)} · {a.actor || 'system'}</span>
            </li>
          ))}
        </ul>
      </div>
    </ModulePageLayout>
  );
}

function SummaryCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="command-card p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">{icon} {title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={accent ? 'font-mono font-semibold text-accent' : 'text-white'}>{value}</span>
    </div>
  );
}
