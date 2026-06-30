import { useCallback, useEffect, useState } from 'react';
import { missionControlApi } from '@/api/client';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageLoader } from '@/components/layout/PageShell';
import { getApiErrorMessage } from '@/lib/apiHelpers';
import { TodayWorkQueue, type TodayWorkItem } from './TodayWorkQueue';

interface RoleTodayWork {
  title: string;
  subtitle: string;
  items: TodayWorkItem[];
  estimatedMinutes: number;
}

export function RoleTodayWorkPanel({ compact }: { compact?: boolean }) {
  const [data, setData] = useState<RoleTodayWork | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await missionControlApi.todayWork();
      setData(res.data ?? null);
    } catch (e) {
      setData(null);
      setError(getApiErrorMessage(e, 'Could not load today\'s work'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <PageLoader message="Loading today's work…" />;
  if (error && !data?.items?.length) {
    return <ErrorState title="Today's work" message={error} onRetry={load} />;
  }
  if (!data?.items?.length) {
    return (
      <div className="command-card p-6 text-center text-sm text-slate-500">
        No work items queued for today.
      </div>
    );
  }

  return (
    <TodayWorkQueue
      title={data.title}
      subtitle={data.subtitle}
      items={data.items}
      estimatedMinutes={data.estimatedMinutes}
      compact={compact}
    />
  );
}
