import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { usePlatformAdminDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function PlatformAdminDashboard() {
  const { data, loading, error, refresh } = usePlatformAdminDashboard();
  return <RoleDashboardView roleKey="admin" data={data} loading={loading} error={error} onRetry={refresh} />;
}
