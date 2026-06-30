import { useCallback, useEffect, useState } from 'react';
import { moduleApi } from '@/api/client';
import { getApiErrorMessage } from '@/lib/apiHelpers';
import { isOverdue, isToday } from '@/lib/dateHelpers';
import { formatCurrency, formatDate } from '@/lib/utils';
import type {
  DashboardActivity,
  DashboardAlert,
  DashboardKpi,
  DashboardQuickAction,
  DashboardWorkItem,
} from '@/components/dashboards/types';
import type { EChartsOption } from 'echarts';
import { AlertTriangle, Calendar, CheckCircle, Wrench } from 'lucide-react';

interface MaintenanceDashboardData {
  kpis: DashboardKpi[];
  todaysWork: DashboardWorkItem[];
  alerts: DashboardAlert[];
  quickActions: DashboardQuickAction[];
  recentActivity: DashboardActivity[];
  chartOptions: EChartsOption[];
  table: { headers: string[]; rows: string[][] };
}

export function useMaintenanceDashboard() {
  const [data, setData] = useState<MaintenanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, ordersRes, breakdownsRes, calendarRes, equipStats] = await Promise.all([
        moduleApi.maintenance.stats(),
        moduleApi.maintenance.workOrders(),
        moduleApi.maintenance.breakdowns().catch(() => ({ data: [] })),
        moduleApi.maintenance.calendar().catch(() => ({ data: [] })),
        moduleApi.equipment.stats(),
      ]);

      const stats = statsRes.data ?? {};
      const orders = ordersRes.data ?? [];
      const breakdowns = breakdownsRes.data ?? [];
      const calendar = calendarRes.data ?? [];

      const todayMaintenance = calendar.filter((w: { scheduledDate?: string }) => isToday(w.scheduledDate));
      const overdueMaintenance = calendar.filter((w: { scheduledDate?: string; status?: string }) =>
        isOverdue(w.scheduledDate) && w.status !== 'completed',
      );
      const openBreakdowns = breakdowns.filter((b: { status?: string }) =>
        ['open', 'in_progress'].includes(b.status ?? ''),
      );
      const openOrders = orders.filter((o: { status?: string }) => ['open', 'in_progress'].includes(o.status ?? ''));
      const maintenanceCost = orders
        .filter((o: { status?: string }) => o.status === 'completed')
        .reduce((sum: number, o: { actualCost?: number; estimatedCost?: number }) => sum + (o.actualCost ?? o.estimatedCost ?? 0), 0);

      const kpis: DashboardKpi[] = [
        { label: "Today's Maintenance", value: todayMaintenance.length, color: '#3B82F6' },
        { label: 'Overdue', value: overdueMaintenance.length, color: '#EF4444' },
        { label: 'Breakdowns', value: openBreakdowns.length || stats.breakdowns || 0, color: '#F97316' },
        { label: 'Open Work Orders', value: stats.open ?? openOrders.length, color: '#EAB308' },
        { label: 'In Progress', value: stats.inProgress ?? 0, color: '#A855F7' },
        { label: 'Maintenance Cost', value: formatCurrency(maintenanceCost), color: '#22C55E' },
      ];

      const todaysWork: DashboardWorkItem[] = [
        ...todayMaintenance.slice(0, 4).map((w: { _id: string; woNumber?: string; title?: string; status?: string }) => ({
          id: w._id,
          label: w.title ?? w.woNumber ?? 'Work order',
          status: w.status,
          href: '/maintenance',
        })),
        ...openBreakdowns.slice(0, 2).map((b: { _id: string; ticketNumber?: string; title?: string; status?: string }) => ({
          id: b._id,
          label: `Breakdown: ${b.title}`,
          status: b.status,
          href: '/maintenance',
        })),
      ];

      const alerts: DashboardAlert[] = [];
      overdueMaintenance.forEach((w: { _id: string; title?: string; woNumber?: string }) => {
        alerts.push({
          id: w._id,
          severity: 'critical',
          title: `Overdue: ${w.title ?? w.woNumber}`,
          href: '/maintenance',
        });
      });
      openBreakdowns.forEach((b: { _id: string; title?: string }) => {
        alerts.push({
          id: b._id,
          severity: 'critical',
          title: `Breakdown: ${b.title}`,
          href: '/maintenance',
        });
      });

      const quickActions: DashboardQuickAction[] = [
        { label: 'Schedule Maintenance', href: '/maintenance', icon: Calendar },
        { label: 'Create Work Order', href: '/maintenance', icon: Wrench },
        { label: 'Close Work Order', href: '/maintenance', icon: CheckCircle },
        { label: 'Record Breakdown', href: '/maintenance', icon: AlertTriangle },
      ];

      const recentActivity: DashboardActivity[] = orders.slice(0, 10).map(
        (o: { _id: string; woNumber?: string; title?: string; status?: string; updatedAt?: string; createdAt?: string }) => ({
          id: o._id,
          type: 'work_order',
          label: `${o.woNumber} — ${o.title}`,
          status: o.status,
          at: o.updatedAt || o.createdAt,
        }),
      );

      const statusCounts = orders.reduce((acc: Record<string, number>, o: { status?: string }) => {
        const s = o.status ?? 'unknown';
        acc[s] = (acc[s] ?? 0) + 1;
        return acc;
      }, {});

      const chartOptions: EChartsOption[] = [
        {
          title: { text: 'Work Orders by Status', textStyle: { color: '#94a3b8', fontSize: 12 } },
          tooltip: { trigger: 'item' },
          series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            data: Object.entries(statusCounts).map(([name, value]) => ({ name, value: Number(value) })),
            label: { color: '#94a3b8' },
          }],
        },
        {
          title: { text: 'Equipment Availability', textStyle: { color: '#94a3b8', fontSize: 12 } },
          xAxis: {
            type: 'category',
            data: ['In Use', 'Available', 'Breakdown', 'Maintenance'],
            axisLabel: { color: '#64748b' },
          },
          yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#1e293b' } } },
          series: [{
            type: 'bar',
            data: [
              equipStats.data?.inUse ?? 0,
              equipStats.data?.available ?? 0,
              equipStats.data?.breakdown ?? 0,
              equipStats.data?.maintenance ?? 0,
            ],
            itemStyle: { color: '#1F4E79' },
          }],
          grid: { left: 40, right: 20, bottom: 30, top: 40 },
        },
      ];

      const tableRows = openOrders.slice(0, 12).map(
        (o: { woNumber?: string; title?: string; type?: string; status?: string; scheduledDate?: string }) => [
          o.woNumber ?? '—',
          o.title ?? '—',
          o.type ?? '—',
          o.status ?? '—',
          o.scheduledDate ? formatDate(o.scheduledDate) : '—',
        ],
      );

      setData({
        kpis,
        todaysWork,
        alerts: alerts.slice(0, 8),
        quickActions,
        recentActivity,
        chartOptions,
        table: { headers: ['WO #', 'Title', 'Type', 'Status', 'Scheduled'], rows: tableRows },
      });
    } catch (e) {
      setError(getApiErrorMessage(e, 'Failed to load maintenance dashboard'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}
