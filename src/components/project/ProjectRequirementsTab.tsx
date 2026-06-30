import { useState } from 'react';
import { Sparkles, CheckCircle, Send } from 'lucide-react';
import { CrudTable } from '@/components/ui/CrudTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { moduleApi, workflowApi } from '@/api/client';
import { formatCurrency } from '@/lib/utils';

export interface MaterialRequirement {
  _id: string;
  mrNumber: string;
  title: string;
  status: string;
  totalEstimatedCost: number;
}

export function ProjectRequirementsTab({
  projectId,
  requirements,
  onRefresh,
}: {
  projectId: string;
  requirements: MaterialRequirement[];
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const derive = async () => {
    setBusy('derive');
    try {
      await moduleApi.projects.deriveRequirements(projectId);
      onRefresh();
    } finally { setBusy(null); }
  };

  const approve = async (mrId: string) => {
    setBusy(mrId);
    try {
      await moduleApi.projects.approveMr(projectId, mrId);
      onRefresh();
    } finally { setBusy(null); }
  };

  const sendToProcurement = async (mrId: string) => {
    setBusy(`proc-${mrId}`);
    try {
      await workflowApi.sendMrToProcurement(mrId);
      onRefresh();
    } finally { setBusy(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">Auto-generate from BOQ · Approve · Send to Procurement</p>
        <button onClick={derive} disabled={busy === 'derive'} className="btn-accent flex items-center gap-2 text-xs">
          <Sparkles size={14} /> Generate from BOQ
        </button>
      </div>
      <CrudTable
        title="Material Requirements"
        data={requirements}
        columns={[
          { key: 'mrNumber', label: 'MR #' },
          { key: 'title', label: 'Title' },
          { key: 'status', label: 'Status', render: (v) => <StatusBadge status={String(v)} dot /> },
          { key: 'totalEstimatedCost', label: 'Est. cost', render: (v) => formatCurrency(Number(v)) },
          {
            key: '_id',
            label: 'Actions',
            render: (_, row) => {
              const mr = row as MaterialRequirement;
              const id = mr._id;
              if (mr.status === 'in_procurement') {
                return <span className="text-[10px] text-emerald-400">In procurement →</span>;
              }
              return (
                <div className="flex flex-wrap gap-2">
                  {mr.status === 'draft' && (
                    <button
                      onClick={() => approve(id)}
                      disabled={!!busy}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-1 text-[10px] text-emerald-400 hover:bg-emerald-500/25"
                    >
                      <CheckCircle size={12} /> Approve
                    </button>
                  )}
                  {mr.status === 'approved' && (
                    <button
                      onClick={() => sendToProcurement(id)}
                      disabled={!!busy}
                      className="flex items-center gap-1 rounded-lg bg-sky-500/15 px-2 py-1 text-[10px] text-sky-400 hover:bg-sky-500/25"
                    >
                      <Send size={12} /> Create PR
                    </button>
                  )}
                </div>
              );
            },
          },
        ]}
      />
    </div>
  );
}
