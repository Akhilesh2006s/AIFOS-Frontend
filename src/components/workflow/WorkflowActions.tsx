import { useCallback, useEffect, useState } from 'react';
import { Loader2, Zap } from 'lucide-react';
import { LivePipeline, buildPipelineFromFlow } from '@/components/command/LivePipeline';
import { moduleApi, workflowApi } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

export interface PipelineFlow {
  project?: { name?: string };
  sites?: Array<{ _id: string; name: string; code: string }>;
  boq?: unknown[];
  requirements?: Array<{ _id: string; mrNumber?: string; status: string; title?: string }>;
  purchaseRequisitions?: Array<{ _id: string; prNumber?: string; status: string; items?: Array<{ materialId: string; quantity: number; unit: string; estimatedCost?: number }> }>;
  purchaseOrders?: Array<{ _id: string; poNumber?: string; status: string; lines?: Array<{ materialId: string; quantity: number; unit: string; orderedQty?: number }> }>;
  grns?: unknown[];
  materialIssues?: unknown[];
  siteStores?: unknown[];
}

interface WorkflowActionsProps {
  projectId: string;
  onRefresh?: () => void;
}

type ActionDef = {
  id: string;
  label: string;
  description: string;
  stepKey: string;
  run: () => Promise<void>;
};

export function WorkflowActions({ projectId, onRefresh }: WorkflowActionsProps) {
  const { user } = useAuthStore();
  const [flow, setFlow] = useState<PipelineFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workflowApi.pipeline(projectId);
      setFlow(res.data);
    } catch {
      setFlow(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { reload(); }, [reload]);

  const approver = user?.name || 'AFIOS Admin';

  const runAction = async (id: string, fn: () => Promise<void>) => {
    setRunning(id);
    setMessage(null);
    try {
      await fn();
      setMessage('Step completed successfully');
      await reload();
      onRefresh?.();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setMessage(msg || 'Action failed — check prerequisites');
    } finally {
      setRunning(null);
    }
  };

  if (loading) {
    return (
      <div className="command-card flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" /> Loading operational pipeline…
      </div>
    );
  }

  if (!flow) return null;

  const steps = buildPipelineFromFlow(flow);
  const actions = buildActions(flow, projectId, approver, reload);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <LivePipeline steps={steps} />
      <div className="command-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Zap size={16} className="text-accent" />
          <div>
            <h3 className="text-sm font-semibold text-white">Workflow Actions</h3>
            <p className="text-[11px] text-slate-500">Advance the operational chain for this project</p>
          </div>
        </div>

        {message && (
          <p className={cn(
            'mb-3 rounded-lg px-3 py-2 text-xs',
            message.includes('failed') || message.includes('check')
              ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
              : 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
          )}>
            {message}
          </p>
        )}

        <div className="space-y-2">
          {actions.length === 0 ? (
            <p className="rounded-xl bg-white/[0.03] px-4 py-6 text-center text-sm text-slate-500">
              Operational chain complete for this project ✓
            </p>
          ) : (
            actions.map((action) => {
              const step = steps.find((s) => s.key === action.stepKey);
              const isActive = step?.status === 'active' || step?.status === 'pending';
              return (
                <button
                  key={action.id}
                  disabled={!!running}
                  onClick={() => runAction(action.id, action.run)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                    isActive
                      ? 'border-accent/30 bg-accent/10 hover:bg-accent/15'
                      : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]',
                    running === action.id && 'opacity-70',
                  )}
                >
                  <div className="mt-0.5">
                    {running === action.id ? (
                      <Loader2 size={16} className="animate-spin text-accent" />
                    ) : (
                      <span className={cn('flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold', isActive ? 'bg-accent/20 text-accent' : 'bg-white/5 text-slate-500')}>
                        →
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200">{action.label}</p>
                    <p className="text-[10px] text-slate-500">{action.description}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function buildActions(
  flow: PipelineFlow,
  projectId: string,
  approver: string,
  reload: () => Promise<void>,
): ActionDef[] {
  const actions: ActionDef[] = [];
  const boq = flow.boq ?? [];
  const mrs = flow.requirements ?? [];
  const prs = flow.purchaseRequisitions ?? [];
  const pos = flow.purchaseOrders ?? [];
  const grns = flow.grns ?? [];
  const issues = flow.materialIssues ?? [];

  const approvedMrs = mrs.filter((m) => m.status === 'approved');
  const pendingPrs = prs.filter((p) => p.status?.includes('pending') || p.status === 'pending_l1' || p.status === 'pending_l2');
  const approvedPrs = prs.filter((p) => p.status === 'approved');
  const rfqOpenPrs = prs.filter((p) => p.status === 'rfq_open');
  const openPos = pos.filter((p) => !['received', 'closed'].includes(p.status));
  const sites = flow.sites ?? [];

  if (boq.length > 0 && mrs.length === 0) {
    actions.push({
      id: 'derive-mr',
      label: 'Derive Material Requirements',
      description: 'Generate MR from BOQ material lines',
      stepKey: 'mr',
      run: async () => {
        await moduleApi.projects.deriveRequirements(projectId, approver);
      },
    });
  }

  for (const mr of approvedMrs) {
    actions.push({
      id: `send-mr-${mr._id}`,
      label: `Create PR from ${mr.mrNumber || 'MR'}`,
      description: 'Approved MR → purchase requisition (Supply Chain)',
      stepKey: 'pr',
      run: async () => {
        await workflowApi.sendMrToProcurement(mr._id);
      },
    });
  }

  for (const pr of pendingPrs) {
    actions.push({
      id: `approve-pr-${pr._id}`,
      label: `Approve ${pr.prNumber || 'PR'} & Open RFQ`,
      description: 'L1 + L2 approval and send RFQ to vendors',
      stepKey: 'rfq',
      run: async () => {
        const vendors = await moduleApi.procurement.vendors();
        const vendorIds = vendors.data.slice(0, 3).map((v: { _id: string }) => v._id);
        await workflowApi.approveAndRfq(pr._id, { approvedBy: approver, level: 1, vendorIds });
        await workflowApi.approveAndRfq(pr._id, { approvedBy: approver, level: 2, vendorIds });
      },
    });
  }

  for (const pr of approvedPrs) {
    actions.push({
      id: `rfq-pr-${pr._id}`,
      label: `Create RFQ for ${pr.prNumber || 'PR'}`,
      description: 'Send request for quotation to registered vendors',
      stepKey: 'rfq',
      run: async () => {
        const vendors = await moduleApi.procurement.vendors();
        const vendorIds = vendors.data.slice(0, 3).map((v: { _id: string }) => v._id);
        await moduleApi.procurement.createRfq(pr._id, { vendorIds });
        await reload();
      },
    });
  }

  if (rfqOpenPrs.length > 0) {
    actions.push({
      id: 'award-po',
      label: 'Collect Quotes & Award PO',
      description: 'Submit vendor quotes and award lowest bid',
      stepKey: 'po',
      run: async () => {
        const rfqs = await moduleApi.procurement.rfqs();
        const projectRfqs = rfqs.data.filter((r: { projectId?: string; status?: string }) =>
          r.projectId === projectId && ['sent', 'quotes_received'].includes(r.status || ''),
        );
        if (!projectRfqs.length) throw new Error('No open RFQ found');

        const rfq = projectRfqs[0];
        const pr = prs.find((p) => p._id) || pendingPrs[0] || approvedPrs[0];
        const vendors = await moduleApi.procurement.vendors();
        const lines = (pr?.items || []).map((i) => ({
          materialId: i.materialId || 'mat-001',
          description: 'Material line',
          quantity: i.quantity,
          unit: i.unit,
          unitRate: (i.estimatedCost || 1000) / (i.quantity || 1),
          gstPercent: 18,
        }));

        for (const v of vendors.data.slice(0, 2)) {
          await moduleApi.procurement.submitQuotation(rfq._id, { vendorId: v._id, lines });
        }

        const compare = await moduleApi.procurement.compareQuotations(rfq._id);
        const winner = compare.data.winner?._id || compare.data.quotations?.[0]?.quotation?._id;
        if (!winner) throw new Error('No quotations received');
        await workflowApi.awardPO(rfq._id, winner);
      },
    });
  }

  for (const po of openPos) {
    if (grns.length === 0 || !grns.some((g) => (g as { poId?: string }).poId === po._id)) {
      actions.push({
        id: `grn-${po._id}`,
        label: `Receive GRN for ${po.poNumber || 'PO'}`,
        description: 'Record goods receipt at warehouse',
        stepKey: 'grn',
        run: async () => {
          const wh = await moduleApi.inventory.warehouses();
          const warehouseId = wh.data[0]?._id;
          if (!warehouseId) throw new Error('No warehouse configured');

          const lines = (po.lines || [{ materialId: 'mat-001', quantity: 100, unit: 'bags' }]).map((l) => ({
            materialId: l.materialId,
            orderedQty: l.quantity,
            receivedQty: l.quantity,
            acceptedQty: l.quantity,
            rejectedQty: 0,
            unit: l.unit,
          }));

          await workflowApi.receiveGoods(po._id, { warehouseId, receivedBy: approver, lines });
        },
      });
    }
  }

  if (grns.length > 0 && issues.length === 0 && sites.length > 0) {
    const po = pos[0];
    actions.push({
      id: 'issue-site',
      label: 'Issue Materials to Site',
      description: 'Transfer stock from warehouse to project site',
      stepKey: 'issue',
      run: async () => {
        const wh = await moduleApi.inventory.warehouses();
        const warehouseId = wh.data[0]?._id;
        const siteId = sites[0]._id;
        const lines = (po?.lines || [{ materialId: 'mat-001', quantity: 50, unit: 'bags' }]).map((l) => ({
          materialId: l.materialId,
          quantity: Math.min(l.quantity, 50),
          unit: l.unit,
        }));

        await workflowApi.issueToSite({ warehouseId, projectId, siteId, issuedTo: approver, lines });
      },
    });
  }

  return actions;
}
