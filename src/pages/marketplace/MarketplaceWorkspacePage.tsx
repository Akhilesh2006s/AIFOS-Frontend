import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Download, LayoutDashboard, Loader2, Package, RefreshCw, Star, Trash2, Upload, Workflow,
} from 'lucide-react';
import { marketplaceApi } from '@/api/client';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { cn } from '@/lib/utils';

const TABS = ['dashboard', 'connectors', 'dashboards', 'workflows', 'reports', 'installed', 'developer'] as const;
type TabId = (typeof TABS)[number];

const TAB_LABELS: Record<TabId, string> = {
  dashboard: 'Overview',
  connectors: 'Connector Store',
  dashboards: 'Dashboard Store',
  workflows: 'Workflow Templates',
  reports: 'Report Templates',
  installed: 'Installed',
  developer: 'Developer',
};

type Plugin = {
  id: string;
  pluginId: string;
  name: string;
  type: string;
  typeLabel: string;
  version: string;
  publisher: string;
  description: string;
  category: string;
  ratingAvg: number;
  ratingCount: number;
  installCount: number;
  installed: boolean;
};

type Installation = {
  id: string;
  pluginId: string;
  pluginName: string;
  pluginType: string;
  installedVersion: string;
  latestVersion?: string;
  updateAvailable: boolean;
  status: string;
};

const TYPE_MAP: Record<TabId, string | undefined> = {
  dashboard: undefined,
  connectors: 'connector',
  dashboards: 'dashboard',
  workflows: 'workflow_template',
  reports: 'report_template',
  installed: undefined,
  developer: undefined,
};

export function MarketplaceWorkspacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (TABS.includes(searchParams.get('tab') as TabId) ? searchParams.get('tab') : 'dashboard') as TabId;
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<Record<string, unknown> | null>(null);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [sdk, setSdk] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [ratingPlugin, setRatingPlugin] = useState<string | null>(null);
  const [stars, setStars] = useState(5);
  const [publishForm, setPublishForm] = useState({
    pluginId: '', name: '', type: 'dashboard', version: '1.0.0', publisher: '', description: '', category: 'custom',
  });

  const setTab = (t: TabId) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    setSearchParams(next);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const type = TYPE_MAP[tab];
      const reqs: Promise<unknown>[] = [marketplaceApi.dashboard()];
      if (tab === 'installed') {
        reqs.push(marketplaceApi.installations());
      } else if (tab === 'developer') {
        reqs.push(marketplaceApi.sdkManifest(), marketplaceApi.developerPlugins());
      } else if (tab !== 'dashboard') {
        reqs.push(marketplaceApi.plugins(type));
      } else {
        reqs.push(marketplaceApi.plugins());
      }
      const results = await Promise.all(reqs);
      setDash((results[0] as { data: Record<string, unknown> }).data);
      if (tab === 'installed') {
        setInstallations((results[1] as { data: Installation[] }).data || []);
      } else if (tab === 'developer') {
        setSdk((results[1] as { data: Record<string, unknown> }).data);
        setPlugins((results[2] as { data: Plugin[] })?.data || (results[1] as { data: Plugin[] }).data || []);
      } else if (tab !== 'dashboard') {
        setPlugins((results[1] as { data: Plugin[] }).data || []);
      } else {
        setPlugins((results[1] as { data: Plugin[] }).data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const handleInstall = async (pluginId: string) => {
    setBusy(pluginId);
    try {
      await marketplaceApi.install(pluginId);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const handleUninstall = async (installationId: string) => {
    setBusy(installationId);
    try {
      await marketplaceApi.uninstall(installationId);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const handleUpgrade = async (pluginId: string) => {
    setBusy(pluginId);
    try {
      await marketplaceApi.upgrade(pluginId);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const handleRate = async (pluginId: string) => {
    setBusy(pluginId);
    try {
      await marketplaceApi.rate(pluginId, { stars });
      setRatingPlugin(null);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const handlePublish = async () => {
    setBusy('publish');
    try {
      await marketplaceApi.publishPlugin(publishForm);
      setPublishForm({ pluginId: '', name: '', type: 'dashboard', version: '1.0.0', publisher: '', description: '', category: 'custom' });
      await load();
    } finally {
      setBusy(null);
    }
  };

  const tabIcon = (t: TabId) => {
    if (t === 'connectors') return Package;
    if (t === 'dashboards') return LayoutDashboard;
    if (t === 'workflows') return Workflow;
    if (t === 'reports') return Box;
    if (t === 'installed') return Download;
    if (t === 'developer') return Upload;
    return Package;
  };

  return (
    <ModulePageLayout
      title="Marketplace"
      subtitle="Install connectors, dashboards, workflow & report templates — no core modifications"
      heroActions={(
        <button type="button" onClick={load} className="btn-ghost flex items-center gap-2 text-sm">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh
        </button>
      )}
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = tabIcon(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition',
                tab === t ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-white/5 text-slate-400 hover:border-white/10 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4" />
              {TAB_LABELS[t]}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-400" /></div>
      ) : tab === 'dashboard' && dash ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Catalog" value={String(dash.catalogCount)} />
            <Kpi label="Installed" value={String(dash.installedCount)} accent="text-emerald-400" />
            <Kpi label="Pending Updates" value={String(dash.pendingUpdates)} accent={Number(dash.pendingUpdates) > 0 ? 'text-amber-400' : undefined} />
            <Kpi label="Stores" value="4" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(['connector', 'dashboard', 'workflow_template', 'report_template'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTab(type === 'connector' ? 'connectors' : type === 'dashboard' ? 'dashboards' : type === 'workflow_template' ? 'workflows' : 'reports')}
                className="command-card p-4 text-left hover:border-emerald-500/30"
              >
                <p className="text-xs uppercase tracking-wider text-slate-500">{type.replace('_', ' ')}</p>
                <p className="mt-1 text-2xl font-bold text-white">{(dash.byType as Record<string, number>)?.[type] || 0}</p>
              </button>
            ))}
          </div>
          {(dash.topRated as Plugin[])?.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">Top Rated</h3>
              <div className="grid gap-3 md:grid-cols-2">{((dash.topRated as Plugin[]) || []).map((p) => <PluginCard key={p.pluginId} plugin={p} busy={busy} onInstall={handleInstall} onRate={(id) => setRatingPlugin(id)} ratingPlugin={ratingPlugin} stars={stars} setStars={setStars} onSubmitRate={handleRate} />)}</div>
            </div>
          )}
        </div>
      ) : tab === 'installed' ? (
        <div className="space-y-3">
          {installations.length === 0 ? (
            <p className="py-12 text-center text-slate-500">No extensions installed yet. Browse a store to get started.</p>
          ) : installations.map((i) => (
            <div key={i.id} className="command-card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-white">{i.pluginName}</p>
                <p className="text-xs text-slate-500">{i.pluginType} · v{i.installedVersion}{i.updateAvailable && i.latestVersion ? ` → v${i.latestVersion} available` : ''}</p>
              </div>
              <div className="flex gap-2">
                {i.updateAvailable && (
                  <button type="button" disabled={busy === i.pluginId} onClick={() => handleUpgrade(i.pluginId)} className="btn-primary text-xs">
                    {busy === i.pluginId ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Upgrade'}
                  </button>
                )}
                <button type="button" disabled={busy === i.id} onClick={() => handleUninstall(i.id)} className="btn-ghost flex items-center gap-1 text-xs text-red-400">
                  {busy === i.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Uninstall
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'developer' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="command-card p-5">
            <h3 className="font-semibold text-white">Plugin SDK</h3>
            <p className="mt-1 text-sm text-slate-500">Manifest v{(sdk as { manifestVersion?: string })?.manifestVersion} · SDK v{(sdk as { sdkVersion?: string })?.sdkVersion}</p>
            <pre className="mt-4 max-h-80 overflow-auto rounded-lg bg-black/30 p-3 text-xs text-slate-300">{JSON.stringify(sdk, null, 2)}</pre>
          </div>
          <div className="command-card p-5">
            <h3 className="font-semibold text-white">Publish Plugin</h3>
            <p className="mt-1 text-sm text-slate-500">Developer API — extensions install without modifying AFIOS core</p>
            <div className="mt-4 space-y-2">
              {(['pluginId', 'name', 'publisher', 'description', 'category', 'version'] as const).map((field) => (
                <input
                  key={field}
                  placeholder={field}
                  value={publishForm[field]}
                  onChange={(e) => setPublishForm((f) => ({ ...f, [field]: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                />
              ))}
              <select
                value={publishForm.type}
                onChange={(e) => setPublishForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="connector">connector</option>
                <option value="dashboard">dashboard</option>
                <option value="workflow_template">workflow_template</option>
                <option value="report_template">report_template</option>
              </select>
              <button type="button" disabled={busy === 'publish' || !publishForm.pluginId || !publishForm.name} onClick={handlePublish} className="btn-primary w-full">
                {busy === 'publish' ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Publish to Marketplace'}
              </button>
            </div>
          </div>
          {plugins.length > 0 && (
            <div className="lg:col-span-2">
              <h3 className="mb-3 text-sm font-semibold text-white">Published Plugins</h3>
              <div className="grid gap-3 md:grid-cols-2">{plugins.map((p) => <PluginCard key={p.pluginId} plugin={p} busy={busy} onInstall={handleInstall} onRate={(id) => setRatingPlugin(id)} ratingPlugin={ratingPlugin} stars={stars} setStars={setStars} onSubmitRate={handleRate} />)}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {plugins.length === 0 ? (
            <p className="col-span-full py-12 text-center text-slate-500">No plugins in this store yet.</p>
          ) : plugins.map((p) => (
            <PluginCard key={p.pluginId} plugin={p} busy={busy} onInstall={handleInstall} onRate={(id) => setRatingPlugin(id)} ratingPlugin={ratingPlugin} stars={stars} setStars={setStars} onSubmitRate={handleRate} />
          ))}
        </div>
      )}
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

function PluginCard({
  plugin: p, busy, onInstall, onRate, ratingPlugin, stars, setStars, onSubmitRate,
}: {
  plugin: Plugin;
  busy: string | null;
  onInstall: (id: string) => void;
  onRate: (id: string) => void;
  ratingPlugin: string | null;
  stars: number;
  setStars: (n: number) => void;
  onSubmitRate: (id: string) => void;
}) {
  return (
    <div className="command-card flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-white">{p.name}</p>
          <p className="text-xs text-slate-500">{p.publisher} · v{p.version}</p>
        </div>
        <span className="shrink-0 rounded bg-white/5 px-2 py-0.5 text-[10px] uppercase text-slate-400">{p.typeLabel}</span>
      </div>
      <p className="mt-2 flex-1 text-sm text-slate-400">{p.description}</p>
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1 text-amber-400"><Star className="h-3 w-3 fill-current" /> {p.ratingAvg || '—'} ({p.ratingCount})</span>
        <span>{p.installCount} installs</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {p.installed ? (
          <span className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400">Installed</span>
        ) : (
          <button type="button" disabled={busy === p.pluginId} onClick={() => onInstall(p.pluginId)} className="btn-primary text-xs">
            {busy === p.pluginId ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Install'}
          </button>
        )}
        <button type="button" onClick={() => onRate(p.pluginId)} className="btn-ghost text-xs">Rate</button>
      </div>
      {ratingPlugin === p.pluginId && (
        <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
          <select value={stars} onChange={(e) => setStars(Number(e.target.value))} className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white">
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} stars</option>)}
          </select>
          <button type="button" disabled={busy === p.pluginId} onClick={() => onSubmitRate(p.pluginId)} className="btn-primary text-xs">Submit</button>
        </div>
      )}
    </div>
  );
}
