import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Banknote, Calendar, CheckCircle2, Clock, Plus, AlertTriangle,
} from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { ModuleTabLinks } from '@/components/layout/ModuleTabLinks';
import { TableCard, TableEmpty } from '@/components/ui/TableCard';
import { ErrorState } from '@/components/ui/ErrorState';
import { moduleApi } from '@/api/client';
import { unwrapList } from '@/lib/apiHelpers';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { explorerPath } from '@/lib/explorerLinks';

type PaymentRow = {
  id: string;
  paymentNumber: string;
  vendorId: string;
  projectId: string;
  amount: number;
  dueDate: string;
  scheduledDate?: string;
  status: string;
  overdue?: boolean;
  link: string;
};

const TABS = ['all', 'ready', 'scheduled', 'paid', 'overdue', 'blocked'] as const;

export function PaymentsPage() {
  const { paymentId } = useParams<{ paymentId?: string }>();
  if (paymentId) return <PaymentDetail id={paymentId} />;
  return <PaymentsList />;
}

function PaymentsList() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'all';
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, list] = await Promise.all([
        moduleApi.business.payments.dashboard(),
        moduleApi.business.payments.list(),
      ]);
      setDashboard(dash.data);
      setPayments(unwrapList(list.data));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const kpis = dashboard?.kpis as Record<string, number> | undefined;
  const ready = (dashboard?.readyForPayment as Array<Record<string, unknown>>) || [];

  const filtered = (() => {
    if (tab === 'ready') return [];
    if (tab === 'scheduled') return payments.filter((p) => p.status === 'scheduled' || p.status === 'approved');
    if (tab === 'paid') return payments.filter((p) => p.status === 'paid');
    if (tab === 'overdue') return payments.filter((p) => p.overdue);
    if (tab === 'blocked') return payments.filter((p) => p.status === 'on_hold');
    return payments;
  })();

  return (
    <ModulePageLayout
      title="Accounts Payable"
      subtitle="Payments, cash flow, and vendor aging"
      loading={loading}
      stats={[
        { label: 'Outstanding', value: formatCurrency(kpis?.totalOutstanding ?? 0), color: '#F97316' },
        { label: 'Due Today', value: formatCurrency(kpis?.dueToday ?? 0), color: '#EAB308' },
        { label: 'Due This Week', value: formatCurrency(kpis?.dueThisWeek ?? 0), color: '#38BDF8' },
        { label: 'Overdue', value: formatCurrency(kpis?.overdueAmount ?? 0), color: '#EF4444' },
        { label: 'Cash 7d', value: formatCurrency(kpis?.cashRequired7Days ?? 0), color: '#8B5CF6' },
        { label: 'Cash 30d', value: formatCurrency(kpis?.cashRequired30Days ?? 0), color: '#A78BFA' },
      ]}
      heroActions={
        <div className="flex gap-2">
          <button type="button" onClick={() => setShowSchedule(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={14} /> Schedule Payment
          </button>
          <Link to="/business/vendor-bills" className="btn-ghost text-sm">Vendor Bills</Link>
          <Link to="/business" className="btn-ghost flex items-center gap-2 text-sm">
            <ArrowLeft size={14} /> Business
          </Link>
        </div>
      }
    >
      <ModuleTabLinks
        active={tab}
        tabs={TABS.map((t) => ({
          id: t,
          label: t === 'ready' ? `Ready (${ready.length})` : t,
          href: `/business/payments?tab=${t}`,
        }))}
      />

      {showSchedule && (
        <ScheduleForm readyBills={ready} onClose={() => setShowSchedule(false)} onDone={load} />
      )}

      {tab === 'ready' ? (
        <TableCard>
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Invoice</th>
                <th scope="col">Vendor</th>
                <th scope="col">Amount</th>
                <th scope="col">Due</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {ready.length === 0 ? (
                <TableEmpty colSpan={5} message="No bills ready for payment" />
              ) : ready.map((b) => (
                <tr key={String(b.billId)} className="data-table-row">
                  <td>{String(b.invoiceNumber)}</td>
                  <td>{String(b.vendorId).slice(-8)}</td>
                  <td className="font-mono text-xs tabular-nums">{formatCurrency(Number(b.amount))}</td>
                  <td className="text-xs">{b.dueDate ? formatDate(String(b.dueDate)) : '—'}</td>
                  <td>
                    <Link to={String(b.link)} className="text-accent text-xs hover:underline">View Bill</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      ) : (
        <PaymentsTable rows={filtered} />
      )}

      {dashboard?.cashForecast != null && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <CashCard title="Cash Forecast" data={dashboard.cashForecast as Record<string, unknown>} />
          <AgingCard data={(dashboard.vendorAging as Record<string, unknown>) || {}} />
        </div>
      )}
    </ModulePageLayout>
  );
}

function PaymentsTable({ rows }: { rows: PaymentRow[] }) {
  return (
    <TableCard>
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">Payment #</th>
            <th scope="col">Vendor</th>
            <th scope="col">Amount</th>
            <th scope="col">Due</th>
            <th scope="col">Status</th>
            <th scope="col" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <TableEmpty colSpan={6} message="No payments" />
          ) : rows.map((p) => (
            <tr key={p.id} className={cn('data-table-row', p.overdue && 'bg-red-500/5')}>
              <td className="font-mono text-xs">{p.paymentNumber}</td>
              <td>{p.vendorId.slice(-8)}</td>
              <td className="font-mono text-xs tabular-nums">{formatCurrency(p.amount)}</td>
              <td className="text-xs">{formatDate(p.dueDate)}</td>
              <td className="text-xs capitalize">{p.status.replace(/_/g, ' ')}</td>
              <td>
                <div className="flex gap-3">
                  <Link to={`/business/payments/${p.id}`} className="text-accent text-xs hover:underline">Manage</Link>
                  <Link to={explorerPath('payment', p.id)} className="text-xs text-slate-500 hover:text-slate-300">Explore</Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
}

function ScheduleForm({
  readyBills,
  onClose,
  onDone,
}: {
  readyBills: Array<Record<string, unknown>>;
  onClose: () => void;
  onDone: () => void;
}) {
  const [billId, setBillId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!billId) return;
    setSaving(true);
    try {
      await moduleApi.business.payments.create({
        vendorBillId: billId,
        schedule: true,
        scheduledDate: scheduledDate || undefined,
      });
      onDone();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="command-card mb-4 p-5">
      <h3 className="text-sm font-semibold text-white">Schedule Payment from Vendor Bill</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <select value={billId} onChange={(e) => setBillId(e.target.value)}
          className="select-field text-sm">
          <option value="">Select bill ready for payment…</option>
          {readyBills.map((b) => (
            <option key={String(b.billId)} value={String(b.billId)}>
              {String(b.invoiceNumber)} — {formatCurrency(Number(b.amount))}
            </option>
          ))}
        </select>
        <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
          className="input-field text-sm" />
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" disabled={saving} onClick={submit} className="btn-primary text-sm">Schedule</button>
        <button type="button" onClick={onClose} className="btn-ghost text-sm">Cancel</button>
      </div>
    </div>
  );
}

function PaymentDetail({ id }: { id: string }) {
  const [payment, setPayment] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await moduleApi.business.payments.get(id);
      setPayment(r.data);
    } catch {
      setError('Payment not found or access denied.');
      setPayment(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <ModulePageLayout title="Payment" subtitle="Loading…" loading><div /></ModulePageLayout>;
  }
  if (error || !payment) {
    return (
      <ModulePageLayout title="Payment" subtitle="Not found" breadcrumbs={[{ label: 'Payments', path: '/business/payments' }, { label: 'Not found' }]}>
        <ErrorState title="Payment not found" message={error || undefined} onRetry={load} />
      </ModulePageLayout>
    );
  }

  const bill = payment.vendorBill as Record<string, unknown> | null;
  const chain = payment.chain as Record<string, string> | null;
  const audit = (payment.auditTrail as Array<{ action: string; actor?: string; at: string }>) || [];

  return (
    <ModulePageLayout
      title={String(payment.paymentNumber)}
      subtitle={`${formatCurrency(Number(payment.amount))} · ${String(payment.status).replace(/_/g, ' ')}`}
      breadcrumbs={[
        { label: 'Payments', path: '/business/payments' },
        { label: String(payment.paymentNumber) },
      ]}
      heroActions={
        <div className="flex gap-2">
          {payment.status === 'scheduled' && (
            <button type="button" onClick={() => moduleApi.business.payments.approve(id).then(load)} className="btn-primary text-sm">
              Approve
            </button>
          )}
          {payment.status === 'approved' && (
            <button type="button" onClick={() => moduleApi.business.payments.markPaid(id).then(load)} className="btn-primary text-sm">
              Mark Paid
            </button>
          )}
          <Link to="/business/payments" className="btn-ghost text-sm">Back</Link>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="Payment" icon={<Banknote size={16} className="text-violet-400" />}>
          <Row label="Amount" value={formatCurrency(Number(payment.amount))} />
          <Row label="Due" value={formatDate(String(payment.dueDate))} />
          <Row label="Scheduled" value={payment.scheduledDate ? formatDate(String(payment.scheduledDate)) : '—'} />
          <Row label="Method" value={String(payment.paymentMethod).toUpperCase()} />
          <Row label="Reference" value={String(payment.referenceNumber || '—')} />
        </InfoCard>
        <InfoCard title="Vendor Bill" icon={<FileTextIcon />}>
          {bill ? (
            <>
              <Row label="Invoice" value={String(bill.invoiceNumber)} />
              <Row label="Bill" value={String(bill.billNumber)} />
              <Link to={String(bill.link)} className="text-xs text-accent hover:underline">View bill →</Link>
            </>
          ) : <p className="text-sm text-slate-500">—</p>}
        </InfoCard>
        <InfoCard title="Operational Chain" icon={<Clock size={16} className="text-sky-400" />}>
          {chain ? (
            <>
              <Row label="Project" value={chain.projectId.slice(-8)} />
              <Row label="PO" value={chain.purchaseOrderId.slice(-8)} />
              <Row label="GRN" value={chain.grnId ? chain.grnId.slice(-8) : '—'} />
            </>
          ) : null}
        </InfoCard>
      </div>
      <div className="command-card mt-4 p-5">
        <h3 className="text-sm font-semibold text-white">Audit Trail</h3>
        <ul className="mt-3 divide-y divide-white/5">
          {audit.map((a, i) => (
            <li key={i} className="flex justify-between py-2 text-sm">
              <span className="capitalize text-slate-300">{a.action}</span>
              <span className="text-xs text-slate-500">{formatDate(a.at)} · {a.actor || 'system'}</span>
            </li>
          ))}
        </ul>
      </div>
    </ModulePageLayout>
  );
}

function CashCard({ title, data }: { title: string; data: Record<string, unknown> }) {
  return (
    <div className="command-card p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
        <Calendar size={16} className="text-sky-400" /> {title}
      </h3>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-slate-500">Today</p><p className="font-mono">{formatCurrency(Number(data.cashRequiredToday))}</p></div>
        <div><p className="text-slate-500">7 Days</p><p className="font-mono">{formatCurrency(Number(data.cashRequired7Days))}</p></div>
        <div><p className="text-slate-500">30 Days</p><p className="font-mono">{formatCurrency(Number(data.cashRequired30Days))}</p></div>
        <div><p className="text-slate-500">Outstanding</p><p className="font-mono">{formatCurrency(Number(data.outstandingVendorLiability))}</p></div>
      </div>
    </div>
  );
}

function AgingCard({ data }: { data: Record<string, unknown> }) {
  const buckets = (data.buckets as Record<string, number>) || {};
  return (
    <div className="command-card p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
        <AlertTriangle size={16} className="text-amber-400" /> Vendor Aging
      </h3>
      <div className="mt-3 space-y-2 text-sm">
        {[
          ['Current', buckets.current],
          ['1–30 Days', buckets.days30],
          ['31–60 Days', buckets.days60],
          ['61–90 Days', buckets.days90],
          ['90+ Days', buckets.over90],
        ].map(([label, val]) => (
          <div key={String(label)} className="flex justify-between">
            <span className="text-slate-500">{label}</span>
            <span className="font-mono">{formatCurrency(Number(val))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="command-card p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">{icon} {title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}

function FileTextIcon() {
  return <CheckCircle2 size={16} className="text-emerald-400" />;
}
