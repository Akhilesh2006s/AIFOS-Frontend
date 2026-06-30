export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse px-5 py-4" role="status" aria-label="Loading table">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="mb-3 flex gap-4">
          {Array.from({ length: cols }).map((__, c) => (
            <div
              key={c}
              className="h-4 flex-1 rounded-md bg-white/5"
              style={{ maxWidth: c === 0 ? '30%' : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
