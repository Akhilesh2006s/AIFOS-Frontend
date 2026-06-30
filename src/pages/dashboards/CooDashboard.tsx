import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { useCooDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function CooDashboard() {
  const { data, loading, error, refresh } = useCooDashboard();
  return <RoleDashboardView roleKey="coo" data={data} loading={loading} error={error} onRetry={refresh} />;
}
