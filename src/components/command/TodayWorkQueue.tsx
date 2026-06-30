import { Link } from 'react-router-dom';
import { ChevronRight, Clock } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

export interface TodayWorkItem {
  id: string;
  label: string;
  detail?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  link: string;
  amount?: number;
  category: string;
}

interface TodayWorkQueueProps {
  title: string;
  subtitle: string;
  items: TodayWorkItem[];
  estimatedMinutes?: number;
  compact?: boolean;
}

const PRIORITY_STYLE: Record<string, string> = {
  critical: 'border-l-red-500 bg-red-500/5',
  high: 'border-l-amber-500 bg-amber-500/5',
  medium: 'border-l-sky-500 bg-sky-500/5',
  low: 'border-l-slate-600 bg-white/[0.02]',
};

export function TodayWorkQueue({ title, subtitle, items, estimatedMinutes, compact }: TodayWorkQueueProps) {
  if (!items.length) {
    return (
      <div className="command-card p-6 text-center text-sm text-slate-500">
        No urgent items — operational queue is clear.
      </div>
    );
  }

  return (
    <div className={cn('command-card', compact ? 'p-4' : 'p-5')}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <p className="text-[11px] text-slate-500">{subtitle}</p>
        </div>
        {estimatedMinutes != null && estimatedMinutes > 0 && (
          <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-400">
            <Clock size={12} />
            Est. {estimatedMinutes} min
          </div>
        )}
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={item.link}
              className={cn(
                'group flex items-start gap-3 rounded-xl border-l-2 px-3 py-2.5 transition-colors hover:bg-white/[0.04]',
                PRIORITY_STYLE[item.priority] ?? PRIORITY_STYLE.medium,
              )}
            >
              <span className="mt-0.5 text-emerald-400">✓</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-200">{item.label}</p>
                {item.detail && <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>}
                {item.amount != null && item.amount > 0 && (
                  <p className="mt-1 font-mono text-xs text-amber-400/90">{formatCurrency(item.amount)}</p>
                )}
              </div>
              <ChevronRight size={14} className="mt-1 shrink-0 text-slate-600 opacity-0 group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
