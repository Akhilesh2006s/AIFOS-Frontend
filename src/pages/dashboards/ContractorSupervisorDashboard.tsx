import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { useContractorSupervisorDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function ContractorSupervisorDashboard() {
  const { data, loading } = useContractorSupervisorDashboard();
  return <RoleDashboardView roleKey="contractor_supervisor" data={data} loading={loading} />;
}
