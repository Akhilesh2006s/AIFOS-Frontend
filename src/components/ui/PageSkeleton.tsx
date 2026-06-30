export function PageSkeleton() {
  return (
    <div className="page-enter mx-auto max-w-[1600px] space-y-6 animate-pulse" role="status" aria-label="Loading page">
      <div className="h-4 w-48 rounded bg-white/5" />
      <div className="space-y-2">
        <div className="h-8 w-2/3 max-w-md rounded-lg bg-white/5" />
        <div className="h-4 w-1/2 max-w-sm rounded bg-white/5" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="command-card h-28" />
        ))}
      </div>
      <div className="command-card h-80" />
    </div>
  );
}
