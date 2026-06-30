import { useCallback, useEffect, useState } from 'react';
import { moduleApi } from '@/api/client';
import { getApiErrorMessage } from '@/lib/apiHelpers';

export interface CloudStats {
  projects?: { totalProjects?: number; active?: number; avgProgress?: number; totalBudget?: number };
  procurement?: { pendingPRs?: number; activePos?: number; openRfqs?: number };
  inventory?: { totalMaterials?: number; warehouses?: number; lowStockAlerts?: number };
  equipment?: { total?: number; active?: number; inMaintenance?: number; avgUtilization?: number };
  fleet?: { totalVehicles?: number; onTrip?: number };
  maintenance?: { open?: number; inProgress?: number };
  consumption?: { siteStores?: number };
  vendors?: { total?: number; approved?: number };
}

export function useCloudStats() {
  const [stats, setStats] = useState<CloudStats>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const results = await Promise.allSettled([
      moduleApi.projects.stats(),
      moduleApi.procurement.stats(),
      moduleApi.inventory.stats(),
      moduleApi.equipment.stats(),
      moduleApi.fleet.stats(),
      moduleApi.maintenance.stats(),
      moduleApi.consumption.stats(),
      moduleApi.vendors.stats(),
    ]);

    const [p, pr, inv, eq, fl, mt, cons, vnd] = results;
    const failed = results.filter((r) => r.status === 'rejected').length;

    setStats({
      projects: p.status === 'fulfilled' ? p.value.data : undefined,
      procurement: pr.status === 'fulfilled' ? pr.value.data : undefined,
      inventory: inv.status === 'fulfilled' ? inv.value.data : undefined,
      equipment: eq.status === 'fulfilled' ? eq.value.data : undefined,
      fleet: fl.status === 'fulfilled' ? fl.value.data : undefined,
      maintenance: mt.status === 'fulfilled' ? mt.value.data : undefined,
      consumption: cons.status === 'fulfilled' ? cons.value.data : undefined,
      vendors: vnd.status === 'fulfilled' ? vnd.value.data : undefined,
    });

    if (failed === results.length) {
      const firstErr = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
      setError(getApiErrorMessage(firstErr?.reason, 'Workspace stats unavailable'));
    } else if (failed > 0) {
      setError(`${failed} stat source(s) unavailable — showing partial data`);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, error, refresh: load };
}

export function getWorkspaceStatLines(id: string, stats: CloudStats): string[] {
  switch (id) {
    case 'projects':
      return [
        `${stats.projects?.active ?? 0} Active Projects`,
        `${stats.projects?.avgProgress ?? 0}% Progress`,
      ];
    case 'supply_chain':
      return [
        `${stats.procurement?.pendingPRs ?? 0} Pending PR`,
        `${stats.inventory?.totalMaterials ?? 0} Materials`,
      ];
    case 'assets':
      return [
        `${stats.equipment?.active ?? 0} Running`,
        `${stats.equipment?.inMaintenance ?? 0} Maintenance`,
      ];
    case 'business':
      return ['Compliance', 'Finance'];
    case 'insights':
      return ['Reports', 'KPIs'];
    default:
      return [];
  }
}

export function getWorkspaceProgress(id: string, stats: CloudStats): number {
  switch (id) {
    case 'projects':
      return stats.projects?.avgProgress ?? 0;
    case 'supply_chain': {
      const pending = stats.procurement?.pendingPRs ?? 0;
      const materials = stats.inventory?.totalMaterials ?? 0;
      return Math.min(100, 30 + materials * 5 + pending * 4);
    }
    case 'assets':
      return stats.equipment?.avgUtilization ?? 0;
    case 'insights':
      return 72;
    case 'business':
      return 55;
    default:
      return 0;
  }
}
