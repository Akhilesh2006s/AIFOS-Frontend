import { useCallback, useEffect, useState } from 'react';
import { moduleApi } from '@/api/client';
import { getApiErrorMessage } from '@/lib/apiHelpers';
import { explorerPath } from '@/lib/explorerLinks';
import { formatDate } from '@/lib/utils';
import type {
  DashboardActivity,
  DashboardAlert,
  DashboardKpi,
  DashboardQuickAction,
  DashboardWorkItem,
} from '@/components/dashboards/types';
import type { EChartsOption } from 'echarts';
import { RefreshCw, ShieldCheck, UserCheck, FileUp } from 'lucide-react';

interface ComplianceDashboardData {
  kpis: DashboardKpi[];
  todaysWork: DashboardWorkItem[];
  alerts: DashboardAlert[];
  quickActions: DashboardQuickAction[];
  recentActivity: DashboardActivity[];
  chartOptions: EChartsOption[];
  table: { headers: string[]; rows: string[][] };
}

const DOC_CATEGORIES = ['RC', 'Insurance', 'Fitness', 'Operator License', 'AMC', 'Warranty'];

function categorizeDoc(documentType?: string): string {
  const dt = (documentType ?? '').toLowerCase();
  if (dt.includes('rc') || dt.includes('registration')) return 'RC';
  if (dt.includes('insur')) return 'Insurance';
  if (dt.includes('fitness') || dt.includes('puc')) return 'Fitness';
  if (dt.includes('license') || dt.includes('operator')) return 'Operator License';
  if (dt.includes('amc')) return 'AMC';
  if (dt.includes('warrant')) return 'Warranty';
  return 'Other';
}

export function useComplianceDashboard() {
  const [data, setData] = useState<ComplianceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, recordsRes, alertsRes] = await Promise.all([
        moduleApi.compliance.stats(),
        moduleApi.compliance.records(),
        moduleApi.compliance.alerts().catch(() => ({ data: [] })),
      ]);

      const stats = statsRes.data ?? {};
      const records = recordsRes.data ?? [];
      const alertList = alertsRes.data ?? [];

      const categoryCounts = DOC_CATEGORIES.reduce(
        (acc, cat) => {
          acc[cat] = records.filter((r: { documentType?: string }) => categorizeDoc(r.documentType) === cat).length;
          return acc;
        },
        {} as Record<string, number>,
      );

      const expiringRecords = records.filter(
        (r: { alertTier?: string; status?: string }) =>
          r.alertTier && !['valid', undefined].includes(r.alertTier),
      );

      const kpis: DashboardKpi[] = [
        { label: 'Expiring RC', value: categoryCounts['RC'] > 0 ? stats.alert30 ?? 0 : 0, color: '#EF4444', sublabel: '30-day window' },
        { label: 'Insurance', value: categoryCounts['Insurance'], color: '#3B82F6' },
        { label: 'Fitness', value: categoryCounts['Fitness'], color: '#22C55E' },
        { label: 'Operator Licenses', value: categoryCounts['Operator License'], color: '#A855F7' },
        { label: 'AMC', value: categoryCounts['AMC'], color: '#F97316' },
        { label: 'Critical Alerts', value: stats.expired ?? 0, color: '#EF4444' },
      ];

      const todaysWork: DashboardWorkItem[] = expiringRecords.slice(0, 6).map(
        (r: { _id: string; documentType?: string; documentNumber?: string; alertTier?: string }) => ({
          id: r._id,
          label: `Renew ${r.documentType}`,
          detail: r.documentNumber,
          status: r.alertTier,
          href: explorerPath('compliance-record', r._id),
        }),
      );

      const alerts: DashboardAlert[] = alertList.slice(0, 8).map(
        (a: { record: { _id: string; documentType?: string; documentNumber?: string }; alertTier: string }, i: number) => ({
          id: a.record._id ?? `alert-${i}`,
          severity: a.alertTier === 'expired' ? 'critical' : a.alertTier === '7_days' ? 'critical' : 'warning',
          title: `${a.record.documentType} — ${a.record.documentNumber}`,
          message: `Expires: ${a.alertTier.replace('_', ' ')}`,
          href: explorerPath('compliance-record', a.record._id),
        }),
      );

      const quickActions: DashboardQuickAction[] = [
        { label: 'Renew', href: '/business/compliance', icon: RefreshCw },
        { label: 'Upload Document', href: '/business/compliance', icon: FileUp },
        { label: 'Assign Compliance Task', href: '/business/compliance', icon: UserCheck },
        { label: 'View All Records', href: '/business/compliance', icon: ShieldCheck },
      ];

      const recentActivity: DashboardActivity[] = records.slice(0, 10).map(
        (r: { _id: string; documentType?: string; documentNumber?: string; expiryDate?: string; alertTier?: string; status?: string }) => ({
          id: r._id,
          type: 'compliance',
          label: `${r.documentType} ${r.documentNumber ?? ''}`,
          status: r.alertTier ?? r.status,
          at: r.expiryDate,
        }),
      );

      const tierCounts = alertList.reduce((acc: Record<string, number>, a: { alertTier: string }) => {
        acc[a.alertTier] = (acc[a.alertTier] ?? 0) + 1;
        return acc;
      }, {});

      const chartOptions: EChartsOption[] = [
        {
          title: { text: 'Documents by Category', textStyle: { color: '#94a3b8', fontSize: 12 } },
          tooltip: { trigger: 'item' },
          series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            data: Object.entries(categoryCounts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value: Number(value) })),
            label: { color: '#94a3b8' },
          }],
        },
        {
          title: { text: 'Alert Tiers', textStyle: { color: '#94a3b8', fontSize: 12 } },
          xAxis: {
            type: 'category',
            data: Object.keys(tierCounts),
            axisLabel: { color: '#64748b', rotate: 30 },
          },
          yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#1e293b' } } },
          series: [{ type: 'bar', data: Object.values(tierCounts), itemStyle: { color: '#EAB308' } }],
          grid: { left: 40, right: 20, bottom: 50, top: 40 },
        },
      ];

      const tableRows = records.slice(0, 12).map(
        (r: { entityType?: string; documentType?: string; documentNumber?: string; expiryDate?: string; alertTier?: string; status?: string }) => [
          r.entityType ?? '—',
          r.documentType ?? '—',
          r.documentNumber ?? '—',
          r.expiryDate ? formatDate(r.expiryDate) : '—',
          String(r.alertTier || r.status || '—'),
        ],
      );

      setData({
        kpis,
        todaysWork,
        alerts,
        quickActions,
        recentActivity,
        chartOptions,
        table: { headers: ['Entity', 'Document', 'Number', 'Expiry', 'Status'], rows: tableRows },
      });
    } catch (e) {
      setError(getApiErrorMessage(e, 'Failed to load compliance dashboard'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}
