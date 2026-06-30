import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField, FormActions } from '@/components/ui/FormField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CrudTable } from '@/components/ui/CrudTable';
import { moduleApi } from '@/api/client';

export interface ResourceAllocation {
  _id: string;
  resourceType: string;
  resourceName: string;
  startDate: string;
  endDate: string;
  status: string;
  assignedBy?: string;
  notes?: string;
}

const TYPES = [
  { value: 'engineer', label: 'Engineer' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'team', label: 'Team' },
];

export function ProjectResourceAllocations({ projectId, allocations, onRefresh }: {
  projectId: string;
  allocations: ResourceAllocation[];
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    resourceType: 'engineer', resourceName: '', startDate: '', endDate: '', notes: '',
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await moduleApi.projects.createAllocation(projectId, form);
      setOpen(false);
      onRefresh();
    } finally { setSaving(false); }
  };

  return (
    <>
      <CrudTable
        title="Resource allocation"
        subtitle="Engineers · equipment · vehicles · contractors · teams"
        data={allocations}
        actions={
          <button type="button" onClick={() => setOpen(true)} className="btn-accent flex items-center gap-2 text-xs">
            <Plus size={14} /> Allocate
          </button>
        }
        columns={[
          { key: 'resourceType', label: 'Type', render: (v) => String(v) },
          { key: 'resourceName', label: 'Resource' },
          { key: 'startDate', label: 'Start', render: (v) => new Date(String(v)).toLocaleDateString() },
          { key: 'endDate', label: 'End', render: (v) => new Date(String(v)).toLocaleDateString() },
          { key: 'status', label: 'Status', render: (v) => <StatusBadge status={String(v)} dot /> },
          { key: 'assignedBy', label: 'By', render: (v) => (v ? String(v) : '—') },
        ]}
      />
      <Modal open={open} onClose={() => setOpen(false)} title="Allocate resource">
        <form onSubmit={submit} className="space-y-3">
          <SelectField label="Type" value={form.resourceType} onChange={(e) => setForm((f) => ({ ...f, resourceType: e.target.value }))}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </SelectField>
          <TextField label="Resource name" required value={form.resourceName} onChange={(e) => setForm((f) => ({ ...f, resourceName: e.target.value }))} />
          <TextField label="Start date" type="date" required value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          <TextField label="End date" type="date" required value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
          <TextField label="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <FormActions onCancel={() => setOpen(false)} loading={saving} />
        </form>
      </Modal>
    </>
  );
}
