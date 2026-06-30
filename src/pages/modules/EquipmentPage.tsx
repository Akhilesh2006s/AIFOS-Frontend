import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ExternalLink } from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { CrudTable } from '@/components/ui/CrudTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RowAvatar, ProgressBar } from '@/components/ui/TableCells';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField, FormActions } from '@/components/ui/FormField';
import { moduleApi } from '@/api/client';
import { explorerPath } from '@/lib/explorerLinks';

const ASSET_COLOR = '#1F4E79';
const CATEGORIES = ['Excavator', 'Bulldozer', 'Crane', 'Loader', 'Grader', 'Roller', 'Dumper', 'Backhoe', 'Paver', 'Generator', 'Compressor', 'Other'];

const empty = {
  code: '', name: '', category: 'Excavator', manufacturer: '', model: '',
  serialNumber: '', chassisNumber: '', engineNumber: '', purchaseCost: '0',
  currentProjectId: 'proj-001', currentSiteId: '',
};

type EquipmentRow = {
  _id: string; code: string; name: string; category?: string; manufacturer?: string;
  model?: string; status: string; utilizationPercent: number; engineHours: number;
  currentProjectId?: string; assignedOperatorName?: string;
};

export function EquipmentPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [items, setItems] = useState<EquipmentRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, e] = await Promise.all([moduleApi.equipment.stats(), moduleApi.equipment.list()]);
    setStats(s.data);
    setItems(e.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await moduleApi.equipment.create({
        ...form,
        make: form.manufacturer,
        purchaseCost: Number(form.purchaseCost),
        status: 'available',
      });
      setModalOpen(false);
      setForm(empty);
      await load();
      if (created.data._id) navigate(explorerPath('equipment', created.data._id));
    } finally { setSaving(false); }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <ModulePageLayout
      title="Equipment Registry"
      subtitle="Register and manage heavy infrastructure assets"
      loading={loading}
      heroActions={
        <button onClick={() => { setForm(empty); setModalOpen(true); }} className="btn-accent flex items-center gap-2">
          <Plus size={16} /> Register Equipment
        </button>
      }
      stats={[
        { label: 'Total', value: stats?.total ?? '—', color: ASSET_COLOR },
        { label: 'Running', value: stats?.running ?? stats?.active ?? '—', color: '#22C55E' },
        { label: 'Idle', value: stats?.idle ?? '—', color: '#64748B' },
        { label: 'Breakdown', value: stats?.breakdowns ?? stats?.inMaintenance ?? '—', color: '#EF4444' },
        { label: 'Utilization', value: `${stats?.utilizationPercent ?? stats?.avgUtilization ?? 0}%`, color: ASSET_COLOR, progress: stats?.utilizationPercent ?? stats?.avgUtilization },
      ]}
    >
      <CrudTable
        title="Equipment Fleet"
        subtitle={`${items.length} machines · click any row to explore operational chain`}
        data={items}
        loading={loading}
        onRowClick={(r) => navigate(explorerPath('equipment', r._id))}
        searchKeys={['code', 'name', 'category', 'assignedOperatorName']}
        searchPlaceholder="Search equipment…"
        columns={[
          { key: 'code', label: 'ID', sortable: true, render: (v) => <span className="font-mono text-sky-400/80">{String(v)}</span> },
          { key: 'name', label: 'Equipment', sortable: true, render: (v) => (
            <span className="flex items-center gap-2">
              <RowAvatar name={String(v)} color={ASSET_COLOR} />
              <ExternalLink size={12} className="text-slate-600 opacity-0 group-hover:opacity-100" />
            </span>
          )},
          { key: 'category', label: 'Category', sortable: true },
          { key: 'currentProjectId', label: 'Project', render: (v) => <span className="font-mono text-xs">{String(v || '—')}</span> },
          { key: 'status', label: 'Status', sortable: true, render: (v) => <StatusBadge status={String(v)} dot /> },
          { key: 'utilizationPercent', label: 'Utilization', sortable: true, render: (v) => <ProgressBar value={Number(v)} color={ASSET_COLOR} /> },
          { key: 'assignedOperatorName', label: 'Operator', sortable: true, render: (v) => String(v || '—') },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Register Equipment">
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField label="Equipment ID" required value={form.code} onChange={set('code')} />
          <TextField label="Equipment Name" required value={form.name} onChange={set('name')} />
          <SelectField label="Category" value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectField>
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Manufacturer" value={form.manufacturer} onChange={set('manufacturer')} />
            <TextField label="Model" value={form.model} onChange={set('model')} />
          </div>
          <TextField label="Serial Number" value={form.serialNumber} onChange={set('serialNumber')} />
          <TextField label="Chassis Number" value={form.chassisNumber} onChange={set('chassisNumber')} />
          <TextField label="Engine Number" value={form.engineNumber} onChange={set('engineNumber')} />
          <TextField label="Purchase Cost (₹)" type="number" value={form.purchaseCost} onChange={set('purchaseCost')} />
          <FormActions onCancel={() => setModalOpen(false)} loading={saving} submitLabel="Register" />
        </form>
      </Modal>
    </ModulePageLayout>
  );
}
