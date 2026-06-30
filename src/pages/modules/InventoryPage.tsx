import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { ModuleTabs } from '@/components/layout/ModuleTabs';
import { CrudTable } from '@/components/ui/CrudTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RowAvatar, ProgressBar, TagList } from '@/components/ui/TableCells';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField, FormActions } from '@/components/ui/FormField';
import { moduleApi, workflowApi } from '@/api/client';
import type { Material, StockMovement } from '@/types/entities';

const TABS = [
  { id: 'materials', label: 'Materials' },
  { id: 'warehouses', label: 'Warehouses' },
  { id: 'grn', label: 'GRN' },
  { id: 'issues', label: 'Issues' },
  { id: 'movements', label: 'Ledger' },
] as const;

const INV_COLOR = '#22C55E';

const emptyMat = { code: '', name: '', category: '', unit: '', reorderLevel: '0' };
const emptyMov = { materialId: '', warehouseId: 'wh-001', type: 'receipt', quantity: '1', reference: '' };

type WarehouseRow = { _id: string; code?: string; name?: string; city?: string; capacity?: number };
type GrnRow = { _id: string; grnNumber?: string; purchaseOrderId?: string; poId?: string; status?: string; receivedQty?: number };
type IssueRow = { _id: string; issueNumber?: string; siteId?: string; materialId?: string; quantity?: number; status?: string };
type PoRow = { _id: string; poNumber?: string; status?: string; lines?: Array<{ materialId?: string; quantity: number; unit: string }> };

export function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'materials';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);
  const [grns, setGrns] = useState<GrnRow[]>([]);
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [pos, setPos] = useState<PoRow[]>([]);
  const [grnModal, setGrnModal] = useState(false);
  const [issueModal, setIssueModal] = useState(false);
  const [grnForm, setGrnForm] = useState({ poId: '', warehouseId: '', materialId: '', acceptedQty: '0', rejectedQty: '0' });
  const [issueForm, setIssueForm] = useState({ warehouseId: '', projectId: 'proj-001', siteId: 'site-a', materialId: '', quantity: '1', issuedTo: '' });
  const [matModal, setMatModal] = useState(false);
  const [movModal, setMovModal] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [matForm, setMatForm] = useState(emptyMat);
  const [movForm, setMovForm] = useState(emptyMov);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, m, mov, wh, g, iss, poList] = await Promise.all([
      moduleApi.inventory.stats(),
      moduleApi.inventory.materials(),
      moduleApi.inventory.movements(),
      moduleApi.inventory.warehouses().catch(() => ({ data: [] })),
      moduleApi.inventory.grns().catch(() => ({ data: [] })),
      moduleApi.inventory.issues().catch(() => ({ data: [] })),
      moduleApi.procurement.pos().catch(() => ({ data: [] })),
    ]);
    setStats(s.data);
    setMaterials(m.data);
    setMovements(mov.data);
    setWarehouses(wh.data);
    setGrns(g.data);
    setIssues(iss.data);
    setPos(poList.data.filter((p: PoRow) => ['issued', 'partial_received', 'approved'].includes(p.status || '')));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...matForm, reorderLevel: Number(matForm.reorderLevel) };
    try {
      if (editing) await moduleApi.inventory.updateMaterial(editing._id, payload);
      else await moduleApi.inventory.createMaterial(payload);
      setMatModal(false);
      await load();
    } finally { setSaving(false); }
  };

  const saveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await moduleApi.inventory.createMovement({ ...movForm, quantity: Number(movForm.quantity) });
      setMovModal(false);
      await load();
    } finally { setSaving(false); }
  };

  const setM = (k: keyof typeof matForm) => (e: React.ChangeEvent<HTMLInputElement>) => setMatForm((f) => ({ ...f, [k]: e.target.value }));
  const setV = (k: keyof typeof movForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setMovForm((f) => ({ ...f, [k]: e.target.value }));
  const setTab = (id: string) => setSearchParams(id === 'materials' ? {} : { tab: id });

  const receiveGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const po = pos.find((p) => p._id === grnForm.poId);
    const line = po?.lines?.[0];
    await moduleApi.inventory.createGrn(grnForm.poId, {
      warehouseId: grnForm.warehouseId || warehouses[0]?._id,
      receivedBy: 'Warehouse Keeper',
      lines: [{
        materialId: grnForm.materialId || line?.materialId || 'mat-001',
        orderedQty: line?.quantity || Number(grnForm.acceptedQty),
        receivedQty: Number(grnForm.acceptedQty) + Number(grnForm.rejectedQty),
        acceptedQty: Number(grnForm.acceptedQty),
        rejectedQty: Number(grnForm.rejectedQty),
        unit: line?.unit || 'units',
      }],
    });
    setGrnModal(false);
    await load();
    setSaving(false);
  };

  const issueMaterials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await workflowApi.issueToSite({
      warehouseId: issueForm.warehouseId || warehouses[0]?._id,
      projectId: issueForm.projectId,
      siteId: issueForm.siteId,
      issuedTo: issueForm.issuedTo || 'Site Engineer',
      lines: [{ materialId: issueForm.materialId || materials[0]?._id, quantity: Number(issueForm.quantity), unit: 'units' }],
    });
    setIssueModal(false);
    await load();
    setSaving(false);
  };

  const stockPct = (m: Material) => Math.min(100, Math.round((Number(m.reorderLevel) || 0) > 0 ? 72 : 45));

  return (
    <ModulePageLayout
      title="Inventory"
      subtitle="Materials, warehouses, goods receipt and site issues"
      loading={loading}
      tabs={<ModuleTabs tabs={TABS} active={tab} onChange={setTab} accent={INV_COLOR} />}
      heroActions={
        <div className="flex gap-2">
          <button onClick={() => { setMovModal(true); setMovForm(emptyMov); }} className="btn-ghost">Stock Movement</button>
          <button onClick={() => { setEditing(null); setMatForm(emptyMat); setMatModal(true); }} className="btn-accent flex items-center gap-2">
            <Plus size={16} /> Add Material
          </button>
        </div>
      }
      stats={[
        { label: 'Materials', value: stats?.totalMaterials ?? '—', color: INV_COLOR, sublabel: 'SKU master' },
        { label: 'Warehouses', value: stats?.warehouses ?? warehouses.length, color: INV_COLOR, progress: 80 },
        { label: 'Low Stock', value: stats?.lowStockAlerts ?? '—', color: '#F97316', sublabel: 'Needs reorder', trend: 'down', change: '-2' },
        { label: 'GRN Pending', value: grns.filter((g) => g.status !== 'completed').length, color: '#38BDF8', sublabel: 'Receiving' },
      ]}
    >
      {tab === 'materials' && (
        <CrudTable
          title="Material Master"
          subtitle={`${materials.length} materials`}
          data={materials}
          onEdit={(r) => {
            setEditing(r);
            setMatForm({ code: r.code, name: r.name, category: r.category || '', unit: r.unit || '', reorderLevel: String(r.reorderLevel) });
            setMatModal(true);
          }}
          onDelete={async (r) => { if (confirm('Delete material?')) { await moduleApi.inventory.deleteMaterial(r._id); load(); } }}
          columns={[
            { key: 'code', label: 'Code', render: (v) => <span className="font-mono text-emerald-400/80">{String(v)}</span> },
            { key: 'name', label: 'Material', render: (v) => <RowAvatar name={String(v)} color={INV_COLOR} /> },
            { key: 'category', label: 'Category', render: (v) => <TagList tags={v ? [String(v)] : []} color={INV_COLOR} /> },
            { key: 'unit', label: 'Unit' },
            {
              key: 'reorderLevel',
              label: 'Stock Level',
              render: (_, row) => <ProgressBar value={stockPct(row)} color={INV_COLOR} />,
            },
            { key: 'status', label: 'Status', render: (v) => <StatusBadge status={String(v)} dot /> },
          ]}
        />
      )}

      {tab === 'warehouses' && (
        <CrudTable
          title="Warehouses"
          subtitle={`${warehouses.length} locations`}
          data={warehouses}
          columns={[
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Warehouse', render: (v) => <RowAvatar name={String(v ?? 'Warehouse')} color={INV_COLOR} /> },
            { key: 'city', label: 'City' },
            { key: 'capacity', label: 'Capacity', render: (v) => <ProgressBar value={Number(v) || 65} color={INV_COLOR} /> },
          ]}
        />
      )}

      {tab === 'grn' && (
        <CrudTable
          title="Goods Receipt Notes"
          subtitle="Receiving against purchase orders"
          data={grns}
          actions={
            <button type="button" onClick={() => setGrnModal(true)} className="btn-accent text-sm">Receive GRN</button>
          }
          columns={[
            { key: 'grnNumber', label: 'GRN #' },
            { key: 'purchaseOrderId', label: 'PO Ref', render: (v, row) => <span className="font-mono text-xs">{String(v ?? row.poId ?? '—')}</span> },
            { key: 'status', label: 'Status', render: (v) => <StatusBadge status={String(v ?? 'pending')} dot /> },
          ]}
        />
      )}

      {tab === 'issues' && (
        <CrudTable
          title="Material Issues"
          subtitle="Issues to project sites"
          data={issues}
          actions={
            <button type="button" onClick={() => setIssueModal(true)} className="btn-accent text-sm">Issue to Site</button>
          }
          columns={[
            { key: 'issueNumber', label: 'Issue #' },
            { key: 'siteId', label: 'Site', render: (v) => <TagList tags={[String(v ?? 'site')]} color="#38BDF8" /> },
            { key: 'status', label: 'Status', render: (v) => <StatusBadge status={String(v ?? 'issued')} dot /> },
          ]}
        />
      )}

      {tab === 'movements' && (
        <CrudTable
          title="Stock Ledger"
          subtitle="Receipts and issues"
          data={movements}
          columns={[
            { key: 'type', label: 'Type', render: (v) => <StatusBadge status={String(v)} /> },
            { key: 'quantity', label: 'Qty', render: (v) => <span className="font-mono">{String(v)}</span> },
            { key: 'balanceAfter', label: 'Balance', render: (v) => <span className="font-mono">{String(v)}</span> },
            { key: 'reference', label: 'Reference' },
          ]}
        />
      )}

      <Modal open={matModal} onClose={() => setMatModal(false)} title={editing ? 'Edit Material' : 'Add Material'}>
        <form onSubmit={saveMaterial} className="space-y-4">
          {!editing && <TextField label="Code" required value={matForm.code} onChange={setM('code')} />}
          <TextField label="Name" required value={matForm.name} onChange={setM('name')} />
          <TextField label="Category" value={matForm.category} onChange={setM('category')} />
          <TextField label="Unit" value={matForm.unit} onChange={setM('unit')} />
          <FormActions onCancel={() => setMatModal(false)} loading={saving} />
        </form>
      </Modal>

      <Modal open={grnModal} onClose={() => setGrnModal(false)} title="Receive Goods (GRN)">
        <form onSubmit={receiveGrn} className="space-y-4">
          <SelectField label="Purchase Order" value={grnForm.poId} onChange={(e) => setGrnForm({ ...grnForm, poId: e.target.value })} required>
            <option value="">Select PO</option>
            {pos.map((p) => <option key={p._id} value={p._id}>{p.poNumber}</option>)}
          </SelectField>
          <SelectField label="Warehouse" value={grnForm.warehouseId} onChange={(e) => setGrnForm({ ...grnForm, warehouseId: e.target.value })}>
            {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </SelectField>
          <TextField label="Accepted Qty" type="number" value={grnForm.acceptedQty} onChange={(e) => setGrnForm({ ...grnForm, acceptedQty: e.target.value })} />
          <TextField label="Rejected Qty" type="number" value={grnForm.rejectedQty} onChange={(e) => setGrnForm({ ...grnForm, rejectedQty: e.target.value })} />
          <FormActions onCancel={() => setGrnModal(false)} loading={saving} submitLabel="Complete GRN" />
        </form>
      </Modal>

      <Modal open={issueModal} onClose={() => setIssueModal(false)} title="Issue Materials to Site">
        <form onSubmit={issueMaterials} className="space-y-4">
          <SelectField label="Warehouse" value={issueForm.warehouseId} onChange={(e) => setIssueForm({ ...issueForm, warehouseId: e.target.value })}>
            {warehouses.map((w) => <option key={w._id} value={w._id}>{w.name}</option>)}
          </SelectField>
          <TextField label="Project ID" value={issueForm.projectId} onChange={(e) => setIssueForm({ ...issueForm, projectId: e.target.value })} />
          <TextField label="Site ID" value={issueForm.siteId} onChange={(e) => setIssueForm({ ...issueForm, siteId: e.target.value })} />
          <TextField label="Material ID" value={issueForm.materialId} onChange={(e) => setIssueForm({ ...issueForm, materialId: e.target.value })} />
          <TextField label="Quantity" type="number" value={issueForm.quantity} onChange={(e) => setIssueForm({ ...issueForm, quantity: e.target.value })} />
          <TextField label="Issued To" value={issueForm.issuedTo} onChange={(e) => setIssueForm({ ...issueForm, issuedTo: e.target.value })} />
          <FormActions onCancel={() => setIssueModal(false)} loading={saving} submitLabel="Issue" />
        </form>
      </Modal>

      <Modal open={movModal} onClose={() => setMovModal(false)} title="Record Stock Movement">
        <form onSubmit={saveMovement} className="space-y-4">
          <TextField label="Material ID" required value={movForm.materialId} onChange={setV('materialId')} />
          <SelectField label="Type" value={movForm.type} onChange={setV('type')}>
            <option value="receipt">Receipt</option>
            <option value="issue">Issue</option>
          </SelectField>
          <TextField label="Quantity" type="number" required value={movForm.quantity} onChange={setV('quantity')} />
          <TextField label="Reference" value={movForm.reference} onChange={setV('reference')} />
          <FormActions onCancel={() => setMovModal(false)} loading={saving} submitLabel="Record" />
        </form>
      </Modal>
    </ModulePageLayout>
  );
}
