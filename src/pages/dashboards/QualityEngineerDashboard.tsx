import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { useQualityDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function QualityEngineerDashboard() {
  const { data, loading } = useQualityDashboard();
  return <RoleDashboardView roleKey="quality_engineer" data={data} loading={loading} />;
}
