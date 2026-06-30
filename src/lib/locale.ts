export type LocaleMode = 'IN' | 'GLOBAL';

export function formatCurrency(amount: number, locale: LocaleMode = 'IN'): string {
  if (locale === 'IN') {
    if (amount >= 1_00_00_000) return `₹ ${(amount / 1_00_00_000).toFixed(2)} Cr`;
    if (amount >= 1_00_000) return `₹ ${(amount / 1_00_000).toFixed(2)} L`;
    return `₹ ${amount.toLocaleString('en-IN')}`;
  }
  if (amount >= 1_000_000) return `$ ${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `$ ${(amount / 1_000).toFixed(1)}K`;
  return `$ ${amount.toLocaleString('en-US')}`;
}

export function formatDate(locale: LocaleMode = 'IN'): string {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  return new Date().toLocaleDateString(locale === 'IN' ? 'en-IN' : 'en-US', opts);
}

export const localeMeta = {
  IN: { city: 'Hyderabad', country: 'India', temp: '32°C', weather: 'Clear Sky' },
  GLOBAL: { city: 'Singapore', country: 'APAC Hub', temp: '29°C', weather: 'Partly Cloudy' },
} as const;
