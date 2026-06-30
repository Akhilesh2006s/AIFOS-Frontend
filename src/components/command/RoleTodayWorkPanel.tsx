import { useEffect, useState } from 'react';
import { missionControlApi } from '@/api/client';
import { TodayWorkQueue, type TodayWorkItem } from './TodayWorkQueue';

interface RoleTodayWork {
  title: string;
  subtitle: string;
  items: TodayWorkItem[];
  estimatedMinutes: number;
}

export function RoleTodayWorkPanel({ compact }: { compact?: boolean }) {
  const [data, setData] = useState<RoleTodayWork | null>(null);

  useEffect(() => {
    missionControlApi.todayWork().then((r) => setData(r.data)).catch(() => undefined);
  }, []);

  if (!data) return null;

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
