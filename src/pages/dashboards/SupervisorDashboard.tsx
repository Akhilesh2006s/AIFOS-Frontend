import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { useSupervisorDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function SupervisorDashboard() {
  const { data, loading, error, refresh } = useSupervisorDashboard();
  return <RoleDashboardView roleKey="supervisor" data={data} loading={loading} error={error} onRetry={refresh} />;
}
