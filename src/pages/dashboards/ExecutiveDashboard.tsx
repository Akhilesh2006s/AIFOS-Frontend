import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { useExecutiveDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function ExecutiveDashboard() {
  const { data, loading, error, refresh } = useExecutiveDashboard();
  return <RoleDashboardView roleKey="executive" data={data} loading={loading} error={error} onRetry={refresh} />;
}
