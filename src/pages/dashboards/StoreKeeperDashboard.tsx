import { RoleDashboardShell } from '@/components/dashboards/RoleDashboardShell';
import { ROLE_DASHBOARD_META } from '@/config/roleDashboardRegistry';
import { useStoreKeeperDashboard } from '@/hooks/role-dashboards/useStoreKeeperDashboard';

const meta = ROLE_DASHBOARD_META.store_keeper;

export function StoreKeeperDashboard() {
  const { data, loading } = useStoreKeeperDashboard();

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
      loading={loading}
      kpis={data?.kpis ?? []}
      todaysWork={data?.todaysWork ?? []}
      alerts={data?.alerts ?? []}
      quickActions={data?.quickActions ?? []}
      recentActivity={data?.recentActivity ?? []}
      headerLink={meta.headerLink}
      table={
        data?.table
          ? { title: 'Material Issues', headers: data.table.headers, rows: data.table.rows, emptyMessage: 'No pending issues' }
          : undefined
      }
    />
  );
}
