import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { useSupervisorDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function SupervisorDashboard() {
  const { data, loading } = useSupervisorDashboard();
  return <RoleDashboardView roleKey="supervisor" data={data} loading={loading} />;
}
