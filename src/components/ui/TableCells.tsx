import { cn } from '@/lib/utils';

export function RowAvatar({ name, color = '#38BDF8' }: { name: string; color?: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white ring-1 ring-white/10"
        style={{ background: `linear-gradient(135deg, ${color}99, ${color}44)` }}
        aria-hidden
      >
        {initials || '?'}
      </div>
      <span className="font-medium text-slate-200">{name}</span>
    </div>
  );
}

export function ProgressBar({
  value,
  color = '#38BDF8',
  showLabel = true,
}: {
  value: number;
  color?: string;
  showLabel?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="h-2 w-24 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      {showLabel && <span className="text-xs tabular-nums text-slate-400">{pct}%</span>}
    </div>
  );
}

const priorityStyles = {
  critical: 'bg-red-500/15 text-red-400 ring-red-500/25',
  high: 'bg-amber-500/15 text-amber-400 ring-amber-500/25',
  medium: 'bg-sky-500/15 text-sky-400 ring-sky-500/25',
  low: 'bg-slate-500/15 text-slate-400 ring-slate-500/25',
} as const;

export function PriorityTag({ priority }: { priority: keyof typeof priorityStyles | string }) {
  const key = (priority in priorityStyles ? priority : 'medium') as keyof typeof priorityStyles;
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1', priorityStyles[key])}>
      {priority}
    </span>
  );
}

export function TagList({ tags, color = '#64748B' }: { tags: string[]; color?: string }) {
  if (!tags.length) return <span className="text-slate-600">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className="rounded-md px-2 py-0.5 text-[10px] font-medium ring-1"
          style={{ backgroundColor: `${color}15`, color, borderColor: `${color}33` }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}
