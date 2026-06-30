import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterChipItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface FilterChipBarProps {
  items: readonly FilterChipItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  'aria-label'?: string;
}

export function FilterChipBar({
  items,
  active,
  onChange,
  className,
  'aria-label': ariaLabel = 'Sub-sections',
}: FilterChipBarProps) {
  return (
    <div className={cn('mb-4 flex flex-wrap gap-2', className)} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={active === item.id}
          onClick={() => onChange(item.id)}
          className={cn('filter-chip', active === item.id && 'filter-chip-active')}
        >
          {item.icon && <item.icon size={14} aria-hidden />}
          {item.label}
        </button>
      ))}
    </div>
  );
}
