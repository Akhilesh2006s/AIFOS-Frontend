import { useEffect, useState, useCallback } from 'react';
import { Wrench, Clock, CheckCircle, Plus, AlertTriangle, Calendar } from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { ModuleTabs } from '@/components/layout/ModuleTabs';
import { CrudTable } from '@/components/ui/CrudTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField, FormActions } from '@/components/ui/FormField';
import { moduleApi } from '@/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { WorkOrder } from '@/types/entities';

const TABS = [
  { id: 'work-orders', label: 'Work Orders' },
  { id: 'breakdowns', label: 'Breakdowns' },
  { id: 'calendar', label: 'Service Calendar' },
] as const;

const empty = { title: '', type: 'preventive', status: 'open', assignedTo: '', estimatedCost: '0', equipmentId: '' };

export function MaintenancePage() {
  const [tab, setTab] = useState('work-orders');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [breakdowns, setBreakdowns] = useState<Array<Record<string, unknown>>>([]);
  const [calendar, setCalendar] = useState<Array<Record<string, unknown>>>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, w, b, c] = await Promise.all([
      moduleApi.maintenance.stats(),
      moduleApi.maintenance.workOrders(),
      moduleApi.maintenance.breakdowns().catch(() => ({ data: [] })),
      moduleApi.maintenance.calendar().catch(() => ({ data: [] })),
    ]);
    setStats(s.data);
    setOrders(w.data);
    setBreakdowns(b.data);
    setCalendar(c.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await moduleApi.maintenance.create({ ...form, estimatedCost: Number(form.estimatedCost) });
      setModalOpen(false);
      await load();
    } finally { setSaving(false); }
  };

  const complete = async (id: string) => {
    await moduleApi.maintenance.complete(id, { completedBy: 'Equipment Manager' });
    await load();
  };

  return (
    <ModulePageLayout
      title="Maintenance Operations"
      subtitle="Preventive, corrective, breakdowns and service calendar"
      loading={loading}
      tabs={<ModuleTabs tabs={TABS} active={tab} onChange={setTab} accent="#1F4E79" />}
      heroActions={
        <button onClick={() => { setForm(empty); setModalOpen(true); }} className="btn-accent flex items-center gap-2">
          <Plus size={16} /> New Work Order
        </button>
      }
      stats={[
        { label: 'Open', value: stats?.open ?? '—', icon: Clock },
        { label: 'In Progress', value: stats?.inProgress ?? '—', icon: Wrench },
        { label: 'Breakdowns', value: stats?.breakdowns ?? '—', icon: AlertTriangle },
        { label: 'Upcoming', value: stats?.upcomingServices ?? '—', icon: Calendar },
        { label: 'Completed', value: stats?.completed ?? '—', icon: CheckCircle },
      ]}
    >
      {tab === 'work-orders' && (
        <CrudTable title="Work Orders" data={orders}
          columns={[
            { key: 'woNumber', label: 'WO #' },
            { key: 'title', label: 'Title' },
            { key: 'type', label: 'Type', render: (v) => <StatusBadge status={String(v)} /> },
            { key: 'status', label: 'Status', render: (v, row) => (
              <div className="flex items-center gap-2">
                <StatusBadge status={String(v)} dot />
                {row.status !== 'completed' && (
                  <button type="button" onClick={() => complete(row._id)} className="text-xs text-emerald-400 hover:underline">Complete</button>
                )}
              </div>
            )},
            { key: 'estimatedCost', label: 'Cost', render: (v) => <span className="font-mono">{formatCurrency(Number(v))}</span> },
          ]}
        />
      )}

      {tab === 'breakdowns' && (
        <CrudTable title="Breakdown Tickets" data={breakdowns as never}
          columns={[
            { key: 'ticketNumber', label: 'Ticket #' },
            { key: 'title', label: 'Issue' },
            { key: 'equipmentId', label: 'Equipment', render: (v) => <span className="font-mono text-xs">{String(v).slice(-6)}</span> },
            { key: 'status', label: 'Status', render: (v) => <StatusBadge status={String(v)} dot /> },
            { key: 'reportedAt', label: 'Reported', render: (v) => v ? formatDate(String(v)) : '—' },
          ]}
        />
      )}

      {tab === 'calendar' && (
        <div className="space-y-2">
          {calendar.map((ev) => (
            <div key={String(ev._id)} className="command-card flex justify-between p-4 text-sm">
              <div>
                <p className="font-mono text-sky-400">{String(ev.woNumber)}</p>
                <p className="text-white">{String(ev.title)}</p>
              </div>
              <p className="text-slate-500">{ev.scheduledDate ? formatDate(String(ev.scheduledDate)) : '—'}</p>
            </div>
          ))}
          {!calendar.length && <p className="text-slate-500">No upcoming services scheduled</p>}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Work Order">
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField label="Title" required value={form.title} onChange={set('title')} />
          <TextField label="Equipment ID" value={form.equipmentId} onChange={set('equipmentId')} />
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Type" value={form.type} onChange={set('type')}><option value="preventive">Preventive</option><option value="corrective">Corrective</option></SelectField>
            <TextField label="Assigned To" value={form.assignedTo} onChange={set('assignedTo')} />
          </div>
          <TextField label="Est. Cost (₹)" type="number" value={form.estimatedCost} onChange={set('estimatedCost')} />
          <FormActions onCancel={() => setModalOpen(false)} loading={saving} />
        </form>
      </Modal>
    </ModulePageLayout>
  );
}
