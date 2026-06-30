import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { moduleApi } from '@/api/client';
import { resolveExplorerKind } from '@/lib/explorerLinks';
import { cn } from '@/lib/utils';

const KIND_LABELS: Record<string, string> = {
  project: 'Project',
  site: 'Site',
  boq: 'BOQ',
  material_requirement: 'MR',
  issue: 'Issue',
  daily_report: 'Report',
  document: 'Document',
};

export function ProjectsWorkspaceSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ kind: string; id: string; label: string; sublabel: string; projectId: string }>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      moduleApi.projects.search(query).then((r) => setResults(r.data.results || []));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const go = (r: typeof results[0]) => {
    const explorerKinds = ['boq', 'material_requirement', 'issue', 'daily_report', 'document', 'site', 'project'];
    if (explorerKinds.includes(r.kind)) {
      navigate(resolveExplorerKind(r.kind === 'project' ? 'project' : r.kind, r.id));
    } else {
      const tabMap: Record<string, string> = {
        boq: 'boq', material_requirement: 'requirements', issue: 'issues', daily_report: 'daily-reports', document: 'documents',
      };
      const tab = tabMap[r.kind];
      navigate(tab ? `/projects/${r.projectId}?tab=${tab}` : `/explore/project/${r.projectId}`);
    }
    setQuery('');
    setResults([]);
  };

  return (
    <div className="relative mb-5">
      <div className="search-input-wrap">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects, sites, BOQ, issues, reports, documents…"
          className="search-input"
          aria-label="Search projects workspace"
          aria-expanded={results.length > 0}
          aria-controls="projects-search-results"
        />
      </div>
      {results.length > 0 && (
        <div
          id="projects-search-results"
          role="listbox"
          className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border shadow-glassxl"
          style={{ borderColor: 'var(--command-border)', backgroundColor: 'var(--command-sidebar)' }}
        >
          {results.map((r) => (
            <button
              key={`${r.kind}-${r.id}`}
              type="button"
              role="option"
              onClick={() => go(r)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-200">{r.label}</p>
                <p className="truncate text-[10px] text-slate-500">{r.sublabel}</p>
              </div>
              <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[9px] uppercase text-sky-400 bg-sky-500/10')}>
                {KIND_LABELS[r.kind] || r.kind}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
