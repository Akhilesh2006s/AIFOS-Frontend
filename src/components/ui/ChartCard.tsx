import { LazyECharts } from './LazyECharts';
import { GlassCard } from './GlassCard';

const chartColors = ['#38bdf8', '#f97316', '#22c55e', '#94a3b8', '#a78bfa'];

interface ChartCardProps {
  title: string;
  subtitle?: string;
  option: Record<string, unknown>;
  height?: number;
  delay?: number;
}

export function ChartCard({ title, subtitle, option, height = 300, delay = 0 }: ChartCardProps) {
  return (
    <GlassCard delay={delay} noPadding className="overflow-hidden">
      <div className="border-b px-6 py-4" style={{ borderColor: 'var(--command-border)' }}>
        <h3 className="text-heading-section">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="px-2 pb-3 pt-2">
        <LazyECharts
          option={{
            color: chartColors,
            grid: { top: 28, right: 24, bottom: 36, left: 52 },
            textStyle: { fontFamily: 'Inter, sans-serif', color: '#94a3b8' },
            ...option,
          }}
          height={height}
          opts={{ renderer: 'svg' }}
        />
      </div>
    </GlassCard>
  );
}
