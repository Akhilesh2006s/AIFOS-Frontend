import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { usePlatformAdminDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function PlatformAdminDashboard() {
  const { data, loading } = usePlatformAdminDashboard();
  return <RoleDashboardView roleKey="admin" data={data} loading={loading} />;
}
