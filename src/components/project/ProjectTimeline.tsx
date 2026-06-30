import { cn } from '@/lib/utils';
import type { Milestone } from '@/components/project/ProjectPlanningTab';

export function ProjectTimeline({ milestones, projectStart, projectEnd }: {
  milestones: Milestone[];
  projectStart?: string;
  projectEnd?: string;
}) {
  if (!milestones.length) {
    return <div className="command-card p-6 text-center text-sm text-slate-500">Add milestones to see the timeline.</div>;
  }

  const start = projectStart ? new Date(projectStart).getTime() : Math.min(...milestones.map((m) => new Date(m.targetDate).getTime()));
  const end = projectEnd ? new Date(projectEnd).getTime() : Math.max(...milestones.map((m) => new Date(m.targetDate).getTime()));
  const span = Math.max(end - start, 1);
  const now = Date.now();

  return (
    <div className="command-card p-5">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Timeline</p>
      <div className="relative h-2 rounded-full bg-white/5">
        <div className="absolute top-0 h-2 rounded-full bg-sky-500/30" style={{ left: 0, width: `${Math.min(100, ((now - start) / span) * 100)}%` }} />
      </div>
      <div className="relative mt-6 space-y-3">
        {milestones.map((m) => {
          const t = new Date(m.targetDate).getTime();
          const left = ((t - start) / span) * 100;
          const overdue = t < now && m.status !== 'completed';
          return (
            <div key={m._id} className="relative flex items-center gap-3" style={{ marginLeft: `${Math.min(92, Math.max(0, left))}%` }}>
              <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', overdue ? 'bg-red-500' : m.status === 'completed' ? 'bg-emerald-500' : 'bg-sky-400')} />
              <div className="min-w-0">
                <p className={cn('text-xs font-medium', overdue ? 'text-red-400' : 'text-slate-200')}>{m.name}</p>
                <p className="text-[10px] text-slate-500">{new Date(m.targetDate).toLocaleDateString()} · {m.progressPercent}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
