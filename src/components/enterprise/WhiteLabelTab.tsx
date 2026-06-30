import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Globe, Loader2, Mail, FileText, Palette, Save } from 'lucide-react';
import { platformApi } from '@/api/client';
import { useBrandStore } from '@/store/brand';
import { cn } from '@/lib/utils';

const SUBS = ['themes', 'logos', 'domain', 'email', 'pdf', 'colors'] as const;
type Sub = (typeof SUBS)[number];

interface Props {
  organizationId: string;
}

export function WhiteLabelTab({ organizationId }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sub = (searchParams.get('sub') as Sub) || 'themes';
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState<Array<Record<string, string>>>([]);
  const [branding, setBranding] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const applyBrand = useBrandStore((s) => s.apply);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const [t, b] = await Promise.all([
        platformApi.themes(),
        platformApi.tenantBranding(organizationId),
      ]);
      setThemes((t.data as { themes: Array<Record<string, string>> }).themes || []);
      const br = b.data as Record<string, unknown>;
      setBranding(br);
      const domain = br.domain as { customDomain?: string; status?: string } | undefined;
      const email = br.email as Record<string, string> | undefined;
      const pdf = br.pdf as Record<string, string> | undefined;
      const colors = br.companyColors as Record<string, string> | undefined;
      setForm({
        displayName: String(br.displayName || ''),
        tagline: String(br.tagline || ''),
        logoUrl: String(br.logoUrl || ''),
        logoLightUrl: String(br.logoLightUrl || ''),
        logoDarkUrl: String(br.logoDarkUrl || ''),
        customDomain: String(domain?.customDomain || ''),
        emailFromName: String(email?.fromName || ''),
        emailFromAddress: String(email?.fromAddress || ''),
        emailHeaderColor: String(email?.headerColor || br.primaryColor || '#14b8a6'),
        emailFooter: String(email?.footer || ''),
        emailSignature: String(email?.signature || ''),
        pdfFooterText: String(pdf?.footerText || ''),
        pdfWatermark: String(pdf?.watermark || ''),
        primary: String(colors?.primary || br.primaryColor || '#14b8a6'),
        secondary: String(colors?.secondary || br.secondaryColor || '#0f172a'),
        accent: String(colors?.accent || br.accentColor || '#38bdf8'),
      });
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { load(); }, [load]);

  const setSub = (s: Sub) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'white-label');
    next.set('sub', s);
    if (organizationId) next.set('org', organizationId);
    setSearchParams(next);
  };

  const save = async (patch: object) => {
    const { data } = await platformApi.updateTenantBranding(organizationId, patch);
    applyBrand(data as Parameters<typeof applyBrand>[0]);
    load();
  };

  const applyTheme = async (themeId: string) => {
    await platformApi.applyTheme(organizationId, themeId);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-16 text-slate-500"><Loader2 className="animate-spin" size={20} /></div>;
  }

  const subNav = (
    <div className="mb-4 flex flex-wrap gap-1">
      {([
        { id: 'themes' as const, label: 'Themes', icon: Palette },
        { id: 'logos' as const, label: 'Logos', icon: Globe },
        { id: 'domain' as const, label: 'Domain', icon: Globe },
        { id: 'email' as const, label: 'Email', icon: Mail },
        { id: 'pdf' as const, label: 'PDF', icon: FileText },
        { id: 'colors' as const, label: 'Colors', icon: Palette },
      ]).map((s) => (
        <button key={s.id} onClick={() => setSub(s.id)} className={cn('flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition', sub === s.id ? 'bg-violet-500/20 text-violet-300' : 'text-slate-500 hover:bg-white/5')}>
          <s.icon size={12} /> {s.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {subNav}

      {sub === 'themes' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => applyTheme(String(theme.id))}
              className={cn('command-card p-4 text-left transition hover:border-violet-500/40', branding?.themeId === theme.id && 'border-violet-500/50 ring-1 ring-violet-500/30')}
            >
              <div className="mb-3 h-12 rounded-lg" style={{ background: String(theme.previewGradient) }} />
              <h3 className="font-semibold text-white">{theme.name}</h3>
              <p className="mt-1 text-xs text-slate-500">{theme.description}</p>
            </button>
          ))}
        </div>
      )}

      {sub === 'logos' && (
        <div className="command-card max-w-lg space-y-3 p-5">
          {(['logoUrl', 'logoLightUrl', 'logoDarkUrl', 'displayName', 'tagline'] as const).map((key) => (
            <label key={key} className="block text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}
              <input value={form[key] || ''} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" />
            </label>
          ))}
          <button onClick={() => save({ logoUrl: form.logoUrl, logoLightUrl: form.logoLightUrl, logoDarkUrl: form.logoDarkUrl, displayName: form.displayName, tagline: form.tagline })} className="flex items-center gap-1 rounded-lg bg-violet-600 px-4 py-2 text-sm text-white"><Save size={14} /> Save Logos</button>
        </div>
      )}

      {sub === 'domain' && (
        <div className="command-card max-w-lg space-y-3 p-5">
          <label className="block text-xs text-slate-500">Custom Domain
            <input value={form.customDomain} onChange={(e) => setForm((f) => ({ ...f, customDomain: e.target.value }))} placeholder="yourcompany.afios.app" className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" />
          </label>
          <p className="text-xs text-slate-500">Status: {(branding?.domain as { status?: string })?.status || 'pending'} — CNAME to <code className="text-violet-400">app.afios.io</code></p>
          <button onClick={() => save({ customDomain: form.customDomain, domainStatus: 'pending' })} className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white">Save Domain</button>
        </div>
      )}

      {sub === 'email' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="command-card space-y-3 p-5">
            {(['emailFromName', 'emailFromAddress', 'emailHeaderColor', 'emailFooter', 'emailSignature'] as const).map((key) => (
              <label key={key} className="block text-xs text-slate-500">{key.replace('email', '')}
                <input value={form[key] || ''} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" />
              </label>
            ))}
            <button onClick={() => save({
              emailFromName: form.emailFromName, emailFromAddress: form.emailFromAddress,
              emailHeaderColor: form.emailHeaderColor, emailFooter: form.emailFooter, emailSignature: form.emailSignature,
            })} className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white">Save Email Branding</button>
          </div>
          <div className="command-card overflow-hidden p-0">
            <div className="px-4 py-3 text-white" style={{ backgroundColor: form.emailHeaderColor }}>{form.emailFromName || 'Your Company'}</div>
            <div className="p-4 text-sm text-slate-400">
              <p>Sample notification body…</p>
              <p className="mt-4 border-t border-white/10 pt-3 text-xs">{form.emailFooter}</p>
              <p className="mt-1 text-xs text-slate-500">{form.emailSignature}</p>
            </div>
          </div>
        </div>
      )}

      {sub === 'pdf' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="command-card space-y-3 p-5">
            <label className="block text-xs text-slate-500">PDF Footer<input value={form.pdfFooterText} onChange={(e) => setForm((f) => ({ ...f, pdfFooterText: e.target.value }))} className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
            <label className="block text-xs text-slate-500">Watermark<input value={form.pdfWatermark} onChange={(e) => setForm((f) => ({ ...f, pdfWatermark: e.target.value }))} className="mt-1 w-full rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white" /></label>
            <button onClick={() => save({ pdfFooterText: form.pdfFooterText, pdfWatermark: form.pdfWatermark, pdfHeaderColor: form.primary })} className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white">Save PDF Branding</button>
          </div>
          <div className="command-card relative min-h-[200px] p-6">
            <div className="border-b pb-2 font-semibold" style={{ color: form.primary }}>{form.displayName} — Report</div>
            <p className="mt-4 text-sm text-slate-400">Sample PDF content area…</p>
            <p className="absolute bottom-4 left-6 right-6 border-t border-white/10 pt-2 text-xs text-slate-500">{form.pdfFooterText}</p>
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-6xl font-bold opacity-5 text-white">{form.pdfWatermark}</span>
          </div>
        </div>
      )}

      {sub === 'colors' && (
        <div className="command-card max-w-lg space-y-3 p-5">
          <div className="grid grid-cols-3 gap-3">
            {(['primary', 'secondary', 'accent'] as const).map((key) => (
              <label key={key} className="block text-xs text-slate-500 capitalize">{key}
                <input type="color" value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className="mt-1 h-10 w-full cursor-pointer rounded border border-white/10 bg-transparent" />
              </label>
            ))}
          </div>
          <button onClick={() => save({
            primaryColor: form.primary, secondaryColor: form.secondary, accentColor: form.accent,
            companyColors: { primary: form.primary, secondary: form.secondary, accent: form.accent, success: '#22c55e', warning: '#f59e0b', danger: '#ef4444', surface: '#0f1d32', text: '#e2e8f0' },
          })} className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white">Save Company Colors</button>
        </div>
      )}
    </div>
  );
}
