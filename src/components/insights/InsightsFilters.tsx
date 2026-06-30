import { useEffect, useState, type ReactNode } from 'react';
import { moduleApi } from '@/api/client';
import type { InsightsQueryParams } from '@/api/client';

interface Props {
  filters: InsightsQueryParams;
  onChange: (f: InsightsQueryParams) => void;
}

export function InsightsFilters({ filters, onChange }: Props) {
  const [projects, setProjects] = useState<Array<{ _id: string; name: string; code: string }>>([]);

  useEffect(() => {
    moduleApi.projects.list().then((r) => setProjects(r.data)).catch(() => {});
  }, []);

  const set = (key: keyof InsightsQueryParams, value: string) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  return (
    <div className="command-card flex flex-wrap items-end gap-3 p-4">
      <FilterField label="Project">
        <select
          value={filters.projectId || ''}
          onChange={(e) => set('projectId', e.target.value)}
          className="w-full min-w-[140px] rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white"
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </FilterField>
      <FilterField label="From">
        <input
          type="date"
          value={filters.from || ''}
          onChange={(e) => set('from', e.target.value)}
          className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white"
        />
      </FilterField>
      <FilterField label="To">
        <input
          type="date"
          value={filters.to || ''}
          onChange={(e) => set('to', e.target.value)}
          className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white"
        />
      </FilterField>
      <FilterField label="Cost category">
        <select
          value={filters.category || ''}
          onChange={(e) => set('category', e.target.value)}
          className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-sm text-white"
        >
          <option value="">All categories</option>
          {['Materials', 'Equipment', 'Fuel', 'Maintenance', 'Labour', 'Subcontractors', 'Miscellaneous'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </FilterField>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      {children}
    </div>
  );
}
