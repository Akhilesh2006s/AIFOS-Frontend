import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle, ArrowLeftRight, Clock, History, LayoutDashboard, Loader2, Play, Plus, RefreshCw,
  Settings, Trash2, Wrench,
} from 'lucide-react';
import { integrationsApi } from '@/api/client';
import { cn } from '@/lib/utils';

const ERP_SUBS = ['dashboard', 'connectors', 'mappings', 'jobs', 'history', 'errors'] as const;
export type ErpSub = (typeof ERP_SUBS)[number];

interface Props {
  sub: ErpSub;
  onSubChange: (sub: ErpSub) => void;
}

export function IntegrationsErpTab({ sub, onSubChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<Record<string, unknown> | null>(null);
  const [connectors, setConnectors] = useState<Array<Record<string, unknown>>>([]);
  const [selectedId, setSelectedId] = useState('');
  const [mappings, setMappings] = useState<Array<Record<string, unknown>>>([]);
  const [jobs, setJobs] = useState<Array<Record<string, unknown>>>([]);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [errors, setErrors] = useState<Array<Record<string, unknown>>>([]);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [mapForm, setMapForm] = useState({ entityType: 'purchase_order', afiosField: 'po.number', erpField: '' });
  const [jobForm, setJobForm] = useState({ name: '', connectorId: '', schedule: 'daily', syncType: 'incremental' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, c, h, e, j] = await Promise.all([
        integrationsApi.erp.dashboard(),
        integrationsApi.erp.connectors(),
        integrationsApi.erp.history(30),
        integrationsApi.erp.errors(30),
        integrationsApi.erp.jobs(),
      ]);
      setDash(d.data);
      const connList = c.data as Array<Record<string, unknown>>;
      setConnectors(connList);
      setHistory(h.data);
      setErrors(e.data);
      setJobs(j.data);
      if (!selectedId && connList.length) setSelectedId(String(connList[0].id));
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  const loadConnectorDetail = useCallback(async (id: string) => {
    if (!id) return;
    const [m, s] = await Promise.all([
      integrationsApi.erp.mappings(id),
      integrationsApi.erp.settings(id),
    ]);
    setMappings(m.data);
    setSettings(s.data);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (selectedId) loadConnectorDetail(selectedId); }, [selectedId, loadConnectorDetail]);

  const kpis = (dash?.kpis || {}) as Record<string, number>;

  const handleSync = async (connectorId?: string, jobId?: string) => {
    setSyncing(true);
    try {
      if (jobId) await integrationsApi.erp.runJob(jobId);
      else if (connectorId) await integrationsApi.erp.sync(connectorId);
      await load();
      if (selectedId) await loadConnectorDetail(selectedId);
    } finally {
      setSyncing(false);
    }
  };

  const handleSeedMappings = async () => {
    if (!selectedId) return;
    await integrationsApi.erp.seedMappings(selectedId);
    await loadConnectorDetail(selectedId);
  };

  const handleSaveSettings = async () => {
    if (!selectedId || !settings) return;
    await integrationsApi.erp.updateSettings(selectedId, {
      syncDirection: settings.syncDirection,
      entityTypes: settings.entityTypes,
      autoSyncEnabled: settings.autoSyncEnabled,
      schedule: settings.schedule,
      defaultSyncType: settings.defaultSyncType,
    });
    await load();
  };

  const handleCreateMapping = async () => {
    if (!selectedId) return;
    await integrationsApi.erp.createMapping(selectedId, mapForm);
    await loadConnectorDetail(selectedId);
  };

  const handleCreateJob = async () => {
    await integrationsApi.erp.createJob({
      connectorId: jobForm.connectorId,
      name: jobForm.name,
      schedule: jobForm.schedule,
      syncType: jobForm.syncType,
    });
    setJobForm({ name: '', connectorId: '', schedule: 'daily', syncType: 'incremental' });
    await load();
  };

  const subNav = (
    <div className="flex flex-wrap gap-1 border-b border-white/5 pb-2">
      {([
        { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'connectors' as const, label: 'Connectors', icon: Settings },
        { id: 'mappings' as const, label: 'Field Mapping', icon: ArrowLeftRight },
        { id: 'jobs' as const, label: 'Sync Jobs', icon: Clock },
        { id: 'history' as const, label: 'Sync History', icon: History },
        { id: 'errors' as const, label: 'Sync Errors', icon: AlertCircle },
      ]).map((s) => (
        <button
          key={s.id}
          onClick={() => onSubChange(s.id)}
          className={cn(
            'flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition',
            sub === s.id ? 'bg-teal-500/20 text-teal-300' : 'text-slate-500 hover:bg-white/5 hover:text-white',
          )}
        >
          <s.icon size={14} /> {s.label}
        </button>
      ))}
      <button onClick={load} className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:text-white">
        <RefreshCw size={12} /> Refresh
      </button>
    </div>
  );

  const connectorSelect = (
    <select
      value={selectedId}
      onChange={(e) => setSelectedId(e.target.value)}
      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
    >
      <option value="">Select ERP connector</option>
      {connectors.map((c) => <option key={String(c.id)} value={String(c.id)}>{String(c.name)} ({String(c.vendor)})</option>)}
    </select>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading ERP sync…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {subNav}
      <p className="text-xs text-slate-500">Mock ERP adapters (Tally · SAP · Oracle · Dynamics) — replaceable with production connectors.</p>

      {sub === 'dashboard' && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'ERP Connectors', value: kpis.erpConnectors ?? 0 },
              { label: 'Active Jobs', value: kpis.activeJobs ?? 0 },
              { label: 'Total Runs', value: kpis.totalRuns ?? 0 },
              { label: 'Open Errors', value: kpis.openErrors ?? 0 },
              { label: 'Runs (24h)', value: kpis.runsLast24h ?? 0 },
              { label: 'Success %', value: `${kpis.successRate ?? 100}%` },
            ].map((k) => (
              <div key={k.label} className="command-card px-4 py-3">
                <div className="text-xs text-slate-500">{k.label}</div>
                <div className="mt-1 text-xl font-semibold text-white">{k.value}</div>
              </div>
            ))}
          </div>
          <div className="command-card p-4">
            <h3 className="mb-3 text-sm font-medium text-white">Recent Sync Runs</h3>
            <div className="space-y-2">
              {((dash?.recentRuns || []) as Array<Record<string, unknown>>).map((r) => (
                <div key={String(r.id)} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs">
                  <span className="text-slate-300">{String(r.connectorName)} · {String(r.trigger)}</span>
                  <span className={String(r.status).includes('error') || String(r.status) === 'failed' ? 'text-red-400' : 'text-emerald-400'}>
                    {String(r.status)} · {String(r.recordsSynced)}/{String(r.recordsProcessed)}
                  </span>
                </div>
              ))}
              {!(dash?.recentRuns as unknown[])?.length && (
                <p className="text-xs text-slate-500">No sync runs yet. Install an ERP connector and run a sync.</p>
              )}
            </div>
          </div>
        </>
      )}

      {sub === 'connectors' && (
        <div className="space-y-4">
          {connectors.map((c) => (
            <div key={String(c.id)} className="command-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium text-white">{String(c.name)}</div>
                  <div className="text-xs text-slate-500">{String(c.vendor)} · {String(c.status)} · {Number(c.mappingCount)} mappings</div>
                  <div className="text-xs text-slate-600">Last sync: {c.lastSyncAt ? new Date(String(c.lastSyncAt)).toLocaleString() : 'Never'} · {String(c.lastSyncStatus)}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSync(String(c.id))}
                    disabled={syncing}
                    className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs text-white hover:bg-teal-500 disabled:opacity-40"
                  >
                    <Play size={12} /> Sync Now
                  </button>
                  <button
                    onClick={() => { setSelectedId(String(c.id)); integrationsApi.erp.testConnection(String(c.id)); }}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Test
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!connectors.length && (
            <p className="text-sm text-slate-500">
              No ERP connectors installed. Install Tally, SAP, Oracle, or Dynamics from Connector Manager → Marketplace.
            </p>
          )}
          {selectedId && settings && (
            <div className="command-card space-y-3 p-4">
              <h4 className="flex items-center gap-2 text-sm font-medium text-white"><Wrench size={14} /> Connector Settings</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-xs text-slate-500">
                  Direction
                  <select value={String(settings.syncDirection)} onChange={(e) => setSettings({ ...settings, syncDirection: e.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white">
                    <option value="inbound">Inbound</option>
                    <option value="outbound">Outbound</option>
                    <option value="bidirectional">Bidirectional</option>
                  </select>
                </label>
                <label className="text-xs text-slate-500">
                  Schedule
                  <select value={String(settings.schedule)} onChange={(e) => setSettings({ ...settings, schedule: e.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white">
                    <option value="manual">Manual</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </label>
                <label className="text-xs text-slate-500">
                  Default Sync Type
                  <select value={String(settings.defaultSyncType)} onChange={(e) => setSettings({ ...settings, defaultSyncType: e.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white">
                    <option value="full">Full</option>
                    <option value="incremental">Incremental</option>
                    <option value="entity">Entity</option>
                  </select>
                </label>
                <label className="flex items-end gap-2 text-xs text-slate-400">
                  <input type="checkbox" checked={!!settings.autoSyncEnabled} onChange={(e) => setSettings({ ...settings, autoSyncEnabled: e.target.checked })} />
                  Auto-sync enabled
                </label>
              </div>
              <button onClick={handleSaveSettings} className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs text-white hover:bg-teal-500">Save Settings</button>
            </div>
          )}
        </div>
      )}

      {sub === 'mappings' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">{connectorSelect}</div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleSeedMappings} disabled={!selectedId} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-40">
              Load Default Mappings
            </button>
          </div>
          <div className="command-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <select value={mapForm.entityType} onChange={(e) => setMapForm({ ...mapForm, entityType: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              {['purchase_order', 'vendor_bill', 'payment', 'ledger_entry', 'project', 'vendor'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input placeholder="AFIOS field" value={mapForm.afiosField} onChange={(e) => setMapForm({ ...mapForm, afiosField: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <input placeholder="ERP field" value={mapForm.erpField} onChange={(e) => setMapForm({ ...mapForm, erpField: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <button onClick={handleCreateMapping} disabled={!selectedId || !mapForm.erpField} className="flex items-center justify-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-sm text-white hover:bg-teal-500 disabled:opacity-40">
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="space-y-1">
            {mappings.map((m) => (
              <div key={String(m.id)} className="command-card flex items-center justify-between px-4 py-2 text-xs">
                <span className="text-slate-300">{String(m.entityType)} · <span className="text-white">{String(m.afiosField)}</span> → <span className="text-teal-300">{String(m.erpField)}</span></span>
                <button onClick={() => integrationsApi.erp.deleteMapping(String(m.id)).then(() => loadConnectorDetail(selectedId))} className="text-red-400"><Trash2 size={12} /></button>
              </div>
            ))}
            {!mappings.length && <p className="text-sm text-slate-500">No field mappings. Load defaults or add manually.</p>}
          </div>
        </div>
      )}

      {sub === 'jobs' && (
        <div className="space-y-4">
          <div className="command-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <input placeholder="Job name" value={jobForm.name} onChange={(e) => setJobForm({ ...jobForm, name: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <select value={jobForm.connectorId} onChange={(e) => setJobForm({ ...jobForm, connectorId: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              <option value="">Connector</option>
              {connectors.map((c) => <option key={String(c.id)} value={String(c.id)}>{String(c.name)}</option>)}
            </select>
            <select value={jobForm.schedule} onChange={(e) => setJobForm({ ...jobForm, schedule: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              <option value="manual">Manual</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <button onClick={handleCreateJob} disabled={!jobForm.name || !jobForm.connectorId} className="flex items-center justify-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-sm text-white hover:bg-teal-500 disabled:opacity-40">
              <Plus size={14} /> Create Job
            </button>
          </div>
          {jobs.map((j) => (
            <div key={String(j.id)} className="command-card flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <div className="text-sm text-white">{String(j.name)}</div>
                <div className="text-xs text-slate-500">{String(j.schedule)} · {String(j.syncType)} · {String(j.lastStatus)}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleSync(undefined, String(j.id))} disabled={syncing} className="flex items-center gap-1 rounded-lg bg-teal-600/20 px-3 py-1.5 text-xs text-teal-300">
                  <Play size={12} /> Run
                </button>
                <button onClick={() => integrationsApi.erp.deleteJob(String(j.id)).then(load)} className="text-red-400"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          {!jobs.length && <p className="text-sm text-slate-500">No sync jobs. Create one for manual or scheduled sync.</p>}
        </div>
      )}

      {sub === 'history' && (
        <div className="space-y-2">
          {history.map((r) => (
            <div key={String(r.id)} className="command-card px-4 py-3 text-xs">
              <div className="flex justify-between">
                <span className="font-medium text-white">{String(r.connectorName)}</span>
                <span className={String(r.status).includes('error') || r.status === 'failed' ? 'text-red-400' : 'text-emerald-400'}>{String(r.status)}</span>
              </div>
              <div className="mt-1 text-slate-500">
                {String(r.trigger)} · {String(r.recordsSynced)}/{String(r.recordsProcessed)} synced · {String(r.durationMs)}ms
                {r.createdAt ? ` · ${new Date(String(r.createdAt)).toLocaleString()}` : ''}
              </div>
            </div>
          ))}
          {!history.length && <p className="text-sm text-slate-500">No sync history yet.</p>}
        </div>
      )}

      {sub === 'errors' && (
        <div className="space-y-2">
          {errors.map((e) => (
            <div key={String(e.id)} className="command-card px-4 py-3">
              <div className="text-sm text-red-400">{String(e.connectorName)} · {String(e.entityType)}</div>
              <div className="text-xs text-slate-500">{String(e.message)}</div>
              <button onClick={() => integrationsApi.erp.retryError(String(e.id)).then(load)} className="mt-2 text-xs text-teal-400 hover:underline">Retry</button>
            </div>
          ))}
          {!errors.length && <p className="text-sm text-slate-500">No open sync errors.</p>}
        </div>
      )}
    </div>
  );
}
