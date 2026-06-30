import { useNavigate } from 'react-router-dom';
import { WORKSPACES, type WorkspaceId } from '@/config/workspaces';
import { getVisibleWorkspaces } from '@/config/roleDashboardRegistry';
import { useWorkspaceStore } from '@/store/workspace';
import { useAuthStore } from '@/store/auth';
import { AppIcon } from '@/components/icons/AppIcon';
import { cn } from '@/lib/utils';

export function MissionControlBar() {
  const navigate = useNavigate();
  const { activeWorkspace, setWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const visibleIds = getVisibleWorkspaces(user?.role);
  const isAdminRole = user?.role === 'admin' || user?.role === 'org_admin';

  const switchTo = (id: WorkspaceId, path: string) => {
    setWorkspace(id);
    navigate(path);
  };

  const navWorkspaces = WORKSPACES.filter((w) => {
    if (w.id === 'admin') return isAdminRole;
    if (!visibleIds) return w.id === 'command';
    return visibleIds.includes(w.id);
  });

  return (
    <div className="border-b border-white/5 bg-command-sidebar/95 backdrop-blur-xl">
      <div className="flex items-center gap-6 px-4 py-2.5 lg:px-6">
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20 ring-1 ring-accent/30">
            <span className="text-xs font-bold text-accent">◆</span>
          </div>
          <span className="font-display text-xs font-bold tracking-[0.2em] text-white">AFIOS</span>
        </div>

        <div className="h-5 w-px bg-white/10 hidden sm:block" />

        <div className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-thin pb-0.5">
          {navWorkspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => switchTo(ws.id, ws.defaultPath)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all',
                activeWorkspace === ws.id
                  ? 'bg-white/10 text-white ring-1 ring-white/15 shadow-glow'
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-300',
              )}
              style={activeWorkspace === ws.id ? { boxShadow: `0 0 24px ${ws.color}22` } : undefined}
            >
              <AppIcon id={ws.id} size={22} />
              <span className="hidden md:inline">{ws.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
