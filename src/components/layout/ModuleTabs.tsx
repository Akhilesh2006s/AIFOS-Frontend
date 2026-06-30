import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
}

interface ModuleTabsProps {
  tabs: readonly Tab[];
  active: string;
  onChange: (id: string) => void;
  accent?: string;
}

export function ModuleTabs({ tabs, active, onChange }: ModuleTabsProps) {
  return (
    <div
      className="flex gap-0.5 overflow-x-auto border-b pb-px scrollbar-thin"
      style={{ borderColor: 'var(--command-border)' }}
      role="tablist"
      aria-label="Module sections"
    >
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${t.id}`}
            id={`tab-${t.id}`}
            onClick={() => onChange(t.id)}
            className={cn('module-tab', isActive && 'module-tab-active')}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
