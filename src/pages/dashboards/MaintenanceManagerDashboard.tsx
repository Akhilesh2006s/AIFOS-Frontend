import { RoleDashboardShell } from '@/components/dashboards/RoleDashboardShell';
import { ROLE_DASHBOARD_META } from '@/config/roleDashboardRegistry';
import { useMaintenanceDashboard } from '@/hooks/role-dashboards/useMaintenanceDashboard';

const meta = ROLE_DASHBOARD_META.maintenance_manager;

export function MaintenanceManagerDashboard() {
  const { data, loading } = useMaintenanceDashboard();

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
      kpis={data?.kpis ?? []}
      todaysWork={data?.todaysWork ?? []}
      alerts={data?.alerts ?? []}
      quickActions={data?.quickActions ?? []}
      recentActivity={data?.recentActivity ?? []}
      headerLink={meta.headerLink}
      table={
        data?.table
          ? { title: 'Open Work Orders', headers: data.table.headers, rows: data.table.rows, emptyMessage: 'No open work orders' }
          : undefined
      }
    />
  );
}
