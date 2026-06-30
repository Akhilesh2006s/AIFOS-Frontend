import { useEffect, useState } from 'react';
import { Search, ChevronDown, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useUiStore } from '@/store/ui';
import { useWorkspaceStore } from '@/store/workspace';
import { formatDate, localeMeta } from '@/lib/locale';
import { QuickActionMenu } from './QuickActionMenu';
import { NotificationHub } from './NotificationHub';
import { cn } from '@/lib/utils';

export function CommandHeader() {
  const { user } = useAuthStore();
  const locale = useUiStore((s) => s.locale);
  const setCommandPaletteOpen = useWorkspaceStore((s) => s.setCommandPaletteOpen);
  const meta = localeMeta[locale];
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString(locale === 'IN' ? 'en-IN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-command-bg/90 px-4 py-3 backdrop-blur-xl lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="relative flex flex-1 max-w-2xl items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-left transition-colors hover:border-white/20 hover:bg-white/[0.07]"
        >
          <Search size={16} className="shrink-0 text-slate-500" />
          <span className="flex-1 text-sm text-slate-500">
            Search Project, Equipment, PO, Vendor, Invoice…
          </span>
          <div className="hidden items-center gap-1 sm:flex">
            {['Project', 'Equipment', 'PO', 'Vendor'].map((chip) => (
              <span key={chip} className="rounded-md border border-white/5 bg-white/[0.03] px-1.5 py-0.5 text-[9px] text-slate-600">
                {chip}
              </span>
            ))}
          </div>
          <kbd className="hidden rounded-md border border-white/10 bg-command-sidebar px-2 py-0.5 font-mono text-[10px] text-slate-500 sm:inline">
            ⌘ K
          </kbd>
        </button>

        <QuickActionMenu />
        <NotificationHub />
        <UserMenu name={user?.name} role={user?.role} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-slate-600">
        <span>{formatDate(locale)} · {timeStr}</span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {meta.city}, {meta.country}
        </span>
      </div>
    </header>
  );
}

function UserMenu({ name, role }: { name?: string; role?: string }) {
  const { logout } = useAuthStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 hover:bg-white/10"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-navy-light to-accent/60 text-xs font-bold text-white">
          {name?.charAt(0) || 'A'}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-xs font-medium text-slate-200">{name || 'AFIOS Admin'}</p>
          <p className="text-[10px] capitalize text-slate-500">{role}</p>
        </div>
        <ChevronDown size={14} className={cn('text-slate-500', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-white/10 bg-command-sidebar py-1 shadow-glassxl">
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
