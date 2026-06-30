import { useCallback, useEffect, useState } from 'react';
import { moduleApi } from '@/api/client';
import { getApiErrorMessage } from '@/lib/apiHelpers';
import { isToday } from '@/lib/dateHelpers';
import { formatCurrency } from '@/lib/utils';
import type {
  DashboardActivity,
  DashboardAlert,
  DashboardKpi,
  DashboardQuickAction,
  DashboardWorkItem,
} from '@/components/dashboards/types';
import type { EChartsOption } from 'echarts';
import {
  ArrowLeftRight,
  ClipboardCheck,
  Package,
  PackageMinus,
  PackagePlus,
} from 'lucide-react';

interface WarehouseDashboardData {
  kpis: DashboardKpi[];
  todaysWork: DashboardWorkItem[];
  alerts: DashboardAlert[];
  quickActions: DashboardQuickAction[];
  recentActivity: DashboardActivity[];
  chartOptions: EChartsOption[];
  table: { headers: string[]; rows: string[][] };
}

export function useWarehouseDashboard() {
  const [data, setData] = useState<WarehouseDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, invStats, grnsRes, issuesRes, materialsRes, movementsRes] = await Promise.all([
        moduleApi.supplyChain.dashboard(),
        moduleApi.inventory.stats(),
        moduleApi.inventory.grns(),
        moduleApi.inventory.issues(),
        moduleApi.inventory.materials(),
        moduleApi.inventory.movements(),
      ]);

      const kpisData = dash.data?.kpis ?? {};
      const grns = grnsRes.data ?? [];
      const issues = issuesRes.data ?? [];
      const materials = materialsRes.data ?? [];
      const movements = movementsRes.data ?? [];

      const todayGrns = grns.filter((g: { receivedAt?: string }) => isToday(g.receivedAt));
      const todayIssues = issues.filter((i: { issuedAt?: string; createdAt?: string }) =>
        isToday(i.issuedAt || i.createdAt),
      );
      const pendingIssues = issues.filter((i: { status?: string }) =>
        ['pending', 'pending_approval'].includes(i.status ?? ''),
      );
      const lowStock = kpisData.lowStock ?? invStats.data?.lowStockAlerts ?? 0;

      const stockByType = movements.reduce(
        (acc: Record<string, number>, m: { type?: string; quantity?: number }) => {
          const t = m.type ?? 'other';
          acc[t] = (acc[t] ?? 0) + (m.quantity ?? 0);
          return acc;
        },
        {},
      );

      const kpis: DashboardKpi[] = [
        { label: 'Available Stock', value: invStats.data?.totalMaterials ?? 0, color: '#22C55E' },
        { label: 'Reserved Stock', value: pendingIssues.length, color: '#A855F7', sublabel: 'Pending issues' },
        { label: "Today's GRN", value: todayGrns.length || kpisData.todayGrn || 0, color: '#3B82F6' },
        { label: "Today's Issues", value: todayIssues.length, color: '#F97316' },
        { label: 'Low Stock', value: lowStock, color: '#EF4444' },
        { label: 'Inbound Value', value: formatCurrency(kpisData.procurementSpend ?? 0), color: '#EAB308' },
      ];

      const todaysWork: DashboardWorkItem[] = [
        ...todayGrns.slice(0, 3).map((g: { _id: string; grnNumber?: string; status?: string }) => ({
          id: g._id,
          label: `Receive GRN ${g.grnNumber}`,
          status: g.status,
          href: '/inventory?tab=grn',
        })),
        ...pendingIssues.slice(0, 3).map((i: { _id: string; issueNumber?: string; status?: string }) => ({
          id: i._id,
          label: `Issue ${i.issueNumber}`,
          status: i.status,
          href: '/inventory?tab=issues',
        })),
      ];

      const alerts: DashboardAlert[] = [];
      if (lowStock > 0) {
        alerts.push({
          id: 'low-stock',
          severity: 'warning',
          title: `${lowStock} materials below reorder level`,
          message: 'Review stock levels and raise PRs',
          href: '/inventory',
        });
      }
      if (pendingIssues.length > 0) {
        alerts.push({
          id: 'pending-issues',
          severity: 'info',
          title: `${pendingIssues.length} material issues pending`,
          href: '/inventory?tab=issues',
        });
      }

      const quickActions: DashboardQuickAction[] = [
        { label: 'Receive GRN', href: '/inventory?tab=grn', icon: PackagePlus, desc: 'Accept delivery' },
        { label: 'Transfer Stock', href: '/inventory?tab=warehouses', icon: ArrowLeftRight, desc: 'Move between warehouses' },
        { label: 'Issue Material', href: '/inventory?tab=issues', icon: PackageMinus, desc: 'Issue to site' },
        { label: 'Return Material', href: '/consumption', icon: Package, desc: 'Site returns' },
        { label: 'Inventory Audit', href: '/inventory?tab=ledger', icon: ClipboardCheck, desc: 'Stock ledger' },
      ];

      const scActivity = (dash.data?.recentActivity ?? []) as Array<{
        type: string;
        label: string;
        status: string;
        at?: string;
        id?: string;
      }>;
      const recentActivity: DashboardActivity[] = scActivity
        .filter((a) => ['grn', 'issue'].includes(a.type))
        .slice(0, 10)
        .map((a, i) => ({
          id: a.id ?? `${a.type}-${i}`,
          type: a.type,
          label: a.label,
          status: a.status,
          at: a.at,
        }));

      const chartOptions: EChartsOption[] = [
        {
          title: { text: 'Stock Movements by Type', textStyle: { color: '#94a3b8', fontSize: 12 } },
          tooltip: { trigger: 'item' },
          series: [
            {
              type: 'pie',
              radius: ['40%', '70%'],
              data: Object.entries(stockByType).map(([name, value]) => ({ name, value: Number(value) })),
              label: { color: '#94a3b8' },
            },
          ],
        },
        {
          title: { text: 'GRN vs Issues (Today)', textStyle: { color: '#94a3b8', fontSize: 12 } },
          xAxis: { type: 'category', data: ['GRN', 'Issues'], axisLabel: { color: '#64748b' } },
          yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#1e293b' } } },
          series: [{ type: 'bar', data: [todayGrns.length, todayIssues.length], itemStyle: { color: '#22C55E' } }],
          grid: { left: 40, right: 20, bottom: 30, top: 40 },
        },
      ];

      const tableRows = materials.slice(0, 12).map((m: { code?: string; name?: string; reorderLevel?: number; unit?: string }) => [
        m.code ?? '—',
        m.name ?? '—',
        String(m.reorderLevel ?? 0),
        m.unit ?? '—',
      ]);

      setData({ kpis, todaysWork, alerts, quickActions, recentActivity, chartOptions, table: { headers: ['Code', 'Material', 'Reorder Level', 'Unit'], rows: tableRows } });
    } catch (e) {
      setError(getApiErrorMessage(e, 'Failed to load dashboard'));
      setData({
        kpis: [],
        todaysWork: [],
        alerts: [],
        quickActions: [],
        recentActivity: [],
        chartOptions: [],
        table: { headers: [], rows: [] },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}
