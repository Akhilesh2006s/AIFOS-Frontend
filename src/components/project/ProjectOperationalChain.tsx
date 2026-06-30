import { Link } from 'react-router-dom';
import { Check, AlertTriangle, Clock, Ban, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OperationalChainStage {
  key: string;
  label: string;
  status: 'complete' | 'active' | 'waiting' | 'blocked' | 'delayed' | 'not_started';
  detail?: string;
  link: string;
}

interface ProjectOperationalChainProps {
  stages: OperationalChainStage[];
  completionImpact: string;
  projectCode: string;
}

const STATUS_META: Record<OperationalChainStage['status'], { icon: typeof Check; color: string; label: string }> = {
  complete: { icon: Check, color: 'text-emerald-400 bg-emerald-500/15 ring-emerald-500/30', label: 'Complete' },
  active: { icon: Circle, color: 'text-sky-400 bg-sky-500/15 ring-sky-500/30', label: 'In progress' },
  waiting: { icon: Clock, color: 'text-amber-400 bg-amber-500/15 ring-amber-500/30', label: 'Waiting' },
  blocked: { icon: Ban, color: 'text-red-400 bg-red-500/15 ring-red-500/30', label: 'Blocked' },
  delayed: { icon: AlertTriangle, color: 'text-orange-400 bg-orange-500/15 ring-orange-500/30', label: 'Delayed' },
  not_started: { icon: Circle, color: 'text-slate-500 bg-white/5 ring-white/10', label: 'Not started' },
};

export function ProjectOperationalChain({ stages, completionImpact, projectCode }: ProjectOperationalChainProps) {
  return (
    <div className="command-card p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Operational chain</p>
          <p className="mt-1 text-sm text-slate-400">{projectCode} — production to consumption</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-right">
          <p className="text-[9px] uppercase text-slate-500">Completion impact</p>
          <p className={cn('font-mono text-sm font-semibold', completionImpact.includes('+') ? 'text-amber-400' : 'text-emerald-400')}>
            {completionImpact}
          </p>
        </div>
      </div>
      <div className="space-y-0">
        {stages.map((stage, i) => {
          const meta = STATUS_META[stage.status];
          const Icon = meta.icon;
          return (
            <div key={stage.key}>
              <Link
                to={stage.link}
                className="group flex items-center gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-white/[0.04]"
              >
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1', meta.color)}>
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-slate-200">{stage.label}</p>
                    <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ring-1', meta.color)}>
                      {meta.label}
                    </span>
                  </div>
                  {stage.detail && <p className="mt-0.5 truncate text-xs text-slate-500">{stage.detail}</p>}
                </div>
              </Link>
              {i < stages.length - 1 && (
                <div className="ml-4 border-l border-dashed border-white/10 py-1 pl-8 text-[10px] text-slate-600">↓</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
