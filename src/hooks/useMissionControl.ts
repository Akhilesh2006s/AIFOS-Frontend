import { useCallback, useEffect, useState } from 'react';
import { missionControlApi } from '@/api/client';
import type { MissionControlOverview } from '@/components/mission-control/types';

export function useMissionControl(refreshMs = 60_000) {
  const [data, setData] = useState<MissionControlOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    return missionControlApi
      .overview()
      .then((res) => setData(res.data))
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load Mission Control'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, refreshMs);
    return () => clearInterval(t);
  }, [load, refreshMs]);

  return { data, loading, error, refresh: load };
}
