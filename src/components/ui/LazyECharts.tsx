import { lazy, Suspense, type CSSProperties } from 'react';
import type { EChartsOption } from 'echarts';

const ReactECharts = lazy(() => import('echarts-for-react'));

interface LazyEChartsProps {
  option: EChartsOption | Record<string, unknown>;
  height?: number;
  opts?: { renderer?: 'canvas' | 'svg' };
}

export function LazyECharts({ option, height = 260, opts }: LazyEChartsProps) {
  return (
    <Suspense
      fallback={
        <div
          className="animate-pulse rounded-lg bg-white/5"
          style={{ height }}
          aria-hidden
        />
      }
    >
      <ReactECharts
        option={option}
        style={{ height } as CSSProperties}
        opts={opts}
      />
    </Suspense>
  );
}
