import { create } from 'zustand';
import { platformApi } from '@/api/client';

export interface TenantBranding {
  organizationId: string;
  themeId?: string;
  themeName?: string;
  displayName?: string;
  tagline?: string;
  logoUrl?: string;
  logoLightUrl?: string;
  logoDarkUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily?: string;
  companyColors: Record<string, string>;
  faviconUrl?: string;
  domain: { customDomain?: string; status?: string };
  email: Record<string, string | undefined>;
  pdf: Record<string, string | undefined>;
  cssVariables?: Record<string, string>;
}

interface BrandState {
  branding: TenantBranding | null;
  loading: boolean;
  load: (organizationId?: string) => Promise<void>;
  apply: (branding: TenantBranding) => void;
}

export const useBrandStore = create<BrandState>((set) => ({
  branding: null,
  loading: false,

  load: async (organizationId) => {
    set({ loading: true });
    try {
      const orgId = organizationId || localStorage.getItem('afios_active_org') || undefined;
      const { data } = await platformApi.tenantBranding(orgId);
      const b = data as TenantBranding;
      set({ branding: b });
      applyBrandingToDocument(b);
    } finally {
      set({ loading: false });
    }
  },

  apply: (branding) => {
    set({ branding });
    applyBrandingToDocument(branding);
  },
}));

export function applyBrandingToDocument(branding: TenantBranding) {
  const root = document.documentElement;
  const vars = branding.cssVariables || {
    '--brand-primary': branding.companyColors?.primary || branding.primaryColor,
    '--brand-secondary': branding.companyColors?.secondary || branding.secondaryColor,
    '--brand-accent': branding.companyColors?.accent || branding.accentColor,
    '--command-bg': branding.companyColors?.secondary || branding.secondaryColor,
    '--command-card': branding.companyColors?.surface || '#0f1d32',
  };
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  if (branding.fontFamily) {
    root.style.setProperty('--font-family-brand', branding.fontFamily);
    document.body.style.fontFamily = branding.fontFamily;
  }
  if (branding.faviconUrl) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = branding.faviconUrl;
  }
  if (branding.displayName) {
    document.title = `${branding.displayName} — AFIOS`;
  }
}

export function useBrandHydration() {
  const load = useBrandStore((s) => s.load);
  return load;
}
