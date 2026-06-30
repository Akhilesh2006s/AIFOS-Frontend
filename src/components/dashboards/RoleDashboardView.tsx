import { CommandChartCard } from '@/components/command/CommandChartCard';
import { RoleDashboardShell } from '@/components/dashboards/RoleDashboardShell';
import { ROLE_DASHBOARD_META } from '@/config/roleDashboardRegistry';
import type { RoleDashboardPayload } from '@/hooks/role-dashboards/dashboardLoaders';

interface RoleDashboardViewProps {
  roleKey: keyof typeof ROLE_DASHBOARD_META;
  data: RoleDashboardPayload | null;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

/** Renders a role dashboard from registry metadata + loaded data */
export function RoleDashboardView({ roleKey, data, loading, error, onRetry }: RoleDashboardViewProps) {
  const meta = ROLE_DASHBOARD_META[roleKey];

  return (
    <RoleDashboardShell
      title={meta.title}
      subtitle={meta.subtitle}
      workspaceLabel={meta.workspaceLabel}
      workspaceColor={meta.workspaceColor}
      theme={meta.theme}
      workSectionTitle={meta.workSectionTitle}
      showRecentActivity={meta.showRecentActivity}
      largeActions={meta.largeActions}
      headerLink={meta.headerLink}
      loading={loading}
      error={error}
      onRetry={onRetry}
      kpis={data?.kpis ?? []}
      todaysWork={data?.todaysWork ?? []}
      decisions={data?.decisions}
      alerts={data?.alerts ?? []}
      quickActions={data?.quickActions ?? []}
      recentActivity={data?.recentActivity ?? []}
      headerBadge={data?.headerBadge}
      companyName={data?.companyName}
      charts={
        meta.showCharts && data?.chartOptions?.length
          ? data.chartOptions.map((option, i) => (
              <CommandChartCard key={i} title="" option={option} delay={i} />
            ))
          : undefined
      }
      table={
        data?.table
          ? {
              title: 'Details',
              headers: data.table.headers,
              rows: data.table.rows,
              emptyMessage: 'No records',
            }
          : undefined
      }
    />
  );
}
