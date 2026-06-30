import { create } from 'zustand';
import { platformApi } from '@/api/client';

interface LocaleState {
  locale: string;
  direction: 'ltr' | 'rtl';
  strings: Record<string, string>;
  setLocale: (locale: string, organizationId?: string) => Promise<void>;
  t: (key: string, fallback?: string) => string;
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  locale: localStorage.getItem('afios_locale') || 'en',
  direction: 'ltr',
  strings: {},

  setLocale: async (locale, organizationId) => {
    localStorage.setItem('afios_locale', locale);
    const { data } = await platformApi.localization(locale, organizationId);
    const payload = data as { locale: string; direction: 'ltr' | 'rtl'; strings: Record<string, string> };
    set({ locale: payload.locale, direction: payload.direction, strings: payload.strings });
    document.documentElement.dir = payload.direction;
    document.documentElement.lang = payload.locale;
  },

  t: (key, fallback) => get().strings[key] || fallback || key,
}));
