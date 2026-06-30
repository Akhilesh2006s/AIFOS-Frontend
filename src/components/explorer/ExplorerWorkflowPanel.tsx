import { cn } from '@/lib/utils';
import type { ExplorerWorkflow } from '@/types/explorer';
import { Check, Circle, Clock, Ban, AlertTriangle } from 'lucide-react';

const STATUS_ICON = {
  complete: Check,
  active: Circle,
  waiting: Clock,
  blocked: Ban,
  delayed: AlertTriangle,
  not_started: Circle,
} as const;

const STATUS_RING = {
  complete: 'text-emerald-400',
  active: 'text-sky-400',
  waiting: 'text-amber-400',
  blocked: 'text-red-400',
  delayed: 'text-orange-400',
  not_started: 'text-slate-500',
} as const;

interface ExplorerWorkflowPanelProps {
  workflow?: ExplorerWorkflow;
  status: string;
  owner?: string;
}

export function ExplorerWorkflowPanel({ workflow, status, owner }: ExplorerWorkflowPanelProps) {
  const wf = workflow ?? {
    stage: 'Workflow',
    position: status.replace(/_/g, ' '),
    pendingWith: owner,
    steps: [{ label: 'Current status', status: 'active' as const, detail: status }],
  };

  return (
    <div className="command-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-400">Workflow position</p>
          <p className="mt-1 text-lg font-semibold text-white">{wf.stage}</p>
          <p className="text-sm capitalize text-slate-400">{wf.position}</p>
        </div>
        {wf.pendingWith && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-right">
            <p className="text-[9px] uppercase text-amber-400">Pending with</p>
            <p className="text-sm font-medium text-white">{wf.pendingWith}</p>
          </div>
        )}
      </div>
      <ol className="space-y-0">
        {wf.steps.map((step, i) => {
          const Icon = STATUS_ICON[step.status];
          return (
            <li key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-white/10', STATUS_RING[step.status])}>
                  <Icon size={14} />
                </div>
                {i < wf.steps.length - 1 && <div className="my-1 w-px flex-1 bg-white/10" />}
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium text-white">{step.label}</p>
                {step.detail && <p className="text-xs text-slate-500">{step.detail}</p>}
                {step.actor && <p className="text-[10px] text-slate-600">{step.actor}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
