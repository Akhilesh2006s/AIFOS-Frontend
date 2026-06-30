import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichKpiCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  emoji?: string;
  color?: string;
  progress?: number;
  sparkline?: number[];
  delay?: number;
}

export function RichKpiCard({
  label,
  value,
  sublabel,
  change,
  trend = 'neutral',
  icon: Icon,
  emoji,
  color = '#F97316',
  progress,
  sparkline = [40, 55, 45, 70, 65, 80, 75],
  delay = 0,
}: RichKpiCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const max = Math.max(...sparkline, 1);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.04, duration: 0.35 }}
      className="command-card group relative overflow-hidden p-4 sm:p-5"
      aria-label={`${label}: ${value}`}
    >
      <div
        className="pointer-events-none absolute right-0 top-0 h-20 w-20 rounded-bl-full opacity-[0.12]"
        style={{ backgroundColor: color }}
        aria-hidden
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            {emoji ? (
              <span className="text-lg" aria-hidden>{emoji}</span>
            ) : Icon ? (
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1"
                style={{ backgroundColor: `${color}18`, borderColor: `${color}33` }}
                aria-hidden
              >
                <Icon size={16} style={{ color }} />
              </div>
            ) : null}
            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
          </div>
          {change && (
            <div
              className={cn(
                'flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums',
                trend === 'up' && 'bg-emerald-500/10 text-emerald-400',
                trend === 'down' && 'bg-red-500/10 text-red-400',
                trend === 'neutral' && 'bg-slate-500/10 text-slate-400',
              )}
            >
              <TrendIcon size={10} aria-hidden />
              {change}
            </div>
          )}
        </div>

        <p className="mt-3 font-mono text-2xl font-bold tracking-tight text-white tabular-nums sm:text-3xl">{value}</p>
        {sublabel && <p className="mt-1 text-xs text-slate-500">{sublabel}</p>}

        {progress !== undefined && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.7, delay: delay * 0.08 }}
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>
        )}

        <div className="mt-3 flex h-7 items-end gap-0.5" aria-hidden>
          {sparkline.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm opacity-60 transition-opacity group-hover:opacity-100"
              style={{ height: `${(v / max) * 100}%`, backgroundColor: color, minHeight: 2 }}
            />
          ))}
        </div>
      </div>
    </motion.article>
  );
}
