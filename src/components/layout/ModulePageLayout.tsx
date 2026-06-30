import type { ReactNode } from 'react';
import { PageLoader } from '@/components/layout/PageShell';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { RichKpiCard } from '@/components/command/RichKpiCard';
import { getWorkspace, workspaceFromPath } from '@/config/workspaces';
import { useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export interface ModuleStat {
  label: string;
  value: string | number;
  sublabel?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  color?: string;
  progress?: number;
  accent?: string;
  iconColor?: string;
  iconBg?: string;
}

interface ModulePageLayoutProps {
  title: string;
  subtitle: string;
  loading?: boolean;
  stats?: ModuleStat[];
  heroActions?: ReactNode;
  breadcrumbs?: Array<{ label: string; path?: string }>;
  tabs?: ReactNode;
  children: ReactNode;
  hideWorkspace?: boolean;
}

export function ModulePageLayout({
  title,
  subtitle,
  loading,
  stats,
  heroActions,
  breadcrumbs,
  tabs,
  children,
  hideWorkspace,
}: ModulePageLayoutProps) {
  const location = useLocation();
  const ws = getWorkspace(workspaceFromPath(location.pathname));

  if (loading) return <PageLoader message={`Loading ${title}…`} />;

  return (
    <div className="page-enter mx-auto max-w-[1600px] space-y-6">
      <Breadcrumbs trail={breadcrumbs ?? [{ label: title }]} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {!hideWorkspace && (
            <p className="text-overline mb-2">
              <span style={{ color: ws.color }}>{ws.label}</span>
              <span className="text-slate-600"> · Workspace</span>
            </p>
          )}
          <h1 className="text-heading-page">{title}</h1>
          <p className="mt-2 max-w-2xl text-body">{subtitle}</p>
        </div>
        {heroActions && <div className="flex shrink-0 flex-wrap gap-2">{heroActions}</div>}
      </header>

      {tabs}

      {stats && stats.length > 0 && (
        <section aria-label="Key metrics">
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {stats.map((stat, i) => (
              <RichKpiCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                sublabel={stat.sublabel}
                change={stat.change || '—'}
                trend={stat.trend || 'neutral'}
                icon={stat.icon}
                color={stat.color || ws.color}
                progress={stat.progress}
                delay={i}
              />
            ))}
          </div>
        </section>
      )}

      <div className="space-y-6">{children}</div>
    </div>
  );
}
