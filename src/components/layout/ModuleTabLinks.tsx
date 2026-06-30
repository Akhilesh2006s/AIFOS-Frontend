import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface ModuleTabLinkItem {
  id: string;
  label: string;
  href: string;
}

interface ModuleTabLinksProps {
  tabs: readonly ModuleTabLinkItem[];
  active: string;
  className?: string;
  'aria-label'?: string;
}

export function ModuleTabLinks({ tabs, active, className, 'aria-label': ariaLabel = 'Sections' }: ModuleTabLinksProps) {
  return (
    <div
      className={cn('mb-4 flex gap-0.5 overflow-x-auto border-b pb-px scrollbar-thin', className)}
      style={{ borderColor: 'var(--command-border)' }}
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <Link
            key={t.id}
            to={t.href}
            role="tab"
            aria-selected={isActive}
            className={cn('module-tab', isActive && 'module-tab-active')}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
