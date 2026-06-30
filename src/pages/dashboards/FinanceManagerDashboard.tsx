import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { useFinanceDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function FinanceManagerDashboard() {
  const { data, loading } = useFinanceDashboard();
  return <RoleDashboardView roleKey="finance_manager" data={data} loading={loading} />;
}
