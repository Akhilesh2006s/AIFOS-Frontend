import { useCallback, useEffect, useState } from 'react';
import { moduleApi } from '@/api/client';
import { isToday } from '@/lib/dateHelpers';
import type {
  DashboardActivity,
  DashboardAlert,
  DashboardKpi,
  DashboardQuickAction,
  DashboardWorkItem,
} from '@/components/dashboards/types';
import type { EChartsOption } from 'echarts';
import { Package, PackageMinus, PackagePlus, Scan } from 'lucide-react';

interface StoreKeeperDashboardData {
  kpis: DashboardKpi[];
  todaysWork: DashboardWorkItem[];
  alerts: DashboardAlert[];
  quickActions: DashboardQuickAction[];
  recentActivity: DashboardActivity[];
  chartOptions: EChartsOption[];
  table: { headers: string[]; rows: string[][] };
}

export function useStoreKeeperDashboard() {
  const [data, setData] = useState<StoreKeeperDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, issuesRes, entriesRes, consStats] = await Promise.all([
        moduleApi.supplyChain.dashboard(),
        moduleApi.inventory.issues(),
        moduleApi.consumption.entries(),
        moduleApi.consumption.stats(),
      ]);

      const issues = issuesRes.data ?? [];
      const entries = entriesRes.data ?? [];

      const pendingApproval = issues.filter((i: { status?: string }) => i.status === 'pending_approval');
      const pending = issues.filter((i: { status?: string }) => ['pending', 'pending_approval'].includes(i.status ?? ''));
      const ready = issues.filter((i: { status?: string }) => i.status === 'approved');
      const issuedToday = issues.filter(
        (i: { status?: string; issuedAt?: string; createdAt?: string }) =>
          i.status === 'issued' && isToday(i.issuedAt || i.createdAt),
      );
      const consumptionToday = entries.filter((e: { entryDate?: string; createdAt?: string }) =>
        isToday(e.entryDate || e.createdAt),
      );

      const kpis: DashboardKpi[] = [
        { label: "Today's Requests", value: pending.length, color: '#EAB308' },
        { label: 'Pending Approvals', value: pendingApproval.length, color: '#F97316' },
        { label: 'Material Ready', value: ready.length, color: '#22C55E' },
        { label: 'Issued Today', value: issuedToday.length, color: '#3B82F6' },
        { label: 'Returns', value: 0, color: '#A855F7', sublabel: 'Phase 2' },
        { label: 'Consumption Today', value: consumptionToday.length, color: '#06B6D4' },
      ];

      const todaysWork: DashboardWorkItem[] = pending.slice(0, 6).map((i: { _id: string; issueNumber?: string; status?: string; projectId?: string }) => ({
        id: i._id,
        label: `Issue ${i.issueNumber}`,
        detail: i.projectId ? `Project ${i.projectId}` : undefined,
        status: i.status,
        href: '/inventory?tab=issues',
      }));

      const alerts: DashboardAlert[] = [];
      if (pendingApproval.length > 0) {
        alerts.push({
          id: 'approvals',
          severity: 'warning',
          title: `${pendingApproval.length} issues awaiting approval`,
          href: '/inventory?tab=issues',
        });
      }
      if (ready.length > 0) {
        alerts.push({
          id: 'ready',
          severity: 'info',
          title: `${ready.length} issues ready to dispatch`,
          href: '/inventory?tab=issues',
        });
      }

      const quickActions: DashboardQuickAction[] = [
        { label: 'Issue Material', href: '/inventory?tab=issues', icon: PackageMinus },
        { label: 'Return Material', href: '/consumption', icon: PackagePlus },
        { label: 'Scan Material', href: '/inventory', icon: Scan, desc: 'Lookup by code' },
        { label: 'View Stock', href: '/inventory', icon: Package },
      ];

      const scActivity = (dash.data?.recentActivity ?? []) as Array<{ type: string; label: string; status: string; at?: string; id?: string }>;
      const recentActivity: DashboardActivity[] = scActivity
        .filter((a) => ['issue', 'consumption', 'grn'].includes(a.type))
        .slice(0, 10)
        .map((a, i) => ({ id: a.id ?? `${a.type}-${i}`, type: a.type, label: a.label, status: a.status, at: a.at }));

      const statusCounts = issues.reduce((acc: Record<string, number>, i: { status?: string }) => {
        const s = i.status ?? 'unknown';
        acc[s] = (acc[s] ?? 0) + 1;
        return acc;
      }, {});

      const chartOptions: EChartsOption[] = [
        {
          title: { text: 'Issue Queue by Status', textStyle: { color: '#94a3b8', fontSize: 12 } },
          tooltip: { trigger: 'item' },
          series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            data: Object.entries(statusCounts).map(([name, value]) => ({ name, value: Number(value) })),
            label: { color: '#94a3b8' },
          }],
        },
        {
          title: { text: 'Site Stores', textStyle: { color: '#94a3b8', fontSize: 12 } },
          xAxis: { type: 'category', data: ['Stores', 'Entries', 'Wastage'], axisLabel: { color: '#64748b' } },
          yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#1e293b' } } },
          series: [{
            type: 'bar',
            data: [consStats.data?.siteStores ?? 0, consStats.data?.consumptionEntries ?? 0, consStats.data?.totalWastage ?? 0],
            itemStyle: { color: '#22C55E' },
          }],
          grid: { left: 40, right: 20, bottom: 30, top: 40 },
        },
      ];

      const tableRows = issues.slice(0, 12).map((i: { issueNumber?: string; status?: string; projectId?: string; createdAt?: string }) => [
        i.issueNumber ?? '—',
        i.projectId ?? '—',
        i.status ?? '—',
        i.createdAt ? new Date(i.createdAt).toLocaleDateString('en-IN') : '—',
      ]);

      setData({
        kpis,
        todaysWork,
        alerts,
        quickActions,
        recentActivity,
        chartOptions,
        table: { headers: ['Issue #', 'Project', 'Status', 'Created'], rows: tableRows },
      });
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, refresh: load };
}
