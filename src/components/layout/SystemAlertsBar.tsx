import { AlertTriangle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Alert {
  id: string;
  message: string;
  severity: 'warning' | 'critical' | 'info';
}

interface SystemAlertsBarProps {
  alerts: Alert[];
}

const severityColors = {
  warning: 'text-amber-400',
  critical: 'text-red-400',
  info: 'text-sky-400',
};

export function SystemAlertsBar({ alerts }: SystemAlertsBarProps) {
  if (!alerts.length) return null;

  return (
    <div className="sticky bottom-0 z-30 border-t border-white/10 bg-command-sidebar/95 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-6 py-2.5">
        <div className="flex shrink-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <AlertTriangle size={14} className="text-amber-400" />
          System Alerts
        </div>

        <div className="flex flex-1 items-center gap-6 overflow-hidden">
          <motion.div
            className="flex gap-8 whitespace-nowrap"
            animate={{ x: [0, -400] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          >
            {[...alerts, ...alerts].map((alert, i) => (
              <span key={`${alert.id}-${i}`} className="flex items-center gap-2 text-xs text-slate-400">
                <span className={severityColors[alert.severity]}>●</span>
                {alert.message}
                <button className="text-accent hover:underline">View</button>
              </span>
            ))}
          </motion.div>
        </div>

        <button className="flex shrink-0 items-center gap-1 text-xs font-medium text-accent hover:text-accent-hover">
          View All Alerts
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
