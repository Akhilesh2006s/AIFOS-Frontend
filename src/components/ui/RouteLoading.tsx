import { PageSkeleton } from './PageSkeleton';

export function RouteLoading({ label = 'Loading workspace…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" aria-label={label}>
      <p className="sr-only">{label}</p>
      <PageSkeleton />
    </div>
  );
}
