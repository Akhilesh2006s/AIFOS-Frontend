import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { workspaceFromPath, getWorkspace } from '@/config/workspaces';

interface Crumb {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  trail?: Crumb[];
}

export function Breadcrumbs({ trail = [] }: BreadcrumbsProps) {
  const location = useLocation();
  const ws = getWorkspace(workspaceFromPath(location.pathname));

  const crumbs: Crumb[] = [
    { label: 'Mission Control', path: '/mission-control' },
    ...(location.pathname !== '/' ? [{ label: ws.label, path: ws.defaultPath }] : []),
    ...trail,
  ];

  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs text-slate-500" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((crumb, i) => (
          <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-slate-600" aria-hidden />}
            {crumb.path && i < crumbs.length - 1 ? (
              <Link to={crumb.path} className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:text-accent focus-visible:text-accent">
                {i === 0 && <Home size={12} aria-hidden />}
                {crumb.label}
              </Link>
            ) : (
              <span
                className={i === crumbs.length - 1 ? 'font-medium text-slate-300' : ''}
                aria-current={i === crumbs.length - 1 ? 'page' : undefined}
              >
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
