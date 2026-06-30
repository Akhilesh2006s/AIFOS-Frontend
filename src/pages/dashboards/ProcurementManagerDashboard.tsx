import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { useProcurementDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function ProcurementManagerDashboard() {
  const { data, loading, error, refresh } = useProcurementDashboard();
  return <RoleDashboardView roleKey="procurement_manager" data={data} loading={loading} error={error} onRetry={refresh} />;
}
