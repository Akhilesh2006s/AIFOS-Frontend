import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, ArrowRight } from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { CommandChartCard } from '@/components/command/CommandChartCard';
import { AiInsightsPanel } from '@/components/ui/AiInsightsPanel';
import { analyticsApi } from '@/api/client';
import { useUiStore } from '@/store/ui';
import { commandKpiVisuals, defaultCommandKpiVisual } from '@/config/kpi-config';
import { formatCurrency } from '@/lib/locale';

interface DashboardData {
  kpis: Array<{
    id: string;
    label: string;
    value: string | number;
    valueFormatted?: boolean;
    change: string;
    trend: 'up' | 'down' | 'neutral';
  }>;
  chartData: {
    projectProgress: Array<{ name: string; progress: number }>;
    monthlySpend: Array<{ month: string; materials: number; labor: number; equipment: number; others: number }>;
    equipmentStatus: Array<{ name: string; value: number }>;
  };
  aiInsights: Array<{ type: 'warning' | 'info' | 'success'; title: string; message: string }>;
}

export function AnalyticsPage() {
  const locale = useUiStore((s) => s.locale);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.executive().then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const kpiStats = data?.kpis.map((kpi) => {
    const v = commandKpiVisuals[kpi.id] || defaultCommandKpiVisual;
    return {
      label: kpi.label,
      value:
        kpi.valueFormatted && typeof kpi.value === 'number'
          ? formatCurrency(kpi.value, locale)
          : kpi.value,
      change: kpi.change,
      trend: kpi.trend,
      icon: v.icon,
      iconColor: v.iconColor,
    };
  });

  return (
    <ModulePageLayout
      title="Business Intelligence"
      subtitle="Cross-module analytics, executive KPIs and operational insights"
      loading={loading}
      stats={kpiStats}
      heroActions={
        <Link to="/" className="btn-ghost flex items-center gap-2 text-sm">
          Command Center <ArrowRight size={14} />
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CommandChartCard
          title="Project Progress"
          subtitle="Active infrastructure projects"
          option={{
            grid: { left: 40, right: 16, top: 16, bottom: 40 },
            xAxis: {
              type: 'category',
              data: data?.chartData.projectProgress.map((p) => p.name),
              axisLabel: { fontSize: 10, rotate: 15, color: '#64748b' },
              axisLine: { lineStyle: { color: '#1e293b' } },
            },
            yAxis: {
              type: 'value',
              max: 100,
              axisLabel: { formatter: '{value}%', color: '#64748b' },
              splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
            },
            series: [{
              type: 'bar',
              data: data?.chartData.projectProgress.map((p) => p.progress),
              itemStyle: { borderRadius: [6, 6, 0, 0], color: '#3b82f6' },
            }],
            tooltip: { trigger: 'axis', backgroundColor: '#0f1d32', textStyle: { color: '#e2e8f0' } },
          }}
        />
        <CommandChartCard
          title="Monthly Spend"
          subtitle="Stacked by category (₹ Cr)"
          option={{
            grid: { left: 40, right: 16, top: 36, bottom: 28 },
            legend: { top: 0, textStyle: { color: '#64748b', fontSize: 10 } },
            xAxis: {
              type: 'category',
              data: data?.chartData.monthlySpend.map((m) => m.month),
              axisLabel: { color: '#64748b' },
              axisLine: { lineStyle: { color: '#1e293b' } },
            },
            yAxis: {
              type: 'value',
              axisLabel: { color: '#64748b' },
              splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
            },
            series: [
              { name: 'Materials', type: 'bar', stack: 't', data: data?.chartData.monthlySpend.map((m) => m.materials), itemStyle: { color: '#3b82f6' } },
              { name: 'Labor', type: 'bar', stack: 't', data: data?.chartData.monthlySpend.map((m) => m.labor), itemStyle: { color: '#22c55e' } },
              { name: 'Equipment', type: 'bar', stack: 't', data: data?.chartData.monthlySpend.map((m) => m.equipment), itemStyle: { color: '#f97316' } },
              { name: 'Others', type: 'bar', stack: 't', data: data?.chartData.monthlySpend.map((m) => m.others), itemStyle: { color: '#64748b' } },
            ],
            tooltip: { trigger: 'axis', backgroundColor: '#0f1d32', textStyle: { color: '#e2e8f0' } },
          }}
        />
      </div>

      {data?.aiInsights && (
        <div className="mt-6">
          <AiInsightsPanel insights={data.aiInsights} />
        </div>
      )}

      <div className="command-card mt-6 p-8 text-center">
        <BarChart3 className="mx-auto mb-3 text-sky-400" size={28} />
        <p className="text-sm text-slate-500">Custom report builder and scheduled exports — Phase 2</p>
      </div>
    </ModulePageLayout>
  );
}

export function AiPage() {
  return (
    <ModulePageLayout
      title="AFIOS Intelligence"
      subtitle="AI copilots and predictive analytics — Phase 3"
      heroActions={
        <Link to="/" className="btn-ghost flex items-center gap-2 text-sm">
          <ArrowRight size={14} className="rotate-180" /> Command Center
        </Link>
      }
    >
      <div className="command-card mx-auto max-w-2xl p-12 text-center">
        <h3 className="font-display text-2xl font-bold text-white">Intelligence at Work</h3>
        <p className="mt-3 text-slate-400">
          Natural-language queries, predictive maintenance, and procurement optimization — arriving in Phase 3.
        </p>
      </div>
    </ModulePageLayout>
  );
}
