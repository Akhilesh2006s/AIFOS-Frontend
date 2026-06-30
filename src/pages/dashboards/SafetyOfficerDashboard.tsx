import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { useSafetyDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function SafetyOfficerDashboard() {
  const { data, loading } = useSafetyDashboard();
  return <RoleDashboardView roleKey="safety_officer" data={data} loading={loading} />;
}
