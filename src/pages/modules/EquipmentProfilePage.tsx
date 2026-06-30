import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Fuel, Wrench, IndianRupee } from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { ModuleTabs } from '@/components/layout/ModuleTabs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/TableCells';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField, FormActions } from '@/components/ui/FormField';
import { moduleApi } from '@/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';

const ASSET_COLOR = '#1F4E79';
const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'fuel', label: 'Fuel' },
  { id: 'hours', label: 'Engine Hours' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'operator', label: 'Operator' },
  { id: 'cost', label: 'Cost' },
  { id: 'timeline', label: 'Timeline' },
] as const;

interface Equipment {
  _id: string;
  code: string;
  name: string;
  category?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  status: string;
  currentProjectId?: string;
  currentSiteId?: string;
  assignedOperatorName?: string;
  engineHours: number;
  utilizationPercent: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  costPerHour: number;
  purchaseCost?: number;
  purchaseDate?: string;
}

export function EquipmentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    equipment: Equipment;
    fuelEntries: Array<Record<string, unknown>>;
    hoursEntries: Array<Record<string, unknown>>;
    timeline: Array<{ eventType: string; title: string; description?: string; eventDate: string; actor?: string }>;
    fuelStats: { monthlyQuantity: number; monthlyCost: number; fuelEfficiency: number };
    hoursTrend: Array<{ dailyHours: number; runningHours: number; idleHours: number }>;
  } | null>(null);
  const [compliance, setCompliance] = useState<Array<Record<string, unknown>>>([]);
  const [workOrders, setWorkOrders] = useState<Array<Record<string, unknown>>>([]);
  const [operators, setOperators] = useState<Array<{ _id: string; name: string }>>([]);
  const [fuelModal, setFuelModal] = useState(false);
  const [hoursModal, setHoursModal] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [breakdownModal, setBreakdownModal] = useState(false);
  const [fuelForm, setFuelForm] = useState({ quantity: '0', cost: '0', filledBy: 'Equipment Manager', siteId: '', remarks: '' });
  const [hoursForm, setHoursForm] = useState({ openingHours: '0', closingHours: '0', idleHours: '0', recordedBy: 'Operator' });
  const [transferForm, setTransferForm] = useState({ projectId: 'proj-001', siteId: '', transferredBy: 'Equipment Manager' });
  const [breakdownForm, setBreakdownForm] = useState({ title: '', description: '', reportedBy: 'Equipment Manager' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [p, comp, wo, ops] = await Promise.all([
      moduleApi.equipment.profile(id),
      moduleApi.compliance.records(id),
      moduleApi.maintenance.workOrders(id),
      moduleApi.equipment.operators(),
    ]);
    setProfile(p.data);
    setCompliance(comp.data);
    setWorkOrders(wo.data);
    setOperators(ops.data);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const eq = profile?.equipment;
  const setTab = (t: string) => setSearchParams(t === 'overview' ? {} : { tab: t });

  const recordFuel = async () => {
    if (!id) return;
    setSaving(true);
    await moduleApi.equipment.recordFuel(id, {
      ...fuelForm,
      quantity: Number(fuelForm.quantity),
      cost: Number(fuelForm.cost),
      odometerOrHours: eq?.engineHours,
    });
    setFuelModal(false);
    await load();
    setSaving(false);
  };

  const recordHours = async () => {
    if (!id) return;
    setSaving(true);
    await moduleApi.equipment.recordHours(id, {
      ...hoursForm,
      openingHours: Number(hoursForm.openingHours),
      closingHours: Number(hoursForm.closingHours),
      idleHours: Number(hoursForm.idleHours),
      siteId: eq?.currentSiteId,
    });
    setHoursModal(false);
    await load();
    setSaving(false);
  };

  const transfer = async () => {
    if (!id) return;
    setSaving(true);
    await moduleApi.equipment.transfer(id, transferForm);
    setTransferModal(false);
    await load();
    setSaving(false);
  };

  const reportBreakdown = async () => {
    if (!id) return;
    setSaving(true);
    await moduleApi.maintenance.createBreakdown({ equipmentId: id, ...breakdownForm });
    setBreakdownModal(false);
    await load();
    setSaving(false);
  };

  const completeService = async (woId: string) => {
    await moduleApi.maintenance.complete(woId, { completedBy: 'Equipment Manager' });
    await load();
  };

  if (!eq && !loading) return <div className="p-8 text-center text-slate-500">Equipment not found</div>;

  return (
    <ModulePageLayout
      title={eq?.name || 'Equipment Profile'}
      subtitle={eq ? `${eq.code} · ${eq.category} · ${eq.manufacturer || ''} ${eq.model || ''}` : ''}
      loading={loading}
      tabs={<ModuleTabs tabs={TABS} active={tab} onChange={setTab} accent={ASSET_COLOR} />}
      heroActions={
        <button type="button" onClick={() => navigate('/equipment')} className="btn-ghost flex items-center gap-2 text-sm">
          <ArrowLeft size={16} /> Registry
        </button>
      }
      stats={eq ? [
        { label: 'Status', value: eq.status, color: ASSET_COLOR },
        { label: 'Engine Hours', value: eq.engineHours, color: '#3B82F6' },
        { label: 'Utilization', value: `${eq.utilizationPercent}%`, color: '#22C55E', progress: eq.utilizationPercent },
        { label: 'Cost / Hour', value: formatCurrency(eq.costPerHour), color: '#EAB308' },
      ] : []}
    >
      {tab === 'overview' && eq && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="command-card space-y-3 p-5 lg:col-span-2">
            <h3 className="font-semibold text-white">Machine Identity</h3>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <Item label="Serial #" value={eq.serialNumber} />
              <Item label="Project" value={eq.currentProjectId} />
              <Item label="Site" value={eq.currentSiteId} />
              <Item label="Operator" value={eq.assignedOperatorName} />
              <Item label="Purchase Date" value={eq.purchaseDate ? formatDate(eq.purchaseDate) : '—'} />
              <Item label="Purchase Cost" value={eq.purchaseCost ? formatCurrency(eq.purchaseCost) : '—'} />
            </dl>
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="button" onClick={() => setTransferModal(true)} className="btn-accent text-xs">Transfer</button>
              <button type="button" onClick={() => setFuelModal(true)} className="btn-ghost text-xs">Record Fuel</button>
              <button type="button" onClick={() => setHoursModal(true)} className="btn-ghost text-xs">Record Hours</button>
              <button type="button" onClick={() => setBreakdownModal(true)} className="btn-ghost text-xs text-red-400">Report Breakdown</button>
            </div>
          </div>
          <div className="command-card p-5">
            <h3 className="font-semibold text-white">Health</h3>
            <div className="mt-4 space-y-3">
              <div><p className="text-xs text-slate-500">Utilization</p><ProgressBar value={eq.utilizationPercent} color={ASSET_COLOR} /></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Monthly fuel</span><span>{formatCurrency(profile?.fuelStats.monthlyCost || 0)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Efficiency</span><span>{profile?.fuelStats.fuelEfficiency || 0} hrs/L</span></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'maintenance' && (
        <div className="space-y-4">
          {workOrders.map((wo) => (
            <div key={String(wo._id)} className="command-card flex items-center justify-between p-4">
              <div>
                <p className="font-mono text-sky-400">{String(wo.woNumber)}</p>
                <p className="text-white">{String(wo.title)}</p>
                <StatusBadge status={String(wo.status)} dot />
              </div>
              {wo.status !== 'completed' && (
                <button type="button" onClick={() => completeService(String(wo._id))} className="text-xs text-emerald-400 hover:underline">Complete Service</button>
              )}
            </div>
          ))}
          {!workOrders.length && <p className="text-slate-500">No maintenance records</p>}
        </div>
      )}

      {tab === 'fuel' && (
        <div className="command-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-white/[0.03] text-left text-slate-500"><th className="p-3">Date</th><th className="p-3">Qty</th><th className="p-3">Cost</th><th className="p-3">Filled By</th></tr></thead>
            <tbody>
              {(profile?.fuelEntries || []).map((f, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="p-3">{f.entryDate ? formatDate(String(f.entryDate)) : '—'}</td>
                  <td className="p-3 font-mono">{String(f.quantity)} L</td>
                  <td className="p-3 font-mono">{formatCurrency(Number(f.cost))}</td>
                  <td className="p-3">{String(f.filledBy || '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'hours' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="command-card p-5">
            <h3 className="mb-4 font-semibold text-white">Recent Entries</h3>
            {(profile?.hoursEntries || []).map((h, i) => (
              <div key={i} className="border-b border-white/5 py-2 text-sm">
                <span className="text-white">{String(h.runningHours)}h running</span>
                <span className="text-slate-500"> · {String(h.idleHours)}h idle</span>
              </div>
            ))}
          </div>
          <div className="command-card p-5">
            <h3 className="mb-4 font-semibold text-white">Utilization Trend</h3>
            <div className="flex h-32 items-end gap-2">
              {(profile?.hoursTrend || []).map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-sky-500/60" style={{ height: `${Math.max(10, (h.runningHours / Math.max(1, h.dailyHours)) * 100)}%` }} title={`${h.runningHours}h`} />
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'compliance' && (
        <div className="space-y-2">
          {compliance.map((c) => (
            <div key={String(c._id)} className="command-card flex justify-between p-4 text-sm">
              <span className="text-white">{String(c.documentType)}</span>
              <StatusBadge status={String(c.alertTier || c.status)} dot />
            </div>
          ))}
        </div>
      )}

      {tab === 'operator' && eq && (
        <div className="command-card p-5">
          <p className="text-lg text-white">{eq.assignedOperatorName || 'No operator assigned'}</p>
          <SelectField label="Assign Operator" value="" onChange={async (e) => {
            if (!id || !e.target.value) return;
            const op = operators.find((o) => o._id === e.target.value);
            await moduleApi.equipment.assignOperator(id, { operatorId: e.target.value, operatorName: op?.name });
            await load();
          }}>
            <option value="">Select operator</option>
            {operators.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}
          </SelectField>
        </div>
      )}

      {tab === 'cost' && eq && (
        <div className="grid gap-4 sm:grid-cols-3">
          <CostCard icon={Fuel} label="Fuel Cost" value={formatCurrency(eq.totalFuelCost)} />
          <CostCard icon={Wrench} label="Maintenance" value={formatCurrency(eq.totalMaintenanceCost)} />
          <CostCard icon={IndianRupee} label="Cost / Hour" value={formatCurrency(eq.costPerHour)} />
        </div>
      )}

      {tab === 'timeline' && (
        <div className="relative ml-4 border-l border-sky-500/30 pl-6">
          {(profile?.timeline || []).map((ev, i) => (
            <div key={i} className="relative mb-6">
              <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-sky-500" />
              <p className="text-xs uppercase text-sky-400/80">{ev.eventType}</p>
              <p className="font-medium text-white">{ev.title}</p>
              {ev.description && <p className="text-sm text-slate-500">{ev.description}</p>}
              <p className="text-xs text-slate-600">{formatDate(ev.eventDate)} {ev.actor && `· ${ev.actor}`}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={fuelModal} onClose={() => setFuelModal(false)} title="Record Fuel">
        <form onSubmit={(e) => { e.preventDefault(); recordFuel(); }} className="space-y-4">
          <TextField label="Quantity (L)" value={fuelForm.quantity} onChange={(e) => setFuelForm({ ...fuelForm, quantity: e.target.value })} />
          <TextField label="Cost (₹)" value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} />
          <FormActions onCancel={() => setFuelModal(false)} loading={saving} submitLabel="Record" />
        </form>
      </Modal>

      <Modal open={hoursModal} onClose={() => setHoursModal(false)} title="Record Engine Hours">
        <form onSubmit={(e) => { e.preventDefault(); recordHours(); }} className="space-y-4">
          <TextField label="Opening Hours" value={hoursForm.openingHours} onChange={(e) => setHoursForm({ ...hoursForm, openingHours: e.target.value })} />
          <TextField label="Closing Hours" value={hoursForm.closingHours} onChange={(e) => setHoursForm({ ...hoursForm, closingHours: e.target.value })} />
          <TextField label="Idle Hours" value={hoursForm.idleHours} onChange={(e) => setHoursForm({ ...hoursForm, idleHours: e.target.value })} />
          <FormActions onCancel={() => setHoursModal(false)} loading={saving} submitLabel="Record" />
        </form>
      </Modal>

      <Modal open={transferModal} onClose={() => setTransferModal(false)} title="Transfer Equipment">
        <form onSubmit={(e) => { e.preventDefault(); transfer(); }} className="space-y-4">
          <TextField label="Project ID" value={transferForm.projectId} onChange={(e) => setTransferForm({ ...transferForm, projectId: e.target.value })} />
          <TextField label="Site ID" value={transferForm.siteId} onChange={(e) => setTransferForm({ ...transferForm, siteId: e.target.value })} />
          <FormActions onCancel={() => setTransferModal(false)} loading={saving} submitLabel="Transfer" />
        </form>
      </Modal>

      <Modal open={breakdownModal} onClose={() => setBreakdownModal(false)} title="Report Breakdown">
        <form onSubmit={(e) => { e.preventDefault(); reportBreakdown(); }} className="space-y-4">
          <TextField label="Title" value={breakdownForm.title} onChange={(e) => setBreakdownForm({ ...breakdownForm, title: e.target.value })} />
          <TextField label="Description" value={breakdownForm.description} onChange={(e) => setBreakdownForm({ ...breakdownForm, description: e.target.value })} />
          <FormActions onCancel={() => setBreakdownModal(false)} loading={saving} submitLabel="Report" />
        </form>
      </Modal>
    </ModulePageLayout>
  );
}

function Item({ label, value }: { label: string; value?: string }) {
  return <div className="flex justify-between"><dt className="text-slate-500">{label}</dt><dd className="text-slate-200">{value || '—'}</dd></div>;
}

function CostCard({ icon: Icon, label, value }: { icon: typeof Fuel; label: string; value: string }) {
  return (
    <div className="command-card p-5">
      <Icon size={20} className="text-sky-400" />
      <p className="mt-2 text-xs text-slate-500">{label}</p>
      <p className="font-mono text-xl text-white">{value}</p>
    </div>
  );
}
