import { Link } from 'react-router-dom';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface JourneyStep {
  id: string;
  label: string;
  done: boolean;
  active?: boolean;
  tab: string;
}

interface ProjectWorkflowJourneyProps {
  projectId: string;
  steps: JourneyStep[];
}

export function ProjectWorkflowJourney({ projectId, steps }: ProjectWorkflowJourneyProps) {
  return (
    <div className="command-card p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Project journey</p>
      <div className="flex flex-wrap items-center gap-1">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-1">
            <Link
              to={step.tab === 'overview' ? `/projects/${projectId}` : `/projects/${projectId}?tab=${step.tab}`}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                step.active ? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
              )}
            >
              {step.done ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <Circle size={10} className={step.active ? 'text-sky-400' : 'text-slate-600'} />
              )}
              {step.label}
            </Link>
            {i < steps.length - 1 && <span className="text-slate-700">→</span>}
          </div>
        ))}
        <span className="text-slate-700">→</span>
        <Link to="/procurement" className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-emerald-400/80 hover:bg-emerald-500/10">
          Supply Chain
        </Link>
      </div>
    </div>
  );
}

export function buildProjectJourney(data: {
  milestones: unknown[];
  boq: unknown[];
  requirements: Array<{ status: string }>;
  prsPending: number;
}): JourneyStep[] {
  const hasMr = data.requirements.length > 0;
  const mrApproved = data.requirements.some((r) => r.status === 'approved' || r.status === 'in_procurement');
  const inProcurement = data.requirements.some((r) => r.status === 'in_procurement');

  return [
    { id: 'planning', label: 'Planning', done: data.milestones.length > 0, tab: 'planning' },
    { id: 'boq', label: 'BOQ', done: data.boq.length > 0, active: data.boq.length === 0, tab: 'boq' },
    { id: 'mr', label: 'Material Req.', done: hasMr, active: data.boq.length > 0 && !hasMr, tab: 'requirements' },
    { id: 'approve', label: 'Approve MR', done: mrApproved, active: hasMr && !mrApproved, tab: 'requirements' },
    { id: 'pr', label: 'Purchase Req.', done: inProcurement || data.prsPending > 0, active: mrApproved && !inProcurement, tab: 'requirements' },
  ];
}
