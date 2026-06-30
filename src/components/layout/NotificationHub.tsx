import { useState } from 'react';
import { Bell, CheckSquare, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'alerts', label: 'Alerts', count: 7, icon: AlertTriangle },
  { id: 'tasks', label: 'Tasks', count: 12, icon: CheckSquare },
  { id: 'approvals', label: 'Approvals', count: 5, icon: Bell },
] as const;

export function NotificationHub() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('alerts');
  const total = TABS.reduce((s, t) => s + t.count, 0);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="command-icon-btn relative flex items-center gap-2 px-3">
        <Bell size={18} />
        <span className="hidden text-xs text-slate-400 sm:inline">Inbox</span>
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
          {total}
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-white/10 bg-command-sidebar shadow-glassxl">
            <div className="flex border-b border-white/10">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-0.5 py-3 text-[10px] font-medium transition-colors',
                    tab === t.id ? 'border-b-2 border-accent text-white' : 'text-slate-500 hover:text-slate-300',
                  )}
                >
                  <t.icon size={14} />
                  {t.label}
                  <span className="font-mono text-accent">{t.count}</span>
                </button>
              ))}
            </div>
            <div className="max-h-64 overflow-y-auto p-3 space-y-2">
              {tab === 'alerts' && (
                <>
                  <NotifItem severity="warning" text="Insurance expired for 2 equipment" />
                  <NotifItem severity="critical" text="Safety training pending — 48 workers" />
                </>
              )}
              {tab === 'tasks' && (
                <>
                  <NotifItem severity="info" text="GRN pending QC — WH-HYD-01" />
                  <NotifItem severity="info" text="Foundation pour scheduled tomorrow" />
                </>
              )}
              {tab === 'approvals' && (
                <>
                  <NotifItem severity="warning" text="PR-2025-0002 awaiting L1 approval" />
                  <NotifItem severity="warning" text="PO-2025-0842 pending executive sign-off" />
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NotifItem({ text, severity }: { text: string; severity: 'warning' | 'critical' | 'info' }) {
  const colors = { warning: 'text-amber-400', critical: 'text-red-400', info: 'text-sky-400' };
  return (
    <div className="rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/5">
      <span className={cn('text-[10px] font-semibold uppercase', colors[severity])}>● {severity}</span>
      <p className="mt-1 text-xs text-slate-300">{text}</p>
    </div>
  );
}
