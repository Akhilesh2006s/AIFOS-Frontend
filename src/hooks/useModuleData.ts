import { useCallback, useEffect, useState } from 'react';

export function useModuleData<T>(loader: () => Promise<{ data: T }>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await loader();
      setData(res.data);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, error, refresh, setData };
}
