import { useEffect, useState } from 'react';

import { missionControlApi } from '@/api/client';

import type { WorkspaceId } from '@/config/workspaces';



export interface WorkspaceSnapshot {

  id: WorkspaceId;

  label: string;

  primary: string | number;

  secondary: string;

}



export function useLiveWorkspaceStats(refreshMs = 30_000) {

  const [snapshots, setSnapshots] = useState<WorkspaceSnapshot[]>([

    { id: 'projects', label: 'Projects', primary: '—', secondary: 'Active' },

    { id: 'assets', label: 'Assets', primary: '—', secondary: 'Running' },

    { id: 'supply_chain', label: 'Supply Chain', primary: '—', secondary: 'Pending PR' },

    { id: 'business', label: 'Budget', primary: '—', secondary: 'Utilization' },

    { id: 'insights', label: 'Insights', primary: 'Live', secondary: 'KPIs' },

  ]);



  const load = () => {

    missionControlApi

      .overview()

      .then((res) => {

        const s = res.data.executiveSummary;

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

            primary: res.data.alerts.length,

            secondary: 'Active',

          },

        ]);

      })

      .catch(() => {});

  };



  useEffect(() => {

    load();

    const t = setInterval(load, refreshMs);

    return () => clearInterval(t);

  }, [refreshMs]);



  return { snapshots, refresh: load };

}

