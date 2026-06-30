import { cn } from '@/lib/utils';

const variants: Record<string, string> = {
  active: 'badge-success',
  approved: 'badge-success',
  valid: 'badge-success',
  completed: 'badge-success',
  received: 'badge-success',
  matched: 'badge-success',
  pending: 'badge-warning',
  open: 'badge-warning',
  submitted: 'badge-warning',
  in_progress: 'badge-info',
  in_use: 'badge-info',
  on_trip: 'badge-info',
  scheduled: 'badge-info',
  draft: 'badge-neutral',
  planning: 'badge-draft',
  maintenance: 'badge-warning',
  available: 'badge-info',
  expired: 'badge-danger',
  rejected: 'badge-danger',
  cancelled: 'badge-danger',
  exception: 'badge-danger',
  critical: 'badge-danger',
};

interface StatusBadgeProps {
  status: string;
  dot?: boolean;
}

export function StatusBadge({ status, dot = false }: StatusBadgeProps) {
  const key = status.toLowerCase().replace(/\s+/g, '_');
  const style = variants[key] || 'badge-neutral';

  return (
    <span className={cn('badge', style)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden />}
      {status.replace(/_/g, ' ')}
    </span>
  );
}
