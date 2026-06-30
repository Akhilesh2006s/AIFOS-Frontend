import { useCallback, useEffect, useState } from 'react';
import { missionControlApi } from '@/api/client';
import type { MissionControlOverview } from '@/components/mission-control/types';
import { getApiErrorMessage } from '@/lib/apiHelpers';
import { buildOverviewFallback, toMissionControlOverview } from '@/lib/overviewFallback';
import { useAuthStore } from '@/store/auth';

export function useMissionControl(refreshMs = 60_000) {
  const [data, setData] = useState<MissionControlOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setDegraded(false);
    try {
      const res = await missionControlApi.overview();
      setData(res.data);
    } catch (err) {
      const role = useAuthStore.getState().user?.role;
      const partial = await buildOverviewFallback();
      setData(toMissionControlOverview(partial, role));
      setDegraded(true);
      setError(getApiErrorMessage(err, 'Mission Control overview unavailable — showing summary from module APIs'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, refreshMs);
    return () => clearInterval(t);
  }, [load, refreshMs]);

  return { data, loading, error, degraded, refresh: load };
}
