import { useCallback, useEffect, useState } from 'react';
import {
  Activity, Cpu, HeartPulse, LayoutDashboard, Loader2, MapPin, Play, Plus, Radio, RefreshCw, Trash2,
} from 'lucide-react';
import { FilterChipBar } from '@/components/layout/FilterChipBar';
import { integrationsApi } from '@/api/client';
import { cn } from '@/lib/utils';

const FIELD_SUBS = ['dashboard', 'devices', 'telemetry', 'health', 'ingest'] as const;
export type FieldSub = (typeof FIELD_SUBS)[number];

interface Props {
  sub: FieldSub;
  onSubChange: (sub: FieldSub) => void;
}

export function IntegrationsFieldTab({ sub, onSubChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<Record<string, unknown> | null>(null);
  const [connectors, setConnectors] = useState<Array<Record<string, unknown>>>([]);
  const [devices, setDevices] = useState<Array<Record<string, unknown>>>([]);
  const [telemetry, setTelemetry] = useState<Array<Record<string, unknown>>>([]);
  const [health, setHealth] = useState<Array<Record<string, unknown>>>([]);
  const [selectedConnector, setSelectedConnector] = useState('');
  const [polling, setPolling] = useState(false);
  const [deviceForm, setDeviceForm] = useState({ deviceId: '', name: '', assetId: '', projectId: '' });
  const [ingestForm, setIngestForm] = useState({
    connectorId: '', deviceId: '', telemetryType: 'location', payload: '{"lat":12.97,"lng":77.59}',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, c, dev, tel, h] = await Promise.all([
        integrationsApi.field.dashboard(),
        integrationsApi.field.connectors(),
        integrationsApi.field.devices(),
        integrationsApi.field.telemetry(50),
        integrationsApi.field.health(),
      ]);
      setDash(d.data);
      const connList = c.data as Array<Record<string, unknown>>;
      setConnectors(connList);
      setDevices(dev.data);
      setTelemetry(tel.data);
      setHealth(h.data);
      if (!selectedConnector && connList.length) setSelectedConnector(String(connList[0].id));
    } finally {
      setLoading(false);
    }
  }, [selectedConnector]);

  useEffect(() => { load(); }, [load]);

  const kpis = (dash?.kpis || {}) as Record<string, number>;

  const handlePoll = async (connectorId: string) => {
    setPolling(true);
    try {
      await integrationsApi.field.poll(connectorId);
      await load();
    } finally {
      setPolling(false);
    }
  };

  const handleCreateDevice = async () => {
    if (!selectedConnector) return;
    await integrationsApi.field.createDevice(selectedConnector, deviceForm);
    setDeviceForm({ deviceId: '', name: '', assetId: '', projectId: '' });
    await load();
  };

  const handleIngest = async () => {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(ingestForm.payload);
    } catch {
      payload = { raw: ingestForm.payload };
    }
    await integrationsApi.field.ingest({
      connectorId: ingestForm.connectorId || selectedConnector,
      deviceId: ingestForm.deviceId,
      telemetryType: ingestForm.telemetryType,
      payload,
    });
    await load();
  };

  const subNav = (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <FilterChipBar
        className="mb-0 min-w-0 flex-1"
        items={[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'devices', label: 'Devices', icon: Cpu },
          { id: 'telemetry', label: 'Telemetry', icon: Radio },
          { id: 'health', label: 'Health', icon: HeartPulse },
          { id: 'ingest', label: 'Publish', icon: Activity },
        ]}
        active={sub}
        onChange={(id) => onSubChange(id as FieldSub)}
      />
      <button type="button" onClick={load} className="btn-ghost btn-sm ml-auto flex shrink-0 items-center gap-1">
        <RefreshCw size={12} /> Refresh
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading field integration…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {subNav}
      <p className="text-xs text-slate-500">Field Integration Platform — GPS · RFID · Biometric · Fuel · IoT · OEM telemetry into AFIOS.</p>

      {sub === 'dashboard' && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Field Connectors', value: kpis.fieldConnectors ?? 0 },
              { label: 'Devices', value: kpis.devices ?? 0 },
              { label: 'Online', value: kpis.devicesOnline ?? 0 },
              { label: 'Offline', value: kpis.devicesOffline ?? 0 },
              { label: 'Telemetry (24h)', value: kpis.telemetryLast24h ?? 0 },
              { label: 'Types', value: kpis.telemetryTypes ?? 5 },
            ].map((k) => (
              <div key={k.label} className="command-card px-4 py-3">
                <div className="text-xs text-slate-500">{k.label}</div>
                <div className="mt-1 text-xl font-semibold text-white">{k.value}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="command-card p-4">
              <h3 className="mb-3 text-sm font-medium text-white">Connectors</h3>
              {connectors.map((c) => (
                <div key={String(c.id)} className="mb-2 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs">
                  <span className="text-slate-300">{String(c.name)} · {Number(c.devicesOnline)}/{Number(c.deviceCount)} online</span>
                  <button onClick={() => handlePoll(String(c.id))} disabled={polling} className="text-teal-400 hover:underline">Poll</button>
                </div>
              ))}
              {!connectors.length && <p className="text-xs text-slate-500">Install GPS, RFID, Biometric, Fuel, IoT, or OEM connectors from Marketplace.</p>}
            </div>
            <div className="command-card p-4">
              <h3 className="mb-3 text-sm font-medium text-white">Recent Telemetry</h3>
              {((dash?.recentTelemetry || []) as Array<Record<string, unknown>>).slice(0, 5).map((t) => (
                <div key={String(t.id)} className="mb-2 flex justify-between rounded-lg bg-white/5 px-3 py-2 text-xs">
                  <span className="text-slate-300">{String(t.deviceId)} · {String(t.telemetryType)}</span>
                  <span className="text-slate-500">{t.recordedAt ? new Date(String(t.recordedAt)).toLocaleTimeString() : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {sub === 'devices' && (
        <div className="space-y-4">
          <select value={selectedConnector} onChange={(e) => setSelectedConnector(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
            <option value="">All connectors</option>
            {connectors.map((c) => <option key={String(c.id)} value={String(c.id)}>{String(c.name)}</option>)}
          </select>
          <div className="command-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <input placeholder="Device ID" value={deviceForm.deviceId} onChange={(e) => setDeviceForm({ ...deviceForm, deviceId: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <input placeholder="Name" value={deviceForm.name} onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <input placeholder="Asset ID" value={deviceForm.assetId} onChange={(e) => setDeviceForm({ ...deviceForm, assetId: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <button onClick={handleCreateDevice} disabled={!selectedConnector || !deviceForm.deviceId} className="flex items-center justify-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-sm text-white disabled:opacity-40">
              <Plus size={14} /> Register Device
            </button>
          </div>
          {devices.filter((d) => !selectedConnector || d.connectorId === selectedConnector).map((d) => (
            <div key={String(d.id)} className="command-card flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm text-white">{String(d.name)} <span className="text-slate-500">({String(d.deviceId)})</span></div>
                <div className="text-xs text-slate-500">{String(d.deviceType)} · <span className={d.status === 'online' ? 'text-emerald-400' : 'text-amber-400'}>{String(d.status)}</span></div>
              </div>
              <button onClick={() => integrationsApi.field.deleteDevice(String(d.id)).then(load)} className="text-red-400"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}

      {sub === 'telemetry' && (
        <div className="space-y-2">
          {telemetry.map((t) => (
            <div key={String(t.id)} className="command-card px-4 py-3 text-xs">
              <div className="flex justify-between">
                <span className="font-medium text-white">{String(t.deviceName || t.deviceId)} · {String(t.telemetryType)}</span>
                <span className="text-slate-500">{t.recordedAt ? new Date(String(t.recordedAt)).toLocaleString() : ''}</span>
              </div>
              <pre className="mt-1 overflow-x-auto text-slate-500">{JSON.stringify(t.payload)}</pre>
            </div>
          ))}
          {!telemetry.length && <p className="text-sm text-slate-500">No telemetry yet. Poll a connector or publish data.</p>}
        </div>
      )}

      {sub === 'health' && (
        <div className="space-y-2">
          {health.map((h) => (
            <div key={String(h.id)} className="command-card flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm text-white">{String(h.name)}</div>
                <div className="text-xs text-slate-500">{String(h.deviceType)} · last seen {h.lastSeenAt ? new Date(String(h.lastSeenAt)).toLocaleString() : 'never'}</div>
              </div>
              <span className={cn(
                'text-xs uppercase',
                h.health === 'healthy' ? 'text-emerald-400' : h.health === 'stale' ? 'text-amber-400' : 'text-red-400',
              )}>{String(h.health)}</span>
            </div>
          ))}
          {!health.length && <p className="text-sm text-slate-500">No devices registered for health monitoring.</p>}
        </div>
      )}

      {sub === 'ingest' && (
        <div className="command-card space-y-3 p-4">
          <h3 className="flex items-center gap-2 text-sm font-medium text-white"><MapPin size={14} /> Publish Telemetry</h3>
          <p className="text-xs text-slate-500">Standardized ingress — POST /integrations/field/ingest</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={ingestForm.connectorId || selectedConnector} onChange={(e) => setIngestForm({ ...ingestForm, connectorId: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              {connectors.map((c) => <option key={String(c.id)} value={String(c.id)}>{String(c.name)}</option>)}
            </select>
            <input placeholder="Device ID" value={ingestForm.deviceId} onChange={(e) => setIngestForm({ ...ingestForm, deviceId: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <select value={ingestForm.telemetryType} onChange={(e) => setIngestForm({ ...ingestForm, telemetryType: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              {['location', 'engine_hours', 'fuel', 'equipment_status', 'attendance'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={handleIngest} disabled={!ingestForm.deviceId} className="flex items-center justify-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-sm text-white disabled:opacity-40">
              <Play size={14} /> Publish
            </button>
          </div>
          <textarea value={ingestForm.payload} onChange={(e) => setIngestForm({ ...ingestForm, payload: e.target.value })} rows={4} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white" />
        </div>
      )}
    </div>
  );
}
