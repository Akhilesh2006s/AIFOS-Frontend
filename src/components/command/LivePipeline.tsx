import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PipelineStep {
  key: string;
  label: string;
  status: 'done' | 'active' | 'pending' | 'waiting';
  detail?: string;
}

interface LivePipelineProps {
  steps: PipelineStep[];
}

const statusIcon = {
  done: <CheckCircle2 size={16} className="text-emerald-400" />,
  active: <Loader2 size={16} className="animate-spin text-accent" />,
  pending: <Circle size={16} className="text-amber-400" />,
  waiting: <Circle size={16} className="text-slate-600" />,
};

export function LivePipeline({ steps }: LivePipelineProps) {
  return (
    <div className="command-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Operational Pipeline</h3>
          <p className="text-[11px] text-slate-500">Live status across the operational chain</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Live
        </span>
      </div>

      <div className="flex flex-col gap-0">
        {steps.map((step, i) => (
          <div key={step.key}>
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
                step.status === 'active' && 'bg-accent/10 ring-1 ring-accent/20',
                step.status === 'done' && 'opacity-90',
              )}
            >
              {statusIcon[step.status]}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-200">{step.label}</p>
                {step.detail && (
                  <p className={cn(
                    'text-[10px]',
                    step.status === 'active' ? 'text-accent' : 'text-slate-500',
                  )}>
                    {step.detail}
                  </p>
                )}
              </div>
              {step.status === 'done' && (
                <span className="text-[10px] font-medium text-emerald-400">✓</span>
              )}
            </motion.div>
            {i < steps.length - 1 && (
              <div className="flex justify-start pl-[1.35rem] py-0.5">
                <ArrowDown size={12} className={cn(
                  step.status === 'done' ? 'text-emerald-500/50' : 'text-slate-700',
                )} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function buildPipelineFromFlow(data: {
  boq?: unknown[];
  requirements?: Array<{ status: string }>;
  purchaseRequisitions?: Array<{ status: string }>;
  purchaseOrders?: Array<{ status: string }>;
  grns?: unknown[];
  materialIssues?: unknown[];
  siteStores?: unknown[];
}): PipelineStep[] {
  const hasBoq = (data.boq?.length ?? 0) > 0;
  const hasMr = (data.requirements?.length ?? 0) > 0;
  const prs = data.purchaseRequisitions ?? [];
  const hasPr = prs.length > 0;
  const pendingPr = prs.filter((p) => p.status?.includes('pending')).length;
  const hasRfq = prs.some((p) => ['rfq_open', 'po_created', 'approved'].includes(p.status));
  const hasPo = (data.purchaseOrders?.length ?? 0) > 0;
  const hasGrn = (data.grns?.length ?? 0) > 0;
  const hasIssue = (data.materialIssues?.length ?? 0) > 0;
  const hasConsumption = (data.siteStores?.length ?? 0) > 0;

  const step = (done: boolean, active: boolean): PipelineStep['status'] =>
    done ? 'done' : active ? 'active' : 'waiting';

  return [
    { key: 'project', label: 'Project & BOQ', status: step(hasBoq, !hasBoq), detail: hasBoq ? 'BOQ loaded' : 'Upload BOQ' },
    { key: 'mr', label: 'Material Requirement', status: step(hasMr, hasBoq && !hasMr), detail: hasMr ? 'Requirements derived' : undefined },
    { key: 'pr', label: 'Purchase Requisition', status: step(hasPr && pendingPr === 0, hasMr && !hasPr), detail: pendingPr > 0 ? `${pendingPr} Pending approval` : hasPr ? 'Approved' : undefined },
    { key: 'rfq', label: 'RFQ & Quotes', status: step(hasRfq, hasPr && !hasRfq), detail: hasRfq ? 'Quotes received' : undefined },
    { key: 'po', label: 'Purchase Order', status: step(hasPo, hasRfq && !hasPo), detail: hasPo ? 'PO issued' : 'Waiting' },
    { key: 'grn', label: 'Warehouse / GRN', status: step(hasGrn, hasPo && !hasGrn), detail: hasGrn ? 'Receiving' : undefined },
    { key: 'issue', label: 'Site Issue', status: step(hasIssue, hasGrn && !hasIssue), detail: hasIssue ? 'Issued to site' : undefined },
    { key: 'consumption', label: 'Consumption', status: step(hasConsumption, hasIssue && !hasConsumption), detail: hasConsumption ? 'Tracking usage' : undefined },
  ];
}
