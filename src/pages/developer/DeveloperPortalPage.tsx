import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BookOpen, Code2, Key, Loader2, RefreshCw, Shield, Trash2, Webhook, Zap,
} from 'lucide-react';
import { developerApi } from '@/api/client';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { cn } from '@/lib/utils';

const TABS = ['dashboard', 'applications', 'api-keys', 'docs', 'sandbox', 'usage', 'license', 'audit'] as const;
type TabId = (typeof TABS)[number];

const TAB_LABELS: Record<TabId, string> = {
  dashboard: 'Overview',
  applications: 'OAuth Apps',
  'api-keys': 'API Keys',
  docs: 'Documentation',
  sandbox: 'Sandbox',
  usage: 'Usage Analytics',
  license: 'Enterprise License',
  audit: 'Audit Log',
};

type Application = {
  id: string;
  applicationId: string;
  name: string;
  description: string;
  clientId: string;
  clientSecretPrefix: string;
  redirectUris: string[];
  scopes: string[];
  environment: string;
  status: string;
};

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  environment: string;
  enabled: boolean;
  rateLimitPerMinute: number;
  requestsTotal: number;
};

export function DeveloperPortalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (TABS.includes(searchParams.get('tab') as TabId) ? searchParams.get('tab') : 'dashboard') as TabId;
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<Record<string, unknown> | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [sdk, setSdk] = useState<Record<string, unknown> | null>(null);
  const [webhooks, setWebhooks] = useState<Record<string, unknown> | null>(null);
  const [swagger, setSwagger] = useState<Record<string, unknown> | null>(null);
  const [sandbox, setSandbox] = useState<Record<string, unknown> | null>(null);
  const [usage, setUsage] = useState<Record<string, unknown> | null>(null);
  const [license, setLicense] = useState<Record<string, unknown> | null>(null);
  const [audit, setAudit] = useState<{ entries?: Array<Record<string, unknown>> } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [appForm, setAppForm] = useState({
    applicationId: '', name: '', description: '', redirectUris: 'http://localhost:5173/oauth/callback', environment: 'sandbox',
  });
  const [keyForm, setKeyForm] = useState({ name: '', environment: 'sandbox' });

  const setTab = (t: TabId) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    setSearchParams(next);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'dashboard') {
        const r = await developerApi.dashboard();
        setDash(r.data);
      } else if (tab === 'applications') {
        const r = await developerApi.applications();
        setApplications(r.data || []);
      } else if (tab === 'api-keys') {
        const r = await developerApi.apiKeys();
        setApiKeys(r.data || []);
      } else if (tab === 'docs') {
        const [s, w, sw] = await Promise.all([developerApi.sdk(), developerApi.webhooks(), developerApi.swagger()]);
        setSdk(s.data);
        setWebhooks(w.data);
        setSwagger(sw.data);
      } else if (tab === 'sandbox') {
        const r = await developerApi.sandbox();
        setSandbox(r.data);
      } else if (tab === 'usage') {
        const r = await developerApi.usage();
        setUsage(r.data);
      } else if (tab === 'license') {
        const r = await developerApi.license();
        setLicense(r.data);
      } else if (tab === 'audit') {
        const r = await developerApi.audit(undefined, 40);
        setAudit(r.data);
      }
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const createApp = async () => {
    setBusy('app');
    try {
      const r = await developerApi.createApplication({
        ...appForm,
        redirectUris: appForm.redirectUris.split(',').map((s) => s.trim()).filter(Boolean),
        scopes: ['read:projects', 'publish:events'],
      });
      setNewSecret((r.data as { clientSecret?: string }).clientSecret || null);
      setAppForm({ applicationId: '', name: '', description: '', redirectUris: 'http://localhost:5173/oauth/callback', environment: 'sandbox' });
      await load();
    } finally {
      setBusy(null);
    }
  };

  const createKey = async () => {
    setBusy('key');
    try {
      const r = await developerApi.createApiKey(keyForm);
      setNewKey((r.data as { key?: string }).key || null);
      setKeyForm({ name: '', environment: 'sandbox' });
      await load();
    } finally {
      setBusy(null);
    }
  };

  const deleteApp = async (applicationId: string) => {
    setBusy(applicationId);
    try {
      await developerApi.deleteApplication(applicationId);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const deleteKey = async (id: string) => {
    setBusy(id);
    try {
      await developerApi.deleteApiKey(id);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const swaggerUrl = String((swagger as { url?: string })?.url || (dash?.docs as { swagger?: string })?.swagger || 'http://localhost:3001/api/docs');

  return (
    <ModulePageLayout
      title="Developer Portal"
      subtitle="Build applications, plugins, and integrations on AFIOS — documented APIs, OAuth, API keys, sandbox"
      heroActions={(
        <button type="button" onClick={load} className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh
        </button>
      )}
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm transition',
              tab === t ? 'border-violet-500/40 bg-violet-500/10 text-violet-300' : 'border-white/5 text-slate-400 hover:border-white/10 hover:text-white',
            )}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-400" /></div>
      ) : tab === 'dashboard' && dash ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="License" value={String((dash.license as { tierName?: string })?.tierName || '—')} accent="text-violet-400" />
            <Kpi label="OAuth Apps" value={String((dash.applications as unknown[])?.length ?? 0)} />
            <Kpi label="API Keys" value={String((dash.apiKeys as unknown[])?.length ?? 0)} />
            <Kpi label="Requests Today" value={String((dash.license as { usage?: { requestsToday?: number } })?.usage?.requestsToday ?? 0)} accent="text-emerald-400" />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <a href={swaggerUrl} target="_blank" rel="noreferrer" className="command-card flex items-center gap-3 p-4 hover:border-violet-500/30">
              <BookOpen className="h-8 w-8 text-violet-400" />
              <div><p className="font-medium text-white">Swagger API</p><p className="text-xs text-slate-500">Interactive REST reference</p></div>
            </a>
            <button type="button" onClick={() => setTab('docs')} className="command-card flex items-center gap-3 p-4 text-left hover:border-violet-500/30">
              <Code2 className="h-8 w-8 text-sky-400" />
              <div><p className="font-medium text-white">SDK Docs</p><p className="text-xs text-slate-500">@afios/sdk quick start</p></div>
            </button>
            <button type="button" onClick={() => setTab('docs')} className="command-card flex items-center gap-3 p-4 text-left hover:border-violet-500/30">
              <Webhook className="h-8 w-8 text-teal-400" />
              <div><p className="font-medium text-white">Webhooks</p><p className="text-xs text-slate-500">HMAC signing & delivery</p></div>
            </button>
          </div>
        </div>
      ) : tab === 'applications' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="command-card p-5">
            <h3 className="font-semibold text-white">Register OAuth Application</h3>
            <div className="mt-4 space-y-2">
              {(['applicationId', 'name', 'description'] as const).map((f) => (
                <input key={f} placeholder={f} value={appForm[f]} onChange={(e) => setAppForm((x) => ({ ...x, [f]: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
              ))}
              <input placeholder="redirectUris (comma-separated)" value={appForm.redirectUris} onChange={(e) => setAppForm((x) => ({ ...x, redirectUris: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
              <select value={appForm.environment} onChange={(e) => setAppForm((x) => ({ ...x, environment: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                <option value="sandbox">sandbox</option>
                <option value="production">production</option>
              </select>
              <button type="button" disabled={busy === 'app' || !appForm.applicationId} onClick={createApp} className="btn-primary w-full">
                {busy === 'app' ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Create Application'}
              </button>
              {newSecret && <p className="rounded bg-amber-500/10 p-2 text-xs text-amber-300">Client secret (save now): {newSecret}</p>}
            </div>
          </div>
          <div className="space-y-3">
            {applications.map((a) => (
              <div key={a.applicationId} className="command-card flex justify-between gap-3 p-4">
                <div>
                  <p className="font-medium text-white">{a.name}</p>
                  <p className="text-xs text-slate-500">{a.clientId} · {a.environment} · {a.status}</p>
                  <p className="mt-1 text-xs text-slate-400">{a.scopes.join(', ')}</p>
                </div>
                <button type="button" disabled={busy === a.applicationId} onClick={() => deleteApp(a.applicationId)} className="btn-ghost text-red-400">
                  {busy === a.applicationId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : tab === 'api-keys' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="command-card p-5">
            <h3 className="flex items-center gap-2 font-semibold text-white"><Key className="h-4 w-4" /> Create API Key</h3>
            <div className="mt-4 space-y-2">
              <input placeholder="name" value={keyForm.name} onChange={(e) => setKeyForm((x) => ({ ...x, name: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
              <select value={keyForm.environment} onChange={(e) => setKeyForm((x) => ({ ...x, environment: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                <option value="sandbox">sandbox</option>
                <option value="production">production</option>
              </select>
              <button type="button" disabled={busy === 'key' || !keyForm.name} onClick={createKey} className="btn-primary w-full">
                {busy === 'key' ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Generate Key'}
              </button>
              {newKey && <p className="rounded bg-amber-500/10 p-2 text-xs text-amber-300 break-all">API key (save now): {newKey}</p>}
            </div>
          </div>
          <div className="space-y-3">
            {apiKeys.map((k) => (
              <div key={k.id} className="command-card flex justify-between gap-3 p-4">
                <div>
                  <p className="font-medium text-white">{k.name}</p>
                  <p className="text-xs text-slate-500">{k.keyPrefix}… · {k.environment} · {k.requestsTotal} requests</p>
                  <p className="text-xs text-slate-400">{k.rateLimitPerMinute}/min · {k.scopes.join(', ')}</p>
                </div>
                <button type="button" disabled={busy === k.id} onClick={() => deleteKey(k.id)} className="btn-ghost text-red-400">
                  {busy === k.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : tab === 'docs' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="command-card p-5">
            <h3 className="font-semibold text-white">Swagger / OpenAPI</h3>
            <p className="mt-1 text-sm text-slate-500">Full interactive API reference</p>
            <a href={swaggerUrl} target="_blank" rel="noreferrer" className="btn-primary mt-4 inline-block text-sm">Open Swagger UI →</a>
            <pre className="mt-4 max-h-40 overflow-auto rounded bg-black/30 p-3 text-xs text-slate-300">{JSON.stringify(swagger, null, 2)}</pre>
          </div>
          <div className="command-card p-5">
            <h3 className="font-semibold text-white">SDK Documentation</h3>
            <pre className="mt-4 max-h-80 overflow-auto rounded bg-black/30 p-3 text-xs text-slate-300">{JSON.stringify(sdk, null, 2)}</pre>
          </div>
          <div className="command-card p-5 lg:col-span-2">
            <h3 className="font-semibold text-white">Webhook Documentation</h3>
            <pre className="mt-4 max-h-80 overflow-auto rounded bg-black/30 p-3 text-xs text-slate-300">{JSON.stringify(webhooks, null, 2)}</pre>
          </div>
        </div>
      ) : tab === 'sandbox' && sandbox ? (
        <div className="command-card p-5">
          <h3 className="flex items-center gap-2 font-semibold text-white"><Zap className="h-5 w-5 text-amber-400" /> Sandbox Environment</h3>
          <pre className="mt-4 overflow-auto rounded bg-black/30 p-4 text-sm text-slate-300">{JSON.stringify(sandbox, null, 2)}</pre>
          <p className="mt-4 text-sm text-slate-500">OAuth token endpoint: POST /api/v1/developer/oauth/token (client_credentials)</p>
        </div>
      ) : tab === 'usage' && usage ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi label="Total Requests" value={String((usage.summary as { totalRequests?: number })?.totalRequests ?? 0)} />
            <Kpi label="Errors (14d)" value={String((usage.summary as { errorsLast7d?: number })?.errorsLast7d ?? 0)} accent="text-red-400" />
            <Kpi label="Avg Latency" value={`${(usage.summary as { avgLatencyMs?: number })?.avgLatencyMs ?? 0}ms`} />
          </div>
          <div className="command-card p-4">
            <h3 className="mb-3 font-semibold text-white">Usage Trend</h3>
            <pre className="max-h-60 overflow-auto text-xs text-slate-400">{JSON.stringify(usage.trend, null, 2)}</pre>
          </div>
        </div>
      ) : tab === 'license' && license ? (
        <div className="command-card p-5">
          <h3 className="flex items-center gap-2 font-semibold text-white"><Shield className="h-5 w-5 text-violet-400" /> Enterprise Licensing</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Tier" value={String(license.tierName || license.tier)} accent="text-violet-400" />
            <Kpi label="Apps" value={`${(license.usage as { applications?: number })?.applications}/${license.maxApplications}`} />
            <Kpi label="API Keys" value={`${(license.usage as { apiKeys?: number })?.apiKeys}/${license.maxApiKeys}`} />
            <Kpi label="Daily Quota" value={`${(license.usage as { requestsToday?: number })?.requestsToday}/${license.maxRequestsPerDay}`} />
          </div>
          <p className="mt-4 text-sm text-slate-500">Features: {((license.features as string[]) || []).join(' · ')}</p>
        </div>
      ) : tab === 'audit' ? (
        <div className="command-card p-4">
          <h3 className="mb-3 font-semibold text-white">Developer Audit Log</h3>
          <ul className="space-y-2 text-sm">
            {(audit?.entries || []).map((e) => (
              <li key={String(e.id)} className="flex justify-between border-b border-white/5 py-2 text-slate-400">
                <span>{String(e.action)} · {String(e.entityId || '')}</span>
                <span className="text-xs">{e.userName ? String(e.userName) : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </ModulePageLayout>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="command-card p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold', accent || 'text-white')}>{value}</p>
    </div>
  );
}
