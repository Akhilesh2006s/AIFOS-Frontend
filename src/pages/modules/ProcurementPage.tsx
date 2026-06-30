import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Send, Check, X, RotateCcw } from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { ModuleTabs } from '@/components/layout/ModuleTabs';
import { CrudTable } from '@/components/ui/CrudTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RowAvatar, PriorityTag } from '@/components/ui/TableCells';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField, FormActions } from '@/components/ui/FormField';
import { QuotationCompare } from '@/components/supply-chain/QuotationCompare';
import { moduleApi } from '@/api/client';
import { useContextStore } from '@/store/context';
import { formatCurrency } from '@/lib/utils';
import type { PurchaseRequest, Vendor } from '@/types/entities';

const TABS = [
  { id: 'pr', label: 'Purchase Requisitions' },
  { id: 'rfq', label: 'RFQ' },
  { id: 'compare', label: 'Compare' },
  { id: 'po', label: 'Purchase Orders' },
] as const;

const PROC_COLOR = '#EAB308';
const ACTOR = 'Procurement Manager';

const emptyPR = {
  title: '',
  projectId: 'proj-001',
  requestedBy: ACTOR,
  description: '',
  priority: 'medium',
  requiredDate: '',
  materialRequirementId: '',
};

type RfqRow = { _id: string; rfqNumber?: string; purchaseRequisitionId?: string; status?: string; vendorIds?: string[]; closingDate?: string };
type PoRow = { _id: string; poNumber?: string; vendorId?: string; status?: string; totalAmount?: number };

export function ProcurementPage() {
  const activeProject = useContextStore((s) => s.activeProject);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'pr';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [prs, setPrs] = useState<PurchaseRequest[]>([]);
  const [rfqs, setRfqs] = useState<RfqRow[]>([]);
  const [pos, setPos] = useState<PoRow[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
  const [selectedRfq, setSelectedRfq] = useState<string | null>(null);
  const [prModal, setPrModal] = useState(false);
  const [rfqModal, setRfqModal] = useState(false);
  const [rfqPrId, setRfqPrId] = useState('');
  const [rfqVendors, setRfqVendors] = useState<string[]>([]);
  const [prForm, setPrForm] = useState(emptyPR);
  const [saving, setSaving] = useState(false);

  const projectId = activeProject?.id;

  const load = useCallback(async () => {
    setLoading(true);
    const [s, p, r, po, v] = await Promise.all([
      moduleApi.procurement.stats(),
      moduleApi.procurement.prs(projectId),
      moduleApi.procurement.rfqs(projectId).catch(() => ({ data: [] })),
      moduleApi.procurement.pos(projectId).catch(() => ({ data: [] })),
      moduleApi.procurement.vendors(),
    ]);
    setStats(s.data);
    setPrs(p.data);
    setRfqs(r.data);
    setPos(po.data);
    setVendors(v.data);
    if (!selectedRfq && r.data[0]?._id) setSelectedRfq(r.data[0]._id);
    setLoading(false);
  }, [projectId, selectedRfq]);

  useEffect(() => { load(); }, [load]);

  const savePR = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await moduleApi.procurement.createPR({
        ...prForm,
        projectId: projectId || prForm.projectId,
        requiredDate: prForm.requiredDate || undefined,
        items: [{ materialId: 'mat-001', quantity: 1, unit: 'units', estimatedCost: 0 }],
        budgetCheckPassed: true,
      });
      setPrModal(false);
      setPrForm(emptyPR);
      await load();
    } finally { setSaving(false); }
  };

  const submitPR = async (pr: PurchaseRequest) => {
    await moduleApi.procurement.submitPR(pr._id, ACTOR);
    await load();
  };

  const approvePR = async (pr: PurchaseRequest, level: number) => {
    await moduleApi.procurement.approvePR(pr._id, { approvedBy: ACTOR, level });
    await load();
  };

  const rejectPR = async (pr: PurchaseRequest) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    await moduleApi.procurement.rejectPR(pr._id, { rejectedBy: ACTOR, reason });
    await load();
  };

  const revisePR = async (pr: PurchaseRequest) => {
    await moduleApi.procurement.revisePR(pr._id, ACTOR);
    await load();
  };

  const createRfq = async () => {
    if (!rfqPrId || !rfqVendors.length) return;
    setSaving(true);
    await moduleApi.procurement.createRfq(rfqPrId, { vendorIds: rfqVendors });
    setRfqModal(false);
    await load();
    setSaving(false);
    setTab('rfq');
  };

  const publishRfq = async (id: string) => {
    await moduleApi.procurement.publishRfq(id);
    await load();
  };

  const awardVendor = async (quotationId: string) => {
    if (!selectedRfq) return;
    await moduleApi.procurement.awardQuotation(selectedRfq, quotationId, ACTOR);
    await load();
    setTab('po');
  };

  const poAction = async (po: PoRow, action: 'approve' | 'issue') => {
    if (action === 'approve') await moduleApi.procurement.approvePO(po._id, ACTOR);
    else await moduleApi.procurement.issuePO(po._id, ACTOR);
    await load();
  };

  const setTab = (id: string) => setSearchParams(id === 'pr' ? {} : { tab: id });
  const vendorName = (id?: string) => vendors.find((v) => v._id === id)?.name || id?.slice(-6) || '—';

  return (
    <ModulePageLayout
      title="Procurement"
      subtitle="End-to-end PR → RFQ → Compare → Award → PO within Supply Chain"
      loading={loading}
      tabs={<ModuleTabs tabs={TABS} active={tab} onChange={setTab} accent={PROC_COLOR} />}
      heroActions={
        <button onClick={() => { setPrForm({ ...emptyPR, projectId: projectId || 'proj-001' }); setPrModal(true); }} className="btn-accent flex items-center gap-2">
          <Plus size={16} /> New PR
        </button>
      }
      stats={[
        { label: 'Pending PR', value: stats?.pendingPRs ?? '—', color: PROC_COLOR },
        { label: 'Open RFQ', value: stats?.openRfqs ?? '—', color: '#F97316' },
        { label: 'PO Awaiting', value: stats?.poAwaiting ?? '—', color: '#A855F7' },
        { label: 'Active PO', value: stats?.activePos ?? '—', color: '#22C55E' },
      ]}
    >
      {tab === 'pr' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CrudTable
              title="Purchase Requisitions"
              subtitle={`${prs.length} requisitions`}
              data={prs}
              onEdit={(r) => setSelectedPR(r)}
              columns={[
                { key: 'prNumber', label: 'PR #', render: (v) => <span className="font-mono text-yellow-400/90">{String(v)}</span> },
                { key: 'title', label: 'Request', render: (v) => <RowAvatar name={String(v)} color={PROC_COLOR} /> },
                { key: 'status', label: 'Status', render: (v) => <StatusBadge status={String(v)} dot /> },
                { key: 'priority', label: 'Priority', render: (v) => <PriorityTag priority={String(v || 'medium') as 'high' | 'medium' | 'low'} /> },
                { key: 'totalEstimatedCost', label: 'Est. Cost', render: (v) => <span className="font-mono">{formatCurrency(Number(v))}</span> },
              ]}
            />
          </div>
          {selectedPR && (
            <PRDetailPanel
              pr={selectedPR}
              onSubmit={() => submitPR(selectedPR)}
              onApprove={(level) => approvePR(selectedPR, level)}
              onReject={() => rejectPR(selectedPR)}
              onRevise={() => revisePR(selectedPR)}
              onCreateRfq={() => { setRfqPrId(selectedPR._id); setRfqModal(true); }}
            />
          )}
        </div>
      )}

      {tab === 'rfq' && (
        <CrudTable
          title="Request for Quotation"
          data={rfqs}
          columns={[
            { key: 'rfqNumber', label: 'RFQ #', render: (v) => <span className="font-mono">{String(v)}</span> },
            { key: 'purchaseRequisitionId', label: 'Linked PR', render: (v) => <span className="font-mono text-xs">{String(v).slice(-8)}</span> },
            { key: 'vendorIds', label: 'Vendors', render: (v) => <span>{Array.isArray(v) ? v.length : 0} invited</span> },
            { key: 'status', label: 'Status', render: (v, row) => (
              <div className="flex items-center gap-2">
                <StatusBadge status={String(v)} dot />
                {row.status === 'draft' && (
                  <button type="button" onClick={() => publishRfq(row._id)} className="text-xs text-emerald-400 hover:underline">Publish</button>
                )}
                <button type="button" onClick={() => { setSelectedRfq(row._id); setTab('compare'); }} className="text-xs text-yellow-400 hover:underline">Compare</button>
              </div>
            )},
          ]}
        />
      )}

      {tab === 'compare' && (
        <div className="space-y-4">
          <SelectField label="Select RFQ" value={selectedRfq || ''} onChange={(e) => setSelectedRfq(e.target.value)}>
            <option value="">—</option>
            {rfqs.map((r) => <option key={r._id} value={r._id}>{r.rfqNumber}</option>)}
          </SelectField>
          {selectedRfq && <QuotationCompare rfqId={selectedRfq} vendors={vendors} onAward={awardVendor} />}
        </div>
      )}

      {tab === 'po' && (
        <CrudTable
          title="Purchase Orders"
          data={pos}
          columns={[
            { key: 'poNumber', label: 'PO #', render: (v) => <span className="font-mono text-yellow-400/90">{String(v)}</span> },
            { key: 'vendorId', label: 'Vendor', render: (v) => <RowAvatar name={vendorName(String(v))} color="#22C55E" /> },
            { key: 'status', label: 'Status', render: (v, row) => (
              <div className="flex items-center gap-2">
                <StatusBadge status={String(v)} dot />
                {row.status === 'draft' && <button type="button" onClick={() => poAction(row, 'approve')} className="text-xs text-emerald-400">Approve</button>}
                {row.status === 'approved' && <button type="button" onClick={() => poAction(row, 'issue')} className="text-xs text-yellow-400">Issue</button>}
              </div>
            )},
            { key: 'totalAmount', label: 'Amount', render: (v) => <span className="font-mono">{formatCurrency(Number(v))}</span> },
          ]}
        />
      )}

      <Modal open={prModal} onClose={() => setPrModal(false)} title="New Purchase Requisition">
        <form onSubmit={savePR} className="space-y-4">
          <TextField label="Title" required value={prForm.title} onChange={(e) => setPrForm({ ...prForm, title: e.target.value })} />
          <TextField label="Material Requirement ID" value={prForm.materialRequirementId} onChange={(e) => setPrForm({ ...prForm, materialRequirementId: e.target.value })} />
          <SelectField label="Priority" value={prForm.priority} onChange={(e) => setPrForm({ ...prForm, priority: e.target.value })}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
          </SelectField>
          <TextField label="Required Date" type="date" value={prForm.requiredDate} onChange={(e) => setPrForm({ ...prForm, requiredDate: e.target.value })} />
          <FormActions onCancel={() => setPrModal(false)} loading={saving} />
        </form>
      </Modal>

      <Modal open={rfqModal} onClose={() => setRfqModal(false)} title="Create RFQ">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">Invite vendors for approved PR</p>
          {vendors.map((v) => (
            <label key={v._id} className="flex items-center gap-2 text-sm text-white">
              <input
                type="checkbox"
                checked={rfqVendors.includes(v._id)}
                onChange={(e) => setRfqVendors(e.target.checked ? [...rfqVendors, v._id] : rfqVendors.filter((id) => id !== v._id))}
              />
              {v.name}
            </label>
          ))}
          <div className="mt-6 flex justify-end gap-3 border-t border-border/50 pt-5">
            <button type="button" onClick={() => setRfqModal(false)} className="btn-ghost">Cancel</button>
            <button type="button" onClick={createRfq} disabled={saving} className="btn-primary">{saving ? 'Creating…' : 'Create RFQ'}</button>
          </div>
        </div>
      </Modal>
    </ModulePageLayout>
  );
}

function PRDetailPanel({
  pr,
  onSubmit,
  onApprove,
  onReject,
  onRevise,
  onCreateRfq,
}: {
  pr: PurchaseRequest & {
    materialRequirementId?: string;
    requiredDate?: string;
    budgetCheckPassed?: boolean;
    statusHistory?: Array<{ action: string; at: string; toStatus?: string; remarks?: string }>;
    approvalTrail?: Array<{ level: number; role: string; status: string }>;
  };
  onSubmit: () => void;
  onApprove: (level: number) => void;
  onReject: () => void;
  onRevise: () => void;
  onCreateRfq: () => void;
}) {
  return (
    <div className="command-card space-y-4 p-5">
      <h3 className="font-semibold text-white">{pr.prNumber}</h3>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-slate-500">Project</dt><dd>{pr.projectId}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Material Req.</dt><dd>{pr.materialRequirementId || '—'}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Requested By</dt><dd>{pr.requestedBy}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Required Date</dt><dd>{pr.requiredDate ? new Date(pr.requiredDate).toLocaleDateString() : '—'}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Priority</dt><dd><PriorityTag priority={((pr as { priority?: string }).priority || 'medium') as 'high' | 'medium' | 'low'} /></dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Budget Check</dt><dd className={pr.budgetCheckPassed !== false ? 'text-emerald-400' : 'text-red-400'}>{pr.budgetCheckPassed !== false ? 'Passed' : 'Failed'}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd><StatusBadge status={pr.status} dot /></dd></div>
      </dl>

      <div className="flex flex-wrap gap-2">
        {['draft', 'rejected', 'revision_required'].includes(pr.status) && (
          <ActionBtn icon={Send} label="Submit" onClick={onSubmit} color="emerald" />
        )}
        {pr.status === 'pending_l1' && <ActionBtn icon={Check} label="L1 Approve" onClick={() => onApprove(1)} color="emerald" />}
        {pr.status === 'pending_l2' && <ActionBtn icon={Check} label="L2 Approve" onClick={() => onApprove(2)} color="emerald" />}
        {['pending_l1', 'pending_l2'].includes(pr.status) && <ActionBtn icon={X} label="Reject" onClick={onReject} color="red" />}
        {pr.status === 'rejected' && <ActionBtn icon={RotateCcw} label="Revise" onClick={onRevise} color="yellow" />}
        {pr.status === 'approved' && <ActionBtn icon={Plus} label="Create RFQ" onClick={onCreateRfq} color="yellow" />}
      </div>

      {pr.statusHistory && pr.statusHistory.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase text-slate-500">Audit Timeline</h4>
          <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-xs">
            {[...pr.statusHistory].reverse().map((h, i) => (
              <li key={i} className="border-l-2 border-yellow-500/30 pl-3 text-slate-400">
                <span className="text-white">{h.action}</span> → {h.toStatus}
                {h.remarks && <span className="block text-slate-500">{h.remarks}</span>}
                <span className="block text-slate-600">{h.at ? new Date(h.at).toLocaleString() : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, color }: { icon: typeof Send; label: string; onClick: () => void; color: string }) {
  const cls = { emerald: 'bg-emerald-600 hover:bg-emerald-500', red: 'bg-red-600/80 hover:bg-red-500', yellow: 'bg-yellow-600 hover:bg-yellow-500' };
  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white ${cls[color as keyof typeof cls]}`}>
      <Icon size={12} /> {label}
    </button>
  );
}
