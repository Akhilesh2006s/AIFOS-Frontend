import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { Modal } from '@/components/ui/Modal';
import { ErrorState } from '@/components/ui/ErrorState';
import { TextField, SelectField, FormActions } from '@/components/ui/FormField';
import { ProjectsWorkspaceHub } from '@/components/workspace/ProjectsWorkspaceHub';
import { RoleTodayWorkPanel } from '@/components/command/RoleTodayWorkPanel';
import { ProjectsWorkspaceSearch } from '@/components/project/ProjectsWorkspaceSearch';
import { useContextStore } from '@/store/context';
import { moduleApi } from '@/api/client';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { unwrapList } from '@/lib/apiHelpers';
import type { Project } from '@/types/entities';

const PORTFOLIO_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'delayed', label: 'Delayed' },
  { id: 'completed', label: 'Completed' },
  { id: 'archived', label: 'Archived' },
] as const;

const emptyForm = {
  code: '', name: '', client: '', status: 'active',
  progressPercent: '0', budgetAmount: '0', projectManager: '', siteCount: '1',
};

export function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  const { setActiveProject } = useContextStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, p] = await Promise.all([
        moduleApi.projects.stats(),
        moduleApi.projects.list(filter === 'all' ? undefined : filter),
      ]);
      setStats(s.data);
      setProjects(unwrapList(p.data));
    } catch {
      setError('Failed to load projects. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openProject = (p: Project) => {
    setActiveProject({ id: p._id, name: p.name, code: p.code });
  };

  const openCreate = () => { setForm(emptyForm); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      progressPercent: Number(form.progressPercent),
      budgetAmount: Number(form.budgetAmount),
      siteCount: Number(form.siteCount),
    };
    try {
      await moduleApi.projects.create(payload);
      setModalOpen(false);
      await load();
    } finally { setSaving(false); }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <ModulePageLayout
      title="Projects Workspace"
      subtitle="Portfolio → project lifecycle — Production starts here"
      loading={loading}
      heroActions={
        <button onClick={openCreate} className="btn-accent flex items-center gap-2 text-sm">
          <Plus size={16} /> New Project
        </button>
      }
      stats={[
        { label: 'Active', value: stats?.active ?? '—', color: '#38BDF8' },
        { label: 'Delayed', value: stats?.delayed ?? '—', color: '#EF4444' },
        { label: 'Completed', value: stats?.completed ?? '—', color: '#22C55E' },
        { label: 'Budget', value: formatCurrency(stats?.totalBudget ?? 0), color: '#F97316' },
      ]}
    >
      {error && <ErrorState message={error} onRetry={load} />}
      {!error && (
        <>
      <ProjectsWorkspaceSearch />

      <div className="mb-6">
        <RoleTodayWorkPanel />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {PORTFOLIO_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setSearchParams(f.id === 'all' ? {} : { filter: f.id })}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              filter === f.id ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30' : 'bg-white/5 text-slate-500 hover:text-slate-300',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ProjectsWorkspaceHub projects={projects} stats={stats} onOpenProject={openProject} />
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Project">
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField label="Project Code" required value={form.code} onChange={set('code')} />
          <TextField label="Project Name" required value={form.name} onChange={set('name')} />
          <TextField label="Client" value={form.client} onChange={set('client')} />
          <TextField label="Project Manager" value={form.projectManager} onChange={set('projectManager')} />
          <SelectField label="Status" value={form.status} onChange={set('status')}>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </SelectField>
          <FormActions onCancel={() => setModalOpen(false)} loading={saving} />
        </form>
      </Modal>
    </ModulePageLayout>
  );
}
