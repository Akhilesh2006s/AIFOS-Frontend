import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2, Globe, Languages, Layers, Loader2, MapPin, RefreshCw, Settings, Shield,
} from 'lucide-react';
import { platformApi } from '@/api/client';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { ModuleTabs } from '@/components/layout/ModuleTabs';
import { WhiteLabelTab } from '@/components/enterprise/WhiteLabelTab';
import { useLocaleStore } from '@/store/locale';

const TABS = ['dashboard', 'hierarchy', 'regional', 'localization', 'settings', 'white-label'] as const;
type TabId = (typeof TABS)[number];

const TAB_LABELS: Record<TabId, string> = {
  dashboard: 'Dashboard',
  hierarchy: 'Hierarchy',
  regional: 'Regional',
  localization: 'Localization',
  settings: 'Settings',
  'white-label': 'White Label',
};

type RegionalProfile = {
  id: string;
  orgUnitName: string;
  countryName: string;
  countryCode: string;
  currency: string;
  locale: string;
  timezone: string;
  complianceName?: string;
  complianceRequirements?: string[];
};

export function EnterpriseWorkspacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as TabId) || 'dashboard';
  const orgParam = searchParams.get('org') || '';
  const { locale, setLocale, t, strings } = useLocaleStore();
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<Record<string, unknown> | null>(null);
  const [hierarchy, setHierarchy] = useState<Record<string, unknown> | null>(null);
  const [, setSettings] = useState<Record<string, unknown> | null>(null);
  const [, setBranding] = useState<Record<string, unknown> | null>(null);
  const [regional, setRegional] = useState<RegionalProfile[]>([]);
  const [catalog, setCatalog] = useState<Record<string, unknown> | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState(orgParam);
  const [settingsForm, setSettingsForm] = useState({
    timezone: 'Asia/Kolkata', currency: 'INR', locale: 'en-IN', defaultCountry: 'IN',
    supportedCountries: ['IN'], supportedCurrencies: ['INR'], primaryLanguage: 'en', supportedLanguages: ['en'],
    dataIsolationEnabled: true,
  });
  const [localeChoice, setLocaleChoice] = useState(locale);

  const organizations = (dash?.organizations || []) as Array<{ id: string; name: string; code?: string }>;
  const activeOrgId = selectedOrgId || organizations[0]?.id || '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, h, s, b, r, cat] = await Promise.all([
        platformApi.dashboard(),
        activeOrgId ? platformApi.hierarchy(activeOrgId) : Promise.resolve({ data: null }),
        activeOrgId ? platformApi.settings(activeOrgId) : Promise.resolve({ data: null }),
        activeOrgId ? platformApi.branding(activeOrgId) : Promise.resolve({ data: null }),
        activeOrgId ? platformApi.regional(activeOrgId) : platformApi.regional(),
        platformApi.catalog(),
      ]);
      setDash(d.data);
      setHierarchy(h.data);
      setSettings(s.data);
      setBranding(b.data);
      setRegional((r.data as RegionalProfile[]) || []);
      setCatalog(cat.data);
      if (s.data) {
        const st = s.data as Record<string, unknown>;
        setSettingsForm({
          timezone: String(st.timezone || 'Asia/Kolkata'),
          currency: String(st.currency || 'INR'),
          locale: String(st.locale || 'en-IN'),
          defaultCountry: String(st.defaultCountry || 'IN'),
          supportedCountries: (st.supportedCountries as string[]) || ['IN'],
          supportedCurrencies: (st.supportedCurrencies as string[]) || ['INR'],
          primaryLanguage: String(st.primaryLanguage || 'en'),
          supportedLanguages: (st.supportedLanguages as string[]) || ['en'],
          dataIsolationEnabled: Boolean(st.dataIsolationEnabled ?? true),
        });
        setLocaleChoice(String(st.locale || st.primaryLanguage || 'en'));
      }
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => { load(); }, [load]);

  const setTab = (t: TabId) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    if (activeOrgId) next.set('org', activeOrgId);
    setSearchParams(next);
  };

  const onOrgChange = (id: string) => {
    setSelectedOrgId(id);
    const next = new URLSearchParams(searchParams);
    next.set('org', id);
    setSearchParams(next);
  };

  const saveSettings = async () => {
    if (!activeOrgId) return;
    await platformApi.updateSettings(activeOrgId, settingsForm);
    load();
  };

  const applyLocale = async () => {
    await setLocale(localeChoice, activeOrgId || undefined);
  };

  const kpis = (dash?.kpis || {}) as Record<string, number>;
  const countries = (catalog?.countries || []) as Array<{ code: string; name: string }>;
  const languages = (catalog?.languages || []) as Array<{ code: string; name: string; nativeName: string }>;
  const tree = hierarchy as {
    organization?: { name: string; code?: string };
    hierarchy?: Array<{ name: string; unitLabel: string; code: string; children?: unknown[] }>;
    projects?: Array<{ code: string; name: string; status: string }>;
  } | null;

  const tabs = (
    <div className="flex flex-wrap items-end gap-3">
      <ModuleTabs
        className="min-w-0 flex-1"
        tabs={TABS.map((t) => ({ id: t, label: TAB_LABELS[t] }))}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
      />
      {organizations.length > 0 && (
        <select value={activeOrgId} onChange={(e) => onOrgChange(e.target.value)} className="select-field shrink-0 text-xs">
          {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}{o.code ? ` (${o.code})` : ''}</option>)}
        </select>
      )}
      <button type="button" onClick={load} className="btn-ghost btn-sm flex shrink-0 items-center gap-1">
        <RefreshCw size={12} /> Refresh
      </button>
    </div>
  );

  if (loading) {
    return (
      <ModulePageLayout title="Enterprise Platform" subtitle="Multi-organization · global · localized" loading={false} tabs={tabs}>
        <div className="flex items-center justify-center py-20 text-slate-500"><Loader2 className="mr-2 animate-spin" size={18} /> Loading enterprise platform…</div>
      </ModulePageLayout>
    );
  }

  return (
    <ModulePageLayout title="Enterprise Platform" subtitle="Parent company · multi-country · currency · language · compliance" loading={false} tabs={tabs}>
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: 'Parent Companies', value: kpis.parentCompanies ?? 0, icon: Globe },
              { label: 'Organizations', value: kpis.organizations ?? 0, icon: Building2 },
              { label: 'Org Units', value: kpis.orgUnits ?? 0, icon: Layers },
              { label: 'Regional Profiles', value: regional.length, icon: MapPin },
              { label: 'Countries', value: new Set(regional.map((r) => r.countryCode)).size, icon: Shield },
            ].map((k) => (
              <div key={k.label} className="command-card p-4">
                <k.icon size={16} className="mb-2 text-violet-400" />
                <p className="text-2xl font-bold text-white">{k.value}</p>
                <p className="text-xs text-slate-500">{k.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'hierarchy' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">{tree?.organization?.name} — org hierarchy with regional profiles on branches/regions</p>
          <div className="command-card p-4">
            {(tree?.hierarchy?.length ?? 0) === 0 ? <p className="text-sm text-slate-500">No org units.</p> : <HierarchyTree nodes={tree!.hierarchy!} />}
          </div>
        </div>
      )}

      {tab === 'regional' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Regional settings per branch/region — country, currency, timezone, compliance pack</p>
          <div className="space-y-3">
            {regional.length === 0 ? (
              <p className="text-sm text-slate-500">No regional profiles. They are seeded on server startup for configured branches.</p>
            ) : regional.map((r) => (
              <div key={r.id} className="command-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-white">{r.orgUnitName}</h3>
                    <p className="text-xs text-slate-500">{r.countryName} ({r.countryCode})</p>
                  </div>
                  <span className="rounded bg-violet-500/20 px-2 py-0.5 text-xs text-violet-300">{r.complianceName || 'Compliance'}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400 sm:grid-cols-4">
                  <span>{t('label.currency', 'Currency')}: <strong className="text-white">{r.currency}</strong></span>
                  <span>{t('label.timezone', 'Timezone')}: <strong className="text-white">{r.timezone}</strong></span>
                  <span>Locale: <strong className="text-white">{r.locale}</strong></span>
                  <span>{t('label.country', 'Country')}: <strong className="text-white">{r.countryCode}</strong></span>
                </div>
                {(r.complianceRequirements?.length ?? 0) > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1">
                    {r.complianceRequirements!.map((req) => (
                      <li key={req} className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">{req}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <div className="command-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-300">Supported Countries (catalog)</h3>
            <div className="flex flex-wrap gap-2">
              {countries.map((c) => (
                <span key={c.code} className="rounded border border-white/10 px-2 py-1 text-xs text-slate-400">{c.name}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'localization' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="command-card space-y-4 p-5">
            <h3 className="flex items-center gap-2 font-semibold text-white"><Languages size={16} /> Language & Locale</h3>
            <select value={localeChoice} onChange={(e) => setLocaleChoice(e.target.value)} className="w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white">
              {languages.map((l) => <option key={l.code} value={l.code}>{l.name} — {l.nativeName}</option>)}
            </select>
            <button onClick={applyLocale} className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500">{t('action.save', 'Apply Locale')}</button>
            <p className="text-xs text-slate-500">Active: {locale} · {Object.keys(strings).length} strings loaded</p>
          </div>
          <div className="command-card p-5">
            <h3 className="mb-3 font-semibold text-slate-300">Preview</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              {Object.entries(strings).slice(0, 12).map(([k, v]) => (
                <li key={k}><span className="font-mono text-xs text-slate-600">{k}</span> → {v}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="command-card max-w-xl space-y-4 p-5">
          <h3 className="flex items-center gap-2 font-semibold text-white"><Settings size={16} /> Organization Settings</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-slate-500">Default Country
              <select value={settingsForm.defaultCountry} onChange={(e) => setSettingsForm((f) => ({ ...f, defaultCountry: e.target.value }))} className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white">
                {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </label>
            <label className="block text-xs text-slate-500">Currency<input value={settingsForm.currency} onChange={(e) => setSettingsForm((f) => ({ ...f, currency: e.target.value }))} className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
            <label className="block text-xs text-slate-500">Timezone<input value={settingsForm.timezone} onChange={(e) => setSettingsForm((f) => ({ ...f, timezone: e.target.value }))} className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
            <label className="block text-xs text-slate-500">Primary Language
              <select value={settingsForm.primaryLanguage} onChange={(e) => setSettingsForm((f) => ({ ...f, primaryLanguage: e.target.value }))} className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white">
                {languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </label>
          </div>
          <button onClick={saveSettings} className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500">{t('action.save', 'Save Settings')}</button>
        </div>
      )}

      {tab === 'white-label' && activeOrgId && (
        <WhiteLabelTab organizationId={activeOrgId} />
      )}
    </ModulePageLayout>
  );
}

function HierarchyTree({ nodes, depth = 0 }: { nodes: Array<{ name: string; unitLabel: string; code: string; children?: unknown[] }>; depth?: number }) {
  return (
    <ul className={depth > 0 ? 'ml-4 border-l border-white/10 pl-3' : ''}>
      {nodes.map((n, i) => (
        <li key={i} className="py-1">
          <span className="text-sm text-white">{n.name}</span>
          <span className="ml-2 text-xs text-violet-400">{n.unitLabel}</span>
          <span className="ml-2 font-mono text-xs text-slate-600">{n.code}</span>
          {Array.isArray(n.children) && n.children.length > 0 && (
            <HierarchyTree nodes={n.children as Array<{ name: string; unitLabel: string; code: string; children?: unknown[] }>} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}
