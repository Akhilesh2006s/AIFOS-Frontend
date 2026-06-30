import { CommandChartCard } from '@/components/command/CommandChartCard';
import { RoleDashboardShell } from '@/components/dashboards/RoleDashboardShell';
import { ROLE_DASHBOARD_META } from '@/config/roleDashboardRegistry';
import { useWarehouseDashboard } from '@/hooks/role-dashboards/useWarehouseDashboard';

const meta = ROLE_DASHBOARD_META.warehouse_manager;

export function WarehouseManagerDashboard() {
  const { data, loading, error, refresh } = useWarehouseDashboard();

  return (
    <RoleDashboardShell
      title={meta.title}
      subtitle={meta.subtitle}
      workspaceLabel={meta.workspaceLabel}
      workspaceColor={meta.workspaceColor}
      theme={meta.theme}
      workSectionTitle={meta.workSectionTitle}
      showRecentActivity={meta.showRecentActivity}
      loading={loading}
      error={error}
      onRetry={refresh}
      kpis={data?.kpis ?? []}
      todaysWork={data?.todaysWork ?? []}
      alerts={data?.alerts ?? []}
      quickActions={data?.quickActions ?? []}
      recentActivity={data?.recentActivity ?? []}
      headerLink={meta.headerLink}
      charts={
        meta.showCharts && data?.chartOptions?.length
          ? data.chartOptions.map((option, i) => (
              <CommandChartCard key={i} title="" option={option} delay={i} />
            ))
          : undefined
      }
      table={
        data?.table
          ? { title: 'Stock Registry', headers: data.table.headers, rows: data.table.rows, emptyMessage: 'No materials registered' }
          : undefined
      }
    />
  );
}
