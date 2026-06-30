import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { useProjectManagerDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function ProjectManagerDashboard() {
  const { data, loading, error, refresh } = useProjectManagerDashboard();
  return <RoleDashboardView roleKey="project_manager" data={data} loading={loading} error={error} onRetry={refresh} />;
}
