import { motion } from 'framer-motion';
import { GlassCard } from './GlassCard';

const activities = [
  { time: '2m ago', event: 'PR-2024-002 submitted for approval', module: 'Procurement', type: 'pending' },
  { time: '15m ago', event: 'CAT 320 utilization reached 78%', module: 'Equipment', type: 'success' },
  { time: '1h ago', event: 'Compliance alert: EQ-003 PC expired', module: 'Compliance', type: 'warning' },
  { time: '2h ago', event: 'GRN-001 received at Site Warehouse', module: 'Inventory', type: 'info' },
  { time: '3h ago', event: 'WO-2024-002 assigned to Tech Team A', module: 'Maintenance', type: 'info' },
];

const dotColors = {
  pending: 'bg-amber-400',
  success: 'bg-emerald-400',
  warning: 'bg-red-400',
  info: 'bg-sky-400',
};

export function ActivityFeed({ delay = 0 }: { delay?: number }) {
  return (
    <GlassCard delay={delay}>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-heading-section">Live Activity</h3>
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-500" aria-hidden />
          Real-time
        </span>
      </div>
      <div className="space-y-0" role="list">
        {activities.map((item, i) => (
          <motion.div
            key={i}
            role="listitem"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            className="flex gap-3 border-b py-3.5 last:border-0"
            style={{ borderColor: 'var(--command-border)' }}
          >
            <div className="flex flex-col items-center pt-1.5" aria-hidden>
              <span className={`h-2 w-2 rounded-full ${dotColors[item.type as keyof typeof dotColors]}`} />
              {i < activities.length - 1 && (
                <div className="mt-1 w-px flex-1 bg-white/10" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-200">{item.event}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  {item.module}
                </span>
                <span className="text-slate-600" aria-hidden>·</span>
                <span className="font-mono text-[10px] tabular-nums text-slate-500">{item.time}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
