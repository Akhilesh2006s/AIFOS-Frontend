import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { useQualityDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function QualityEngineerDashboard() {
  const { data, loading, error, refresh } = useQualityDashboard();
  return <RoleDashboardView roleKey="quality_engineer" data={data} loading={loading} error={error} onRetry={refresh} />;
}
