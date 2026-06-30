import { useCallback, useEffect, useState } from 'react';
import {
  Activity, AlertCircle, CheckCircle2, LayoutDashboard, Loader2, Package, Plug, RefreshCw, Settings, Store,
} from 'lucide-react';
import { FilterChipBar } from '@/components/layout/FilterChipBar';
import { integrationsApi } from '@/api/client';
import { cn } from '@/lib/utils';

const CONN_SUBS = ['dashboard', 'installed', 'marketplace', 'logs', 'settings'] as const;
export type ConnSub = (typeof CONN_SUBS)[number];

const STATUS_COLOR: Record<string, string> = {
  connected: 'text-emerald-400 bg-emerald-500/10',
  configured: 'text-sky-400 bg-sky-500/10',
  installed: 'text-slate-400 bg-white/5',
  disconnected: 'text-amber-400 bg-amber-500/10',
  disabled: 'text-slate-500 bg-white/5',
  error: 'text-red-400 bg-red-500/10',
};

interface Props {
  sub: ConnSub;
  onSubChange: (sub: ConnSub) => void;
}

export function IntegrationsConnectorTab({ sub, onSubChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<Record<string, unknown> | null>(null);
  const [registry, setRegistry] = useState<Array<Record<string, unknown>>>([]);
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [form, setForm] = useState({ authType: 'api_key', apiKey: '', baseUrl: '', companyName: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, r, l] = await Promise.all([
        integrationsApi.dashboard(),
        integrationsApi.connectors.registry(),
        integrationsApi.connectors.logs(50),
      ]);
      setDash(d.data);
      setRegistry(r.data);
      setLogs(l.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const installed = (dash?.installed || []) as Array<{
    id: string; name: string; category: string; status: string; version: string;
    health?: { healthy?: boolean; successPercent?: number; responseTimeMs?: number };
    metrics?: { requestCount?: number };
  }>;
  const kpis = (dash?.kpis || {}) as Record<string, number>;

  const handleInstall = async (registryId: string) => {
    await integrationsApi.connectors.create({ registryId });
    await load();
  };

  const handleConfigure = async (id: string) => {
    await integrationsApi.connectors.update(id, {
      authType: form.authType,
      authConfig: { apiKey: form.apiKey },
      config: { baseUrl: form.baseUrl, companyName: form.companyName, endpoint: form.baseUrl, host: form.baseUrl, webhookUrl: form.baseUrl, hubUrl: form.baseUrl, connectionString: form.baseUrl, bucket: form.companyName, region: form.companyName, gstin: form.companyName, phoneNumberId: form.companyName, dealerId: form.companyName, client: form.companyName },
    });
    await integrationsApi.connectors.health(id);
    setConfiguring(null);
    await load();
  };

  const handleHealth = async (id: string) => {
    await integrationsApi.connectors.health(id);
    await load();
  };

  const handleDelete = async (id: string) => {
    await integrationsApi.connectors.delete(id);
    await load();
  };

  const subNav = (
    <FilterChipBar
      items={[
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'installed', label: 'Installed', icon: Plug },
        { id: 'marketplace', label: 'Marketplace', icon: Store },
        { id: 'logs', label: 'Logs', icon: Activity },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]}
      active={sub}
      onChange={(id) => onSubChange(id as ConnSub)}
    />
  );

  if (loading && !dash) {
    return <div className="flex items-center justify-center py-20 text-slate-500"><Loader2 className="mr-2 animate-spin text-accent" size={18} /> Loading connectors…</div>;
  }

  const renderDashboard = () => (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Connector framework — install, configure, monitor external integrations.</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Installed', value: kpis.installed ?? 0 },
          { label: 'Connected', value: kpis.connected ?? 0 },
          { label: 'Errors', value: kpis.errors ?? 0 },
          { label: 'Success %', value: `${kpis.successPercent ?? 100}%` },
          { label: 'Requests', value: kpis.totalRequests ?? 0 },
          { label: 'Avg Response', value: `${kpis.avgResponseTimeMs ?? 0}ms` },
          { label: 'Marketplace', value: kpis.marketplace ?? 0 },
        ].map((k) => (
          <div key={k.label} className="command-card p-4">
            <p className="text-[10px] uppercase text-slate-500">{k.label}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-white">{k.value}</p>
          </div>
        ))}
      </div>
      <div className="command-card divide-y divide-white/5">
        {installed.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No connectors installed — browse Marketplace</p>}
        {installed.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {c.status === 'connected' ? <CheckCircle2 size={16} className="text-emerald-400" /> : c.status === 'error' ? <AlertCircle size={16} className="text-red-400" /> : <Package size={16} className="text-slate-500" />}
              <div>
                <p className="font-medium text-white">{c.name}</p>
                <p className="text-[10px] uppercase text-slate-500">{c.category} · v{c.version}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('rounded px-2 py-0.5 text-[10px] uppercase', STATUS_COLOR[c.status] || STATUS_COLOR.installed)}>{c.status}</span>
              <button onClick={() => handleHealth(c.id)} className="text-xs text-teal-400 hover:underline">Health</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={load} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"><RefreshCw size={14} /> Refresh</button>
    </div>
  );

  const renderInstalled = () => (
    <div className="space-y-3">
      {installed.map((c) => (
        <div key={c.id} className="command-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-white">{c.name}</h3>
              <p className="text-xs text-slate-500">{c.category} · {c.health?.successPercent ?? 0}% success · {c.health?.responseTimeMs ?? 0}ms</p>
            </div>
            <span className={cn('rounded px-2 py-0.5 text-[10px] uppercase', STATUS_COLOR[c.status])}>{c.status}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => setConfiguring(c.id)} className="rounded-lg bg-teal-500/20 px-3 py-1.5 text-xs text-teal-300">Configure</button>
            <button onClick={() => handleHealth(c.id)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400">Run Health Check</button>
            <button onClick={() => handleDelete(c.id)} className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400">Remove</button>
          </div>
          {configuring === c.id && (
            <div className="mt-4 grid gap-3 border-t border-white/5 pt-4 sm:grid-cols-2">
              <select value={form.authType} onChange={(e) => setForm({ ...form, authType: e.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white">
                {['api_key', 'oauth2', 'jwt', 'basic_auth', 'bearer_token', 'custom_headers'].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <input placeholder="API Key / Token" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
              <input placeholder="Endpoint / Base URL" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
              <input placeholder="Company / Identifier" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" />
              <button onClick={() => handleConfigure(c.id)} className="rounded-lg bg-teal-500/30 px-4 py-2 text-sm text-teal-200 sm:col-span-2">Save & Test Connection</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderMarketplace = () => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {registry.map((r) => {
        const isInstalled = installed.some((i) => i.name === r.name);
        return (
          <div key={String(r.id)} className="command-card p-4">
            <p className="text-[10px] uppercase text-teal-400">{String(r.category)}</p>
            <h3 className="mt-1 font-semibold text-white">{String(r.name)}</h3>
            <p className="mt-1 text-xs text-slate-500">{String(r.description)}</p>
            <p className="mt-2 text-[10px] text-slate-600">v{String(r.version)} · {String(r.vendor)}</p>
            <button
              disabled={isInstalled}
              onClick={() => handleInstall(String(r.id))}
              className="mt-3 w-full rounded-lg bg-teal-500/20 py-2 text-xs text-teal-300 disabled:opacity-40"
            >
              {isInstalled ? 'Installed' : 'Install'}
            </button>
          </div>
        );
      })}
    </div>
  );

  const renderLogs = () => (
    <div className="command-card divide-y divide-white/5">
      {logs.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No connector logs yet</p>}
      {logs.map((l) => (
        <div key={String(l.id)} className="flex items-center justify-between px-4 py-3 text-sm">
          <div>
            <p className="font-medium text-white">{String(l.connectorName)} — {String(l.action)}</p>
            <p className="text-xs text-slate-500">{String(l.message)}</p>
          </div>
          <div className="text-right text-xs">
            <span className={l.level === 'error' ? 'text-red-400' : 'text-emerald-400'}>{String(l.level)}</span>
            {l.responseTimeMs != null && <p className="text-slate-600">{String(l.responseTimeMs)}ms</p>}
          </div>
        </div>
      ))}
    </div>
  );

  const renderSettings = () => (
    <div className="command-card space-y-4 p-5 text-sm text-slate-400">
      <p>Connector framework supports API Key, OAuth2, JWT, Basic Auth, Bearer Token, and Custom Headers.</p>
      <p>Statuses: installed → configured → connected. Health checks run on save and on demand.</p>
      <p>Categories: ERP, GPS, OEM, Communication, Government, IoT, Database, Storage, Custom.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {subNav}
      {sub === 'dashboard' && renderDashboard()}
      {sub === 'installed' && renderInstalled()}
      {sub === 'marketplace' && renderMarketplace()}
      {sub === 'logs' && renderLogs()}
      {sub === 'settings' && renderSettings()}
    </div>
  );
}

export { CONN_SUBS };
