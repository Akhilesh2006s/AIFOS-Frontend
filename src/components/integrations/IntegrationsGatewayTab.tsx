import { useCallback, useEffect, useState } from 'react';
import {
  Activity, Key, LayoutDashboard, Loader2, Plus, RefreshCw, RotateCcw, Route, Trash2, XCircle,
} from 'lucide-react';
import { FilterChipBar } from '@/components/layout/FilterChipBar';
import { integrationsApi } from '@/api/client';

const GATEWAY_SUBS = ['dashboard', 'routes', 'retries', 'failed', 'keys'] as const;
export type GatewaySub = (typeof GATEWAY_SUBS)[number];

interface Props {
  sub: GatewaySub;
  onSubChange: (sub: GatewaySub) => void;
}

export function IntegrationsGatewayTab({ sub, onSubChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<Record<string, unknown> | null>(null);
  const [routes, setRoutes] = useState<Array<Record<string, unknown>>>([]);
  const [retries, setRetries] = useState<Array<Record<string, unknown>>>([]);
  const [failed, setFailed] = useState<Array<Record<string, unknown>>>([]);
  const [apiKeys, setApiKeys] = useState<Array<Record<string, unknown>>>([]);
  const [connectors, setConnectors] = useState<Array<{ id: string; name: string }>>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [routeForm, setRouteForm] = useState({ name: '', connectorId: '', path: '/events', eventTypes: '*' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, r, ret, f, k, c] = await Promise.all([
        integrationsApi.gateway.dashboard(),
        integrationsApi.gateway.routes(),
        integrationsApi.gateway.retries(),
        integrationsApi.gateway.failed(),
        integrationsApi.gateway.apiKeys(),
        integrationsApi.connectors.list(),
      ]);
      setDash(d.data);
      setRoutes(r.data);
      setRetries(ret.data);
      setFailed(f.data);
      setApiKeys(k.data);
      setConnectors((c.data as Array<{ id: string; name: string }>) || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const kpis = (dash?.kpis || {}) as Record<string, number>;

  const handleCreateRoute = async () => {
    await integrationsApi.gateway.createRoute({
      name: routeForm.name,
      connectorId: routeForm.connectorId,
      path: routeForm.path,
      eventTypes: routeForm.eventTypes === '*' ? ['*'] : routeForm.eventTypes.split(',').map((s) => s.trim()),
    });
    setRouteForm({ name: '', connectorId: '', path: '/events', eventTypes: '*' });
    await load();
  };

  const handleCreateKey = async () => {
    const res = await integrationsApi.gateway.createApiKey({ name: `Key ${apiKeys.length + 1}` });
    setNewKey((res.data as { key: string }).key);
    await load();
  };

  const handleRetry = async (id: string) => {
    await integrationsApi.gateway.retryJob(id);
    await load();
  };

  const subNav = (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <FilterChipBar
        className="mb-0 min-w-0 flex-1"
        items={[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'routes', label: 'Routes', icon: Route },
          { id: 'retries', label: 'Retry Queue', icon: RotateCcw },
          { id: 'failed', label: 'Failed', icon: XCircle },
          { id: 'keys', label: 'API Keys', icon: Key },
        ]}
        active={sub}
        onChange={(id) => onSubChange(id as GatewaySub)}
      />
      <button type="button" onClick={load} className="btn-ghost btn-sm ml-auto flex shrink-0 items-center gap-1">
        <RefreshCw size={12} /> Refresh
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading gateway…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {subNav}

      {sub === 'dashboard' && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Active Routes', value: kpis.activeRoutes ?? 0 },
              { label: 'Pending Jobs', value: kpis.pendingJobs ?? 0 },
              { label: 'Failed', value: kpis.failedRequests ?? 0 },
              { label: 'API Keys', value: kpis.apiKeys ?? 0 },
              { label: 'Success %', value: `${kpis.successRate ?? 100}%` },
              { label: 'Rate Limit/min', value: kpis.globalRateLimit ?? 100 },
            ].map((k) => (
              <div key={k.label} className="command-card px-4 py-3">
                <div className="text-xs text-slate-500">{k.label}</div>
                <div className="mt-1 text-xl font-semibold text-white">{k.value}</div>
              </div>
            ))}
          </div>
          <div className="command-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
              <Activity size={16} className="text-teal-400" /> Recent Gateway Requests
            </h3>
            <div className="space-y-2">
              {((dash?.recentRequests || []) as Array<Record<string, unknown>>).map((r) => (
                <div key={String(r.id)} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs">
                  <span className="text-slate-300">{String(r.targetType)} · {String(r.status)}</span>
                  <span className="text-slate-500">{r.responseTimeMs ? `${r.responseTimeMs}ms` : '—'}</span>
                </div>
              ))}
              {!(dash?.recentRequests as unknown[])?.length && (
                <p className="text-xs text-slate-500">No gateway requests yet. Publish an event or configure a route.</p>
              )}
            </div>
          </div>
        </>
      )}

      {sub === 'routes' && (
        <div className="space-y-4">
          <div className="command-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <input placeholder="Route name" value={routeForm.name} onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <select value={routeForm.connectorId} onChange={(e) => setRouteForm({ ...routeForm, connectorId: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              <option value="">Select connector</option>
              {connectors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Path e.g. /events" value={routeForm.path} onChange={(e) => setRouteForm({ ...routeForm, path: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <input placeholder="Event types (* or comma-separated)" value={routeForm.eventTypes} onChange={(e) => setRouteForm({ ...routeForm, eventTypes: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <button onClick={handleCreateRoute} disabled={!routeForm.name || !routeForm.connectorId} className="flex items-center justify-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-sm text-white hover:bg-teal-500 disabled:opacity-40">
              <Plus size={14} /> Add Route
            </button>
          </div>
          <div className="space-y-2">
            {routes.map((r) => (
              <div key={String(r.id)} className="command-card flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <div className="font-medium text-white">{String(r.name)}</div>
                  <div className="text-xs text-slate-500">{String(r.method)} {String(r.path)} · {(r.eventTypes as string[])?.join(', ')}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => integrationsApi.gateway.testRoute(String(r.id)).then(load)} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-400 hover:text-white">Test</button>
                  <button onClick={() => integrationsApi.gateway.deleteRoute(String(r.id)).then(load)} className="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            {!routes.length && <p className="text-sm text-slate-500">No gateway routes. Connect a connector and add a route to forward events.</p>}
          </div>
        </div>
      )}

      {sub === 'retries' && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-white">Retry Dashboard</h3>
          {retries.map((j) => (
            <div key={String(j.id)} className="command-card flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <div className="text-sm text-white">{String(j.jobType)} · <span className="uppercase text-amber-400">{String(j.status)}</span></div>
                <div className="text-xs text-slate-500">Attempt {String(j.attempts)}/{String(j.maxAttempts)} {j.lastError ? `· ${String(j.lastError)}` : ''}</div>
              </div>
              {['failed', 'retrying'].includes(String(j.status)) && (
                <button onClick={() => handleRetry(String(j.id))} className="flex items-center gap-1 rounded-lg bg-teal-600/20 px-3 py-1.5 text-xs text-teal-300 hover:bg-teal-600/30">
                  <RotateCcw size={12} /> Retry Now
                </button>
              )}
            </div>
          ))}
          {!retries.length && <p className="text-sm text-slate-500">No pending or failed jobs in the retry queue.</p>}
        </div>
      )}

      {sub === 'failed' && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-white">Failed Requests</h3>
          {failed.map((j) => (
            <div key={String(j.id)} className="command-card px-4 py-3">
              <div className="text-sm text-red-400">{String(j.jobType)} failed</div>
              <div className="text-xs text-slate-500">{String(j.lastError)}</div>
              <button onClick={() => handleRetry(String(j.id))} className="mt-2 text-xs text-teal-400 hover:underline">Retry</button>
            </div>
          ))}
          {!failed.length && <p className="text-sm text-slate-500">No failed gateway requests.</p>}
        </div>
      )}

      {sub === 'keys' && (
        <div className="space-y-4">
          <button onClick={handleCreateKey} className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-sm text-white hover:bg-teal-500">
            <Plus size={14} /> Generate API Key
          </button>
          {newKey && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
              <strong>Copy now:</strong> <code className="break-all">{newKey}</code>
            </div>
          )}
          <div className="space-y-2">
            {apiKeys.map((k) => (
              <div key={String(k.id)} className="command-card flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm text-white">{String(k.name)}</div>
                  <div className="text-xs text-slate-500">{String(k.keyPrefix)}… · {(k.scopes as string[])?.join(', ')}</div>
                </div>
                <button onClick={() => integrationsApi.gateway.deleteApiKey(String(k.id)).then(load)} className="text-xs text-red-400 hover:underline">Revoke</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
