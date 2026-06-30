import { useCallback, useEffect, useState } from 'react';
import { insightsApi, type InsightsQueryParams } from '@/api/client';
import { getStoredToken } from '@/store/auth';

export function useInsightsSection<T>(
  loader: (params?: InsightsQueryParams) => Promise<{ data: T }>,
  params?: InsightsQueryParams,
  refreshMs = 120_000,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    return loader(params)
      .then((res) => setData(res.data))
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load insights'))
      .finally(() => setLoading(false));
  }, [loader, JSON.stringify(params)]);

  useEffect(() => {
    setLoading(true);
    load();
    const t = setInterval(load, refreshMs);
    return () => clearInterval(t);
  }, [load, refreshMs]);

  return { data, loading, error, refresh: load };
}

export function downloadExport(section: string, format: string, params?: InsightsQueryParams, token?: string) {
  const url = insightsApi.exportUrl(section, format, params);
  const headers: Record<string, string> = {};
  const t = token || getStoredToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  return fetch(url, { headers })
    .then(async (res) => {
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `insights-${section}.${format === 'excel' ? 'csv' : format === 'pdf' ? 'pdf' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
}
