import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { useHrDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function HrManagerDashboard() {
  const { data, loading } = useHrDashboard();
  return <RoleDashboardView roleKey="hr_manager" data={data} loading={loading} />;
}
