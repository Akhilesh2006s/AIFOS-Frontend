import { useEffect, useState, useCallback } from 'react';
import { Layers, Plus } from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { CrudTable } from '@/components/ui/CrudTable';
import { Modal } from '@/components/ui/Modal';
import { TextField, FormActions } from '@/components/ui/FormField';
import { moduleApi } from '@/api/client';
import { useContextStore } from '@/store/context';
interface SiteStore {
  _id: string;
  projectId: string;
  siteId: string;
  materialId: string;
  issuedQty: number;
  consumedQty: number;
  balanceQty: number;
  wastageQty: number;
  unit?: string;
}

export function ConsumptionPage() {
  const activeProject = useContextStore((s) => s.activeProject);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [stores, setStores] = useState<SiteStore[]>([]);
  const [usageModal, setUsageModal] = useState(false);
  const [wastageModal, setWastageModal] = useState(false);
  const [usageForm, setUsageForm] = useState({ projectId: '', siteId: 'site-a', materialId: '', quantity: '0', recordedBy: 'Site Engineer' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, projects] = await Promise.all([
      moduleApi.consumption.stats(),
      moduleApi.projects.list(),
    ]);
    setStats(s.data);
    const projectId = activeProject?.id || projects.data[0]?._id;
    if (projectId) {
      const st = await moduleApi.consumption.stores(projectId);
      setStores(st.data);
      setUsageForm((f) => ({ ...f, projectId }));
    }
    setLoading(false);
  }, [activeProject?.id]);
  useEffect(() => { load(); }, [load]);

  const recordUsage = async () => {
    setSaving(true);
    await moduleApi.consumption.recordUsage({ ...usageForm, quantity: Number(usageForm.quantity) });
    setUsageModal(false);
    await load();
    setSaving(false);
  };

  const recordWastage = async () => {
    setSaving(true);
    await moduleApi.consumption.recordWastage({ ...usageForm, quantity: Number(usageForm.quantity) });
    setWastageModal(false);
    await load();
    setSaving(false);
  };

  const linkFromIssue = async () => {
    const issues = await moduleApi.inventory.issues();
    const last = issues.data[0];
    if (last?._id) await moduleApi.consumption.syncFromIssue(last._id);
    await load();
  };
  return (
    <ModulePageLayout
      title="Site Consumption & Reconciliation"
      subtitle="Tracks materials from warehouse issue → site store → daily usage → wastage → cost"
      loading={loading}
      stats={[
        { label: 'Site Stores', value: stats?.siteStores ?? '—', icon: Layers, iconColor: 'text-violet-400' },
        { label: 'Entries', value: stats?.consumptionEntries ?? '—', iconColor: 'text-sky-400' },
        { label: 'Total Wastage', value: stats?.totalWastage ?? '—', iconColor: 'text-red-400' },
      ]}
      heroActions={
        <div className="flex gap-2">
          <button type="button" onClick={linkFromIssue} className="btn-ghost text-sm">Sync from Last Issue</button>
          <button type="button" onClick={() => setWastageModal(true)} className="btn-ghost text-sm">Record Wastage</button>
          <button onClick={() => setUsageModal(true)} className="btn-accent flex items-center gap-2 text-sm">
            <Plus size={16} /> Record Usage
          </button>
        </div>
      }    >
      <div className="command-card mb-4 p-4 text-sm text-slate-400">
        <strong className="text-slate-200">Flow:</strong> Warehouse Issue → Site Store → Engineer receives → Daily usage → Wastage → Reconciliation vs BOQ
      </div>

      <CrudTable
        title="Site Store Balances"
        subtitle="Materials issued from Inventory Cloud — consumption recorded here"
        data={stores}
        columns={[
          { key: 'siteId', label: 'Site' },
          { key: 'materialId', label: 'Material' },
          { key: 'issuedQty', label: 'Issued' },
          { key: 'consumedQty', label: 'Consumed' },
          { key: 'balanceQty', label: 'Balance' },
          { key: 'wastageQty', label: 'Wastage' },
          {
            key: 'variance',
            label: 'Variance',
            render: (_, row) => {
              const v = row.issuedQty - row.consumedQty - row.wastageQty - row.balanceQty;
              return <span className={v === 0 ? 'text-emerald-400' : 'text-amber-400'}>{v}</span>;
            },
          },          { key: 'unit', label: 'Unit' },
        ]}
      />

      <Modal open={wastageModal} onClose={() => setWastageModal(false)} title="Record Wastage">
        <form onSubmit={(e) => { e.preventDefault(); recordWastage(); }} className="space-y-4">
          <TextField label="Material ID" value={usageForm.materialId} onChange={(e) => setUsageForm({ ...usageForm, materialId: e.target.value })} />
          <TextField label="Wastage Qty" value={usageForm.quantity} onChange={(e) => setUsageForm({ ...usageForm, quantity: e.target.value })} />
          <FormActions onCancel={() => setWastageModal(false)} loading={saving} submitLabel="Record Wastage" />
        </form>
      </Modal>

      <Modal open={usageModal} onClose={() => setUsageModal(false)} title="Record Daily Usage">        <form onSubmit={(e) => { e.preventDefault(); recordUsage(); }} className="space-y-4">
          <TextField label="Project ID" value={usageForm.projectId} onChange={(e) => setUsageForm({ ...usageForm, projectId: e.target.value })} />
          <TextField label="Site ID" value={usageForm.siteId} onChange={(e) => setUsageForm({ ...usageForm, siteId: e.target.value })} />
          <TextField label="Material ID" value={usageForm.materialId} onChange={(e) => setUsageForm({ ...usageForm, materialId: e.target.value })} />
          <TextField label="Quantity Used" value={usageForm.quantity} onChange={(e) => setUsageForm({ ...usageForm, quantity: e.target.value })} />
          <FormActions onCancel={() => setUsageModal(false)} loading={saving} submitLabel="Record" />
        </form>
      </Modal>
    </ModulePageLayout>
  );
}
