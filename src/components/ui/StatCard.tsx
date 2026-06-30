import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  accent?: string;
  iconBg?: string;
  glow?: string;
  delay?: number;
}

export function StatCard({
  label,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  accent = 'border-l-sky-500',
  iconBg = 'bg-sky-500/10 text-sky-400',
  glow,
  delay = 0,
}: StatCardProps) {
  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  const trendStyles = {
    up: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    down: 'bg-red-500/10 text-red-400 ring-red-500/20',
    neutral: 'bg-slate-500/10 text-slate-400 ring-slate-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay * 0.06 }}
      className={cn(
        'command-card group border-l-4 p-5 transition-shadow duration-300 hover:shadow-glasslg',
        accent,
        glow,
      )}
    >
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="section-label mb-3">{label}</p>
          <p className="kpi-value text-2xl sm:text-3xl">{value}</p>
          {change && (
            <div
              className={cn(
                'mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 tabular-nums',
                trendStyles[trend],
              )}
            >
              <TrendIcon size={12} aria-hidden />
              <span className="font-mono">{change}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-105',
              iconBg,
            )}
            aria-hidden
          >
            <Icon size={20} strokeWidth={1.75} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
