import { RoleDashboardView } from '@/components/dashboards/RoleDashboardView';
import { useEquipmentDashboard } from '@/hooks/role-dashboards/useEnterpriseRoleDashboards';

export function EquipmentManagerDashboard() {
  const { data, loading, error, refresh } = useEquipmentDashboard();
  return <RoleDashboardView roleKey="equipment_manager" data={data} loading={loading} error={error} onRetry={refresh} />;
}
