import { motion } from 'framer-motion';
import type { EChartsOption } from 'echarts';
import { BarChart3 } from 'lucide-react';
import { LazyECharts } from '@/components/ui/LazyECharts';
import { extractChartTitle, isChartEmpty } from '@/lib/chartUtils';

interface CommandChartCardProps {
  title: string;
  subtitle?: string;
  option: EChartsOption;
  height?: number;
  delay?: number;
  headerRight?: React.ReactNode;
  emptyMessage?: string;
}

const darkChartTheme = {
  textStyle: { color: '#94a3b8', fontFamily: 'Inter, sans-serif' },
};

export function CommandChartCard({
  title,
  subtitle,
  option,
  height = 260,
  delay = 0,
  headerRight,
  emptyMessage = 'No data for the selected period',
}: CommandChartCardProps) {
  const displayTitle = title || extractChartTitle(option) || 'Chart';
  const empty = isChartEmpty(option);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08 }}
      className="command-card p-5 sm:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-heading-section text-sm">{displayTitle}</h3>
          {subtitle && <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{subtitle}</p>}
        </div>
        {headerRight}
      </div>
      {empty ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-center"
          style={{ height }}
          role="img"
          aria-label={emptyMessage}
        >
          <BarChart3 size={28} className="mb-2 text-slate-600" aria-hidden />
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        </div>
      ) : (
        <LazyECharts option={{ ...darkChartTheme, ...option }} height={height} opts={{ renderer: 'svg' }} />
      )}
    </motion.div>
  );
}
