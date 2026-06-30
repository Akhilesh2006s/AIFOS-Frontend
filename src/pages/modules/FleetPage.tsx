import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Truck, Navigation, ParkingCircle, ShieldAlert, Plus, MapPin } from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { ModuleTabs } from '@/components/layout/ModuleTabs';
import { CrudTable } from '@/components/ui/CrudTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField, FormActions } from '@/components/ui/FormField';
import { moduleApi } from '@/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Vehicle } from '@/types/entities';

const TABS = [
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'fuel', label: 'Fuel' },
  { id: 'trips', label: 'Trips' },
  { id: 'gps', label: 'GPS' },
] as const;

const VEHICLE_TYPES = ['Truck', 'Pickup', 'Trailer', 'Car', 'Bus', 'Other'];
const empty = { registrationNumber: '', name: '', type: 'Truck', status: 'active', odometerKm: '0' };

export function FleetPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'vehicles';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuel, setFuel] = useState<Array<Record<string, unknown>>>([]);
  const [trips, setTrips] = useState<Array<Record<string, unknown>>>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, v, f, t] = await Promise.all([
      moduleApi.fleet.stats(),
      moduleApi.fleet.vehicles(),
      moduleApi.fleet.fuel().catch(() => ({ data: [] })),
      moduleApi.fleet.trips().catch(() => ({ data: [] })),
    ]);
    setStats(s.data);
    setVehicles(v.data);
    setFuel(f.data);
    setTrips(t.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setTab = (id: string) => setSearchParams(id === 'vehicles' ? {} : { tab: id });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, odometerKm: Number(form.odometerKm) };
    try {
      if (editing) await moduleApi.fleet.update(editing._id, payload);
      else await moduleApi.fleet.create(payload);
      setModalOpen(false);
      await load();
    } finally { setSaving(false); }
  };

  return (
    <ModulePageLayout
      title="Fleet Operations"
      subtitle="Vehicles, drivers, trips, fuel and GPS"
      loading={loading}
      tabs={<ModuleTabs tabs={TABS} active={tab} onChange={setTab} accent="#1F4E79" />}
      heroActions={
        tab === 'vehicles' ? (
          <button onClick={() => { setEditing(null); setForm(empty); setModalOpen(true); }} className="btn-accent flex items-center gap-2">
            <Plus size={16} /> Add Vehicle
          </button>
        ) : undefined
      }
      stats={[
        { label: 'Total Vehicles', value: stats?.totalVehicles ?? '—', icon: Truck },
        { label: 'On Trip', value: stats?.onTrip ?? '—', icon: Navigation },
        { label: 'Idle', value: stats?.idle ?? '—', icon: ParkingCircle },
        { label: 'Non-Compliant', value: stats?.nonCompliant ?? '—', icon: ShieldAlert },
      ]}
    >
      {tab === 'vehicles' && (
        <CrudTable title="Fleet Registry" data={vehicles}
          onEdit={(r) => { setEditing(r); setForm({ registrationNumber: r.registrationNumber, name: r.name, type: r.type || 'Truck', status: r.status, odometerKm: String(r.odometerKm) }); setModalOpen(true); }}
          onDelete={async (r) => { if (confirm('Delete vehicle?')) { await moduleApi.fleet.remove(r._id); load(); } }}
          columns={[
            { key: 'registrationNumber', label: 'Registration' },
            { key: 'name', label: 'Vehicle' },
            { key: 'type', label: 'Type' },
            { key: 'status', label: 'Status', render: (v) => <StatusBadge status={String(v)} dot /> },
            { key: 'odometerKm', label: 'Odometer', render: (v) => <span className="font-mono">{Number(v).toLocaleString('en-IN')} km</span> },
          ]}
        />
      )}

      {tab === 'fuel' && (
        <CrudTable title="Fleet Fuel Entries" data={fuel as never}
          columns={[
            { key: 'entryDate', label: 'Date', render: (v) => v ? formatDate(String(v)) : '—' },
            { key: 'vehicleId', label: 'Vehicle', render: (v) => <span className="font-mono text-xs">{String(v).slice(-6)}</span> },
            { key: 'quantity', label: 'Qty (L)', render: (v) => <span className="font-mono">{String(v)}</span> },
            { key: 'cost', label: 'Cost', render: (v) => <span className="font-mono">{formatCurrency(Number(v))}</span> },
            { key: 'filledBy', label: 'Filled By' },
          ]}
        />
      )}

      {tab === 'trips' && (
        <CrudTable title="Active & Recent Trips" data={trips as never}
          columns={[
            { key: 'fromLocation', label: 'From' },
            { key: 'toLocation', label: 'To' },
            { key: 'status', label: 'Status', render: (v) => <StatusBadge status={String(v)} dot /> },
            { key: 'distanceKm', label: 'Distance', render: (v) => <span className="font-mono">{String(v)} km</span> },
          ]}
        />
      )}

      {tab === 'gps' && (
        <div className="command-card flex flex-col items-center justify-center p-12 text-center">
          <MapPin size={48} className="text-sky-400/50" />
          <h3 className="mt-4 font-semibold text-white">GPS Tracking</h3>
          <p className="mt-2 text-sm text-slate-500">Live vehicle location — integration placeholder for Phase 2</p>
          <p className="mt-4 font-mono text-xs text-slate-600">{vehicles.filter((v) => (v as { gpsDeviceId?: string }).gpsDeviceId).length} devices registered</p>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Vehicle' : 'Add Vehicle'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editing && <TextField label="Registration" required value={form.registrationNumber} onChange={set('registrationNumber')} />}
          <TextField label="Name" required value={form.name} onChange={set('name')} />
          <SelectField label="Type" value={form.type} onChange={set('type')}>
            {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </SelectField>
          <SelectField label="Status" value={form.status} onChange={set('status')}>
            <option value="active">Active</option><option value="on_trip">On Trip</option><option value="maintenance">Maintenance</option>
          </SelectField>
          <FormActions onCancel={() => setModalOpen(false)} loading={saving} />
        </form>
      </Modal>
    </ModulePageLayout>
  );
}
