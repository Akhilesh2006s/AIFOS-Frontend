import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { useContractorSupervisorDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function ContractorSupervisorDashboard() {
  const { data, loading, error, refresh } = useContractorSupervisorDashboard();
  return <RoleDashboardView roleKey="contractor_supervisor" data={data} loading={loading} error={error} onRetry={refresh} />;
}
