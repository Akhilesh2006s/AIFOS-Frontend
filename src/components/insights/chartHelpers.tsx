import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CommandChartCard } from '@/components/command/CommandChartCard';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

const chartTooltip = { trigger: 'axis' as const, backgroundColor: '#0f1d32', textStyle: { color: '#e2e8f0' } };
const axisStyle = { color: '#64748b', fontSize: 10 };
const splitLine = { lineStyle: { color: '#1e293b', type: 'dashed' as const } };

export const TrendChart = memo(function TrendChart({
  title,
  subtitle,
  labels,
  values,
  color = '#3b82f6',
  formatValue,
  link,
}: {
  title: string;
  subtitle?: string;
  labels: string[];
  values: number[];
  color?: string;
  formatValue?: (v: number) => string;
  link?: string;
}) {
  const headerRight = link ? (
    <Link to={link} className="text-[10px] text-accent hover:underline">Drill down →</Link>
  ) : undefined;

  const option = useMemo(
    () => ({
      grid: { left: 44, right: 16, top: 16, bottom: 28 },
      xAxis: { type: 'category' as const, data: labels, axisLabel: axisStyle, axisLine: { lineStyle: { color: '#1e293b' } } },
      yAxis: { type: 'value' as const, axisLabel: axisStyle, splitLine },
      series: [{ type: 'line' as const, data: values, smooth: true, itemStyle: { color }, areaStyle: { color: `${color}22` } }],
      tooltip: formatValue
        ? { ...chartTooltip, valueFormatter: (v: unknown) => formatValue(Number(v)) }
        : chartTooltip,
    }),
    [labels, values, color, formatValue],
  );

  return (
    <CommandChartCard
      title={title}
      subtitle={subtitle}
      headerRight={headerRight}
      option={option}
    />
  );
});

export const BarChart = memo(function BarChart({
  title,
  subtitle,
  labels,
  values,
  color = '#22c55e',
  link,
}: {
  title: string;
  subtitle?: string;
  labels: string[];
  values: number[];
  color?: string;
  link?: string;
}) {
  const option = useMemo(
    () => ({
      grid: { left: 44, right: 16, top: 16, bottom: 40 },
      xAxis: {
        type: 'category' as const,
        data: labels,
        axisLabel: { ...axisStyle, rotate: labels.some((l) => l.length > 8) ? 20 : 0 },
        axisLine: { lineStyle: { color: '#1e293b' } },
      },
      yAxis: { type: 'value' as const, axisLabel: axisStyle, splitLine },
      series: [{ type: 'bar' as const, data: values, itemStyle: { color, borderRadius: [4, 4, 0, 0] } }],
      tooltip: chartTooltip,
    }),
    [labels, values, color],
  );

  return (
    <CommandChartCard
      title={title}
      subtitle={subtitle}
      headerRight={link ? <Link to={link} className="text-[10px] text-accent hover:underline">View →</Link> : undefined}
      option={option}
    />
  );
});

export function KpiStrip({ items }: { items: Array<{ label: string; value: string | number; link?: string; warn?: boolean }> }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const inner = (
          <>
            <p className="section-label">{item.label}</p>
            <p className={cn('mt-2 font-mono text-xl font-bold tabular-nums sm:text-2xl', item.warn ? 'text-amber-400' : 'text-white')}>{item.value}</p>
          </>
        );
        return item.link ? (
          <Link key={item.label} to={item.link} className="command-card p-4 transition-colors hover:border-white/15 sm:p-5">{inner}</Link>
        ) : (
          <div key={item.label} className="command-card p-4 sm:p-5">{inner}</div>
        );
      })}
    </div>
  );
}

export function ComparisonRow({ label, current, previous, changePct, suffix = '' }: {
  label: string; current: number; previous: number; changePct: number; suffix?: string;
}) {
  const up = changePct >= 0;
  return (
    <div className="flex items-center justify-between rounded-xl border px-4 py-3.5" style={{ borderColor: 'var(--command-border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
      <span className="text-sm text-slate-300">{label}</span>
      <div className="text-right">
        <p className="font-mono text-sm tabular-nums text-white">{current}{suffix} <span className="text-slate-500">vs {previous}{suffix}</span></p>
        <p className={cn('mt-0.5 text-[10px] font-medium tabular-nums', up ? 'text-emerald-400' : 'text-red-400')}>{changePct > 0 ? '+' : ''}{changePct}%</p>
      </div>
    </div>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, string | number>>;
}) {
  return (
    <div className="command-card overflow-x-auto scrollbar-thin">
      <table className="data-table min-w-[480px]">
        <thead>
          <tr>
            {columns.map((c) => <th key={c.key} scope="col">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty-cell text-sm text-slate-500">No data available</td>
            </tr>
          ) : rows.map((row, i) => (
            <tr key={i} className="data-table-row">
              {columns.map((c) => (
                <td key={c.key}>
                  {row.link && (c.key === 'name' || c.key === 'invoice' || c.key === 'documentType' || c.key === 'project') ? (
                    <Link to={String(row.link)} className="font-medium text-white transition-colors hover:text-accent">{row[c.key]}</Link>
                  ) : (
                    row[c.key]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { formatCurrency };
