import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { useProjectManagerDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function ProjectManagerDashboard() {
  const { data, loading } = useProjectManagerDashboard();
  return <RoleDashboardView roleKey="project_manager" data={data} loading={loading} />;
}
