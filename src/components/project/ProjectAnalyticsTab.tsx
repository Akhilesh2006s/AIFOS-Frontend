import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { moduleApi } from '@/api/client';
import { ProgressBar } from '@/components/ui/TableCells';
import { ProjectFinancialTab } from '@/components/project/ProjectFinancialTab';

export function ProjectAnalyticsTab({ projectId }: { projectId: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || 'health';
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    moduleApi.projects.health(projectId).then((r) => setHealth(r.data));
  }, [projectId]);

  if (!health && view === 'health') {
    return <div className="command-card p-8 text-center text-sm text-slate-500">Loading analytics…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[
          { id: 'health', label: 'Health' },
          { id: 'financial', label: 'Financial' },
        ].map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              if (v.id === 'health') next.delete('view');
              else next.set('view', v.id);
              setSearchParams(next, { replace: true });
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${view === v.id ? 'bg-sky-500/20 text-sky-300' : 'text-slate-500 hover:text-white'}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'financial' ? (
        <ProjectFinancialTab projectId={projectId} />
      ) : (
        <HealthView health={health!} />
      )}
    </div>
  );
}

function HealthView({ health }: { health: Record<string, unknown> }) {
  const cards = [
    { label: 'Health score', value: health.score, color: health.healthLabel === 'good' ? '#22C55E' : health.healthLabel === 'warn' ? '#EAB308' : '#EF4444' },
    { label: 'Overall progress', value: `${health.overallProgress}%`, progress: health.overallProgress as number },
    { label: 'BOQ completion', value: `${health.boqCompletion}%` },
    { label: 'Delayed milestones', value: health.delayedMilestones },
    { label: 'Open issues', value: health.openIssues },
    { label: 'Pending approvals', value: health.pendingApprovals },
    { label: 'Equipment assigned', value: health.equipmentAssigned },
    { label: 'Team allocations', value: health.teamAllocations },
  ];

  const mr = health.materialRequirementStatus as { total: number; approved: number; pending: number };
  const pr = health.procurementProgress as { percent: number; pending: number; total: number };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="command-card p-5">
            <p className="text-[10px] uppercase tracking-wider text-slate-600">{c.label}</p>
            <p className="mt-2 font-mono text-3xl font-bold text-white" style={c.color ? { color: c.color as string } : undefined}>{String(c.value)}</p>
            {c.progress !== undefined && <div className="mt-3"><ProgressBar value={c.progress} color="#38BDF8" /></div>}
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="command-card p-4">
          <p className="text-xs font-semibold text-white">Material requirements</p>
          <p className="mt-2 text-sm text-slate-400">{mr.approved} approved · {mr.pending} pending · {mr.total} total</p>
        </div>
        <div className="command-card p-4">
          <p className="text-xs font-semibold text-white">Procurement</p>
          <p className="mt-2 text-sm text-slate-400">{pr.percent}% complete · {pr.pending} pending PRs</p>
        </div>
      </div>
    </>
  );
}
