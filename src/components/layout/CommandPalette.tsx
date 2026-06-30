import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { useContextStore } from '@/store/context';
import { cn } from '@/lib/utils';

const KIND_LABELS: Record<string, string> = {
  project: 'Project',
  equipment: 'Equipment',
  vendor: 'Vendor',
  pr: 'PR',
  po: 'PO',
  material: 'Material',
  issue: 'Issue',
  document: 'Document',
  workspace: 'Workspace',
  page: 'Page',
};

export function CommandPalette() {
  const open = useWorkspaceStore((s) => s.commandPaletteOpen);
  const setOpen = useWorkspaceStore((s) => s.setCommandPaletteOpen);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { grouped } = useGlobalSearch(query);
  const activeProject = useContextStore((s) => s.activeProject);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  if (!open) return null;

  const go = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 pt-[10vh] backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-command-sidebar shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <Search size={18} className="text-accent" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={activeProject ? `Search in ${activeProject.name}…` : 'Search NH44, equipment, PO, vendor…'}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">esc</kbd>
        </div>
        {activeProject && (
          <p className="border-b border-sky-500/20 bg-sky-500/10 px-4 py-2 text-[10px] text-sky-300">
            Context: {activeProject.name} — results scoped to this project
          </p>
        )}
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {grouped.map(([group, items]) => (
            <div key={group} className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">{group}</p>
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => go(item.path)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">{item.label}</p>
                    <p className="truncate text-[10px] text-slate-500">{item.sublabel}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={cn('rounded-md px-1.5 py-0.5 text-[9px] font-medium uppercase', kindStyle(item.kind))}>
                      {KIND_LABELS[item.kind] || item.kind}
                    </span>
                    <ArrowRight size={14} className="text-slate-600" />
                  </div>
                </button>
              ))}
            </div>
          ))}
          {grouped.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-500">No results — try NH44, cement, or vendor</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-2.5">
          {['NH44', 'Project', 'Equipment', 'PO', 'Vendor', 'GRN', 'Employee'].map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag.toLowerCase())}
              className="rounded-lg bg-white/5 px-2 py-1 text-[10px] text-slate-500 hover:bg-white/10 hover:text-slate-300"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function kindStyle(kind: string) {
  const map: Record<string, string> = {
    project: 'bg-sky-500/15 text-sky-400',
    equipment: 'bg-steel-500/15 text-sky-300',
    vendor: 'bg-emerald-500/15 text-emerald-400',
    pr: 'bg-yellow-500/15 text-yellow-400',
    po: 'bg-amber-500/15 text-amber-400',
    workspace: 'bg-accent/15 text-accent',
    material: 'bg-purple-500/15 text-purple-400',
    issue: 'bg-red-500/15 text-red-400',
    document: 'bg-slate-500/15 text-slate-400',
  };
  return map[kind] || 'bg-slate-500/15 text-slate-400';
}
