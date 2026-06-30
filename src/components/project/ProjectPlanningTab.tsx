import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CrudTable } from '@/components/ui/CrudTable';
import { Modal } from '@/components/ui/Modal';
import { TextField, FormActions } from '@/components/ui/FormField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/TableCells';
import { ProjectTimeline } from '@/components/project/ProjectTimeline';
import { ProjectResourceAllocations, type ResourceAllocation } from '@/components/project/ProjectResourceAllocations';
import { moduleApi } from '@/api/client';
import { formatCurrency } from '@/lib/utils';

export interface Milestone {
  _id: string;
  name: string;
  targetDate: string;
  budgetAmount: number;
  status: string;
  progressPercent: number;
  wbsCode?: string;
}

export function ProjectPlanningTab({
  projectId,
  milestones,
  sites,
  allocations,
  projectStart,
  projectEnd,
  onRefresh,
}: {
  projectId: string;
  milestones: Milestone[];
  sites: Array<{ _id: string; code: string; name: string; city: string }>;
  allocations: ResourceAllocation[];
  projectStart?: string;
  projectEnd?: string;
  onRefresh: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', targetDate: '', budgetAmount: '0', wbsCode: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await moduleApi.projects.createMilestone(projectId, {
        ...form,
        budgetAmount: Number(form.budgetAmount),
      });
      setModalOpen(false);
      onRefresh();
    } finally { setSaving(false); }
  };

  const advance = async (milestoneId: string, status: string) => {
    await moduleApi.projects.updateMilestone(projectId, milestoneId, { status });
    onRefresh();
  };

  return (
    <div className="space-y-5">
      <ProjectTimeline milestones={milestones} projectStart={projectStart} projectEnd={projectEnd} />

      <CrudTable
        title="Milestones & WBS"
        subtitle="Timeline · budget · target dates"
        data={milestones}
        actions={
          <button type="button" onClick={() => setModalOpen(true)} className="btn-accent flex items-center gap-2 text-xs">
            <Plus size={14} /> Add milestone
          </button>
        }
        columns={[
          { key: 'wbsCode', label: 'WBS', render: (v) => (v ? String(v) : '—') },
          { key: 'name', label: 'Milestone' },
          { key: 'targetDate', label: 'Target', render: (v) => new Date(String(v)).toLocaleDateString() },
          { key: 'budgetAmount', label: 'Budget', render: (v) => formatCurrency(Number(v)) },
          { key: 'status', label: 'Status', render: (v) => <StatusBadge status={String(v)} dot /> },
          { key: 'progressPercent', label: 'Progress', render: (v) => <ProgressBar value={Number(v)} color="#38BDF8" showLabel={false} /> },
          {
            key: '_id',
            label: 'Actions',
            render: (_, row) => {
              const m = row as Milestone;
              if (m.status === 'completed') return null;
              const overdue = new Date(m.targetDate) < new Date();
              return (
                <button
                  type="button"
                  onClick={() => advance(m._id, m.status === 'pending' || m.status === 'planned' ? 'in_progress' : 'completed')}
                  className={`text-[10px] hover:underline ${overdue ? 'text-red-400' : 'text-sky-400'}`}
                >
                  {m.status === 'pending' || m.status === 'planned' ? 'Start' : 'Complete'}
                </button>
              );
            },
          },
        ]}
      />

      <ProjectResourceAllocations projectId={projectId} allocations={allocations} onRefresh={onRefresh} />

      {sites.length > 0 && (
        <CrudTable title="Sites" data={sites} columns={[
          { key: 'code', label: 'Code' },
          { key: 'name', label: 'Site' },
          { key: 'city', label: 'City' },
        ]} />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add milestone">
        <form onSubmit={submit} className="space-y-3">
          <TextField label="WBS code" value={form.wbsCode} onChange={(e) => setForm((f) => ({ ...f, wbsCode: e.target.value }))} />
          <TextField label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <TextField label="Target date" type="date" required value={form.targetDate} onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))} />
          <TextField label="Budget (₹)" value={form.budgetAmount} onChange={(e) => setForm((f) => ({ ...f, budgetAmount: e.target.value }))} />
          <FormActions onCancel={() => setModalOpen(false)} loading={saving} />
        </form>
      </Modal>
    </div>
  );
}
