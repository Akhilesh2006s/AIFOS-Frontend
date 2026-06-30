import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { useCooDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function CooDashboard() {
  const { data, loading } = useCooDashboard();
  return <RoleDashboardView roleKey="coo" data={data} loading={loading} />;
}
