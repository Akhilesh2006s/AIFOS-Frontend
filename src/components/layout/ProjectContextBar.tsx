import { Link } from 'react-router-dom';
import { MapPin, X } from 'lucide-react';
import { useContextStore } from '@/store/context';
import { cn } from '@/lib/utils';

export function ProjectContextBar() {
  const { activeProject, clearContext } = useContextStore();

  if (!activeProject) return null;

  return (
    <div className="border-b border-sky-500/20 bg-sky-500/10 px-4 py-2 lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <MapPin size={14} className="shrink-0 text-sky-400" />
          <p className="truncate text-xs text-slate-300">
            Working in{' '}
            <Link
              to={`/projects/${activeProject.id}`}
              className="font-semibold text-sky-300 hover:text-white"
            >
              {activeProject.name}
            </Link>
            <span className="text-slate-500"> · {activeProject.code}</span>
          </p>
          <span className="hidden rounded-full bg-sky-500/15 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-sky-400 ring-1 ring-sky-500/25 sm:inline">
            Context active
          </span>
        </div>
        <button
          onClick={clearContext}
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-slate-500',
            'hover:bg-white/5 hover:text-slate-300',
          )}
        >
          <X size={12} /> Exit context
        </button>
      </div>
    </div>
  );
}
