import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommandKpiCardProps {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  delay?: number;
}

export function CommandKpiCard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  iconColor = 'text-accent',
  delay = 0,
}: CommandKpiCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05 }}
      className="command-card group p-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
          <Icon size={16} className={iconColor} />
        </div>
        <div
          className={cn(
            'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium',
            trend === 'up' && 'bg-emerald-500/10 text-emerald-400',
            trend === 'down' && 'bg-red-500/10 text-red-400',
            trend === 'neutral' && 'bg-slate-500/10 text-slate-400',
          )}
        >
          <TrendIcon size={10} />
          {change}
        </div>
      </div>
      <p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{label}</p>
      <p className="mt-0.5 text-[10px] text-slate-600">vs last month</p>
    </motion.div>
  );
}
