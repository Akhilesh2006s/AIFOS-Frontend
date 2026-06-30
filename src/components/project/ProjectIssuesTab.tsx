import { useState } from 'react';
import { Plus, UserCheck } from 'lucide-react';
import { CrudTable } from '@/components/ui/CrudTable';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField, FormActions } from '@/components/ui/FormField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { moduleApi } from '@/api/client';

export interface ProjectIssue {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedTo?: string;
}

export function ProjectIssuesTab({ projectId, issues, onRefresh }: { projectId: string; issues: ProjectIssue[]; onRefresh: () => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '' });
  const [saving, setSaving] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await moduleApi.projects.createIssue(projectId, form);
      setModalOpen(false);
      setForm({ title: '', description: '', priority: 'medium', assignedTo: '' });
      onRefresh();
    } finally { setSaving(false); }
  };

  const assign = async (issueId: string) => {
    const assignedTo = prompt('Assign to (name):');
    if (!assignedTo) return;
    await moduleApi.projects.updateIssue(projectId, issueId, { assignedTo, status: 'assigned' });
    onRefresh();
  };

  const resolve = async (issueId: string) => {
    await moduleApi.projects.updateIssue(projectId, issueId, { status: 'resolved' });
    onRefresh();
  };

  return (
    <>
      <CrudTable
        title="Site Issues"
        data={issues}
        actions={
          <button onClick={() => setModalOpen(true)} className="btn-accent flex items-center gap-2 text-xs">
            <Plus size={14} /> Report issue
          </button>
        }
        columns={[
          { key: 'title', label: 'Issue' },
          { key: 'priority', label: 'Priority', render: (v) => <StatusBadge status={String(v)} /> },
          { key: 'status', label: 'Status', render: (v) => <StatusBadge status={String(v)} dot /> },
          { key: 'assignedTo', label: 'Assigned', render: (v) => (v ? String(v) : '—') },
          {
            key: '_id',
            label: 'Actions',
            render: (_, row) => {
              const issue = row as ProjectIssue;
              if (issue.status === 'resolved' || issue.status === 'closed') return null;
              return (
                <div className="flex gap-2">
                  <button onClick={() => assign(issue._id)} className="text-[10px] text-sky-400 hover:underline flex items-center gap-1">
                    <UserCheck size={12} /> Assign
                  </button>
                  <button onClick={() => resolve(issue._id)} className="text-[10px] text-emerald-400 hover:underline">Resolve</button>
                </div>
              );
            },
          },
        ]}
      />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Report site issue">
        <form onSubmit={create} className="space-y-3">
          <TextField label="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <TextField label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <SelectField label="Priority" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </SelectField>
          <FormActions onCancel={() => setModalOpen(false)} loading={saving} />
        </form>
      </Modal>
    </>
  );
}
