import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { useOrgAdminDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function OrgAdminDashboard() {
  const { data, loading } = useOrgAdminDashboard();
  return <RoleDashboardView roleKey="org_admin" data={data} loading={loading} />;
}
