import { useCallback, useEffect, useState } from 'react';
import type { RoleDashboardPayload } from './dashboardLoaders';
import { getApiErrorMessage } from '@/lib/apiHelpers';
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

const emptyPayload: RoleDashboardPayload = {
  kpis: [],
  todaysWork: [],
  alerts: [],
  quickActions: [],
  recentActivity: [],
  chartOptions: [],
};

function useDashboardLoader(loader: () => Promise<RoleDashboardPayload>) {
  const [data, setData] = useState<RoleDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await loader());
    } catch (e) {
      setData(emptyPayload);
      setError(getApiErrorMessage(e, 'Failed to load dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
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
