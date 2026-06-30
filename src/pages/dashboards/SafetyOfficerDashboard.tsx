import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { useSafetyDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function SafetyOfficerDashboard() {
  const { data, loading, error, refresh } = useSafetyDashboard();
  return <RoleDashboardView roleKey="safety_officer" data={data} loading={loading} error={error} onRetry={refresh} />;
}
