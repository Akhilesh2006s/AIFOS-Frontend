import { useCallback, useEffect, useState } from 'react';
import type { RoleDashboardPayload } from './dashboardLoaders';
import {
  loadContractorSupervisorDashboard,
  loadCooDashboard,
  loadEquipmentDashboard,
  loadExecutiveDashboard,
  loadFinanceDashboard,
  loadHrDashboard,
  loadOrgAdminDashboard,
  loadPlatformAdminDashboard,
  loadProcurementDashboard,
  loadProjectManagerDashboard,
  loadQualityDashboard,
  loadSafetyDashboard,
  loadSupervisorDashboard,
} from './dashboardLoaders';

function useDashboardLoader(loader: () => Promise<RoleDashboardPayload>) {
  const [data, setData] = useState<RoleDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loader());
    } catch (e) {
      console.error(e);
      setData({
        kpis: [],
        todaysWork: [],
        alerts: [],
        quickActions: [],
        recentActivity: [],
        chartOptions: [],
      });
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, refresh: load };
}

export const useExecutiveDashboard = () => useDashboardLoader(loadExecutiveDashboard);
export const useCooDashboard = () => useDashboardLoader(loadCooDashboard);
export const useProjectManagerDashboard = () => useDashboardLoader(loadProjectManagerDashboard);
export const useProcurementDashboard = () => useDashboardLoader(loadProcurementDashboard);
export const useEquipmentDashboard = () => useDashboardLoader(loadEquipmentDashboard);
export const useFinanceDashboard = () => useDashboardLoader(loadFinanceDashboard);
export const useSafetyDashboard = () => useDashboardLoader(loadSafetyDashboard);
export const useQualityDashboard = () => useDashboardLoader(loadQualityDashboard);
export const useHrDashboard = () => useDashboardLoader(loadHrDashboard);
export const useSupervisorDashboard = () => useDashboardLoader(loadSupervisorDashboard);
export const useContractorSupervisorDashboard = () => useDashboardLoader(loadContractorSupervisorDashboard);
export const useOrgAdminDashboard = () => useDashboardLoader(loadOrgAdminDashboard);
export const usePlatformAdminDashboard = () => useDashboardLoader(loadPlatformAdminDashboard);
