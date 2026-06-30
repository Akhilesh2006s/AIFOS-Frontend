import type { EChartsOption } from 'echarts';

export function extractChartTitle(option: EChartsOption | Record<string, unknown>): string {
  const t = (option as EChartsOption).title;
  if (!t) return '';
  if (Array.isArray(t)) return String(t[0]?.text ?? '');
  return String((t as { text?: string }).text ?? '');
}

export function isChartEmpty(option: EChartsOption | Record<string, unknown>): boolean {
  const series = (option as EChartsOption).series;
  if (!series) return true;
  const list = Array.isArray(series) ? series : [series];
  if (list.length === 0) return true;
  return list.every((s) => {
    const data = (s as { data?: unknown[] }).data;
    if (!data || data.length === 0) return true;
    return data.every((d) => d === 0 || d === null || d === undefined);
  });
}
