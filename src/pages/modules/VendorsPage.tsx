import { useEffect, useState, useCallback } from 'react';
import { Handshake, Plus, Star } from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { CrudTable } from '@/components/ui/CrudTable';
import { Modal } from '@/components/ui/Modal';
import { TextField, FormActions } from '@/components/ui/FormField';
import { moduleApi } from '@/api/client';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface Vendor {
  _id: string;
  code: string;
  name: string;
  contactPerson?: string;
  gstin?: string;
  pan?: string;
  status: string;
  rating: number;
  onTimeDeliveryPercent?: number;
  qualityScore?: number;
}

const emptyForm = { code: '', name: '', contactPerson: '', email: '', phone: '', gstin: '', pan: '' };

export function VendorsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, v] = await Promise.all([moduleApi.vendors.stats(), moduleApi.vendors.list()]);
    setStats(s.data);
    setVendors(v.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    await moduleApi.vendors.create(form);
    setModalOpen(false);
    setForm(emptyForm);
    await load();
    setSaving(false);
  };

  return (
    <ModulePageLayout
      title="Supplier Management"
      subtitle="Onboarding, GST/PAN compliance, performance ratings — feeds Procurement PO awards"
      loading={loading}
      stats={[
        { label: 'Total Vendors', value: stats?.total ?? '—', icon: Handshake, iconColor: 'text-amber-400' },
        { label: 'Approved', value: stats?.approved ?? '—', iconColor: 'text-emerald-400' },
        { label: 'Pending', value: stats?.pending ?? '—', iconColor: 'text-orange-400' },
      ]}
      heroActions={
        <button onClick={() => setModalOpen(true)} className="btn-accent flex items-center gap-2 text-sm">
          <Plus size={16} /> Register Vendor
        </button>
      }
    >
      <CrudTable
        title="Vendor Registry"
        subtitle="Approved vendors receive RFQs and POs from Procurement Cloud"
        data={vendors}
        columns={[
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Name' },
          { key: 'gstin', label: 'GSTIN' },
          { key: 'pan', label: 'PAN' },
          { key: 'status', label: 'Status', render: (v) => <StatusBadge status={String(v)} /> },
          {
            key: 'rating',
            label: 'Rating',
            render: (v, row) => (
              <span className="flex items-center gap-1 text-amber-400">
                <Star size={12} fill="currentColor" /> {String(v)} · {row.onTimeDeliveryPercent ?? 0}% OTD
              </span>
            ),
          },
        ]}
        actions={
          <button onClick={() => setModalOpen(true)} className="btn-accent text-sm">+ Vendor</button>
        }
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Register Vendor">
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
          <TextField label="Vendor Code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <TextField label="Company Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Contact Person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
          <TextField label="GSTIN" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
          <TextField label="PAN" value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} />
          <FormActions onCancel={() => setModalOpen(false)} loading={saving} submitLabel="Register" />
        </form>
      </Modal>
    </ModulePageLayout>
  );
}
