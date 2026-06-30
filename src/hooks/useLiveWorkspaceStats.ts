import { useCallback, useEffect, useState } from 'react';

import { missionControlApi } from '@/api/client';
import { getApiErrorMessage } from '@/lib/apiHelpers';
import { buildOverviewFallback } from '@/lib/overviewFallback';

import type { WorkspaceId } from '@/config/workspaces';

export interface WorkspaceSnapshot {
  id: WorkspaceId;
  label: string;
  primary: string | number;
  secondary: string;
}

const DEFAULT_SNAPSHOTS: WorkspaceSnapshot[] = [
  { id: 'projects', label: 'Projects', primary: '—', secondary: 'Active' },
  { id: 'assets', label: 'Assets', primary: '—', secondary: 'Running' },
  { id: 'supply_chain', label: 'Supply Chain', primary: '—', secondary: 'Pending PR' },
  { id: 'business', label: 'Budget', primary: '—', secondary: 'Utilization' },
  { id: 'insights', label: 'Insights', primary: 'Live', secondary: 'KPIs' },
];

export function useLiveWorkspaceStats(refreshMs = 30_000) {
  const [snapshots, setSnapshots] = useState<WorkspaceSnapshot[]>(DEFAULT_SNAPSHOTS);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await missionControlApi.overview();
      const s = res.data?.executiveSummary;
      if (!s) throw new Error('Overview missing executive summary');
      setSnapshots([
        {
          id: 'projects',
          label: 'Projects',
          primary: s.activeProjects,
          secondary: s.delayedProjects > 0 ? `${s.delayedProjects} delayed` : 'On track',
        },
        {
          id: 'assets',
          label: 'Assets',
          primary: s.activeEquipment,
          secondary: `${s.equipmentUnderMaintenance} maintenance`,
        },
        {
          id: 'supply_chain',
          label: 'Supply Chain',
          primary: s.pendingPurchaseRequisitions,
          secondary: `${s.pendingPurchaseOrders} pending PO`,
        },
        {
          id: 'business',
          label: 'Budget',
          primary: `${s.budgetUtilization}%`,
          secondary: 'Utilization',
        },
        {
          id: 'insights',
          label: 'Alerts',
          primary: res.data?.alerts?.length ?? 0,
          secondary: 'Active',
        },
      ]);
    } catch (err) {
      const partial = await buildOverviewFallback();
      const s = partial.executiveSummary;
      if (s) {
        setSnapshots([
          {
            id: 'projects',
            label: 'Projects',
            primary: s.activeProjects,
            secondary: s.delayedProjects > 0 ? `${s.delayedProjects} delayed` : 'On track',
          },
          {
            id: 'assets',
            label: 'Assets',
            primary: s.activeEquipment,
            secondary: `${s.equipmentUnderMaintenance} maintenance`,
          },
          {
            id: 'supply_chain',
            label: 'Supply Chain',
            primary: s.pendingPurchaseRequisitions,
            secondary: `${s.pendingPurchaseOrders} pending PO`,
          },
          {
            id: 'business',
            label: 'Budget',
            primary: `${s.budgetUtilization}%`,
            secondary: 'Utilization',
          },
          {
            id: 'insights',
            label: 'Alerts',
            primary: partial.alerts?.length ?? 0,
            secondary: 'Active',
          },
        ]);
        setError(getApiErrorMessage(err, 'Overview unavailable — partial stats shown'));
      } else {
        setError(getApiErrorMessage(err, 'Workspace stats unavailable'));
      }
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, refreshMs);
    return () => clearInterval(t);
  }, [load, refreshMs]);

  return { snapshots, error, refresh: load };
}
