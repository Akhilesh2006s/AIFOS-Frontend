import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { explorerPath } from '@/lib/explorerLinks';
import type { ExplorerBreadcrumb } from '@/types/explorer';

interface ExplorerBreadcrumbTrailProps {
  crumbs: ExplorerBreadcrumb[];
}

export function ExplorerBreadcrumbTrail({ crumbs }: ExplorerBreadcrumbTrailProps) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
      {crumbs.map((c, i) => (
        <span key={`${c.label}-${i}`} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} className="text-slate-600" />}
          {c.entityType && c.entityId ? (
            <Link to={explorerPath(c.entityType, c.entityId)} className="hover:text-violet-300">
              {c.label}
            </Link>
          ) : (
            <span className={i === crumbs.length - 1 ? 'text-slate-300' : undefined}>{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
