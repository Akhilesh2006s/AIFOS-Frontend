import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { PanelLeftClose, PanelLeft, Home } from 'lucide-react';
import { WORKSPACES, WORKSPACE_NAV, LAUNCHER_WORKSPACES, PROJECT_TABS, workspaceFromPath, getWorkspace, type WorkspaceDef } from '@/config/workspaces';
import { getVisibleWorkspaces } from '@/config/roleDashboardRegistry';
import { filterPathsByRole } from '@/config/rbac';
import { useAuthStore } from '@/store/auth';
import { useCloudStats, getWorkspaceStatLines, getWorkspaceProgress } from '@/hooks/useCloudStats';
import { useUiStore } from '@/store/ui';
import { useWorkspaceStore } from '@/store/workspace';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/icons/AppIcon';

export function WorkspaceSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { activeWorkspace, setWorkspace } = useWorkspaceStore();
  const { stats } = useCloudStats();
  const { user } = useAuthStore();
  const role = user?.role ?? 'user';
  const visibleWorkspaceIds = getVisibleWorkspaces(role);

  useEffect(() => {
    setWorkspace(workspaceFromPath(location.pathname));
  }, [location.pathname, setWorkspace]);

  const ws = getWorkspace(activeWorkspace);
  const navItems = filterPathsByRole(role, WORKSPACE_NAV[activeWorkspace] ?? []);
  const isCommand = activeWorkspace === 'command';
  const isProjectDetail = /^\/projects\/[^/]+/.test(location.pathname);
  const isAdminRole = role === 'admin' || role === 'org_admin';
  const launcherWorkspaces = LAUNCHER_WORKSPACES.filter((app) => {
    if (!visibleWorkspaceIds) return app.id === 'command';
    return visibleWorkspaceIds.includes(app.id);
  });

  const launchApp = (app: WorkspaceDef) => {
    setWorkspace(app.id);
    navigate(app.defaultPath);
  };

  return (
    <aside
      className={cn(
        'command-sidebar flex h-full flex-col border-r border-white/5 bg-command-sidebar transition-all duration-300',
        sidebarCollapsed ? 'w-[72px]' : 'w-[272px]',
      )}
      style={{ borderColor: `color-mix(in srgb, ${ws.color} 12%, transparent)` }}
    >
      {!sidebarCollapsed && (
        <div className="border-b border-white/5 px-4 py-4">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600">AFIOS</p>
          <h2 className="mt-1 font-display text-lg font-bold text-white">
            {isCommand ? 'Mission Control' : `${ws.label}`}
          </h2>
          <p className="text-[10px] text-slate-500">{isCommand ? 'Infrastructure OS' : `${ws.label} Workspace`}</p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
        {isCommand ? (
          <>
            <SectionLabel collapsed={sidebarCollapsed}>Mission Control</SectionLabel>
            <NavLink to="/" end className={navLinkClass(sidebarCollapsed, location.pathname === '/')}>
              <Home size={16} />
              {!sidebarCollapsed && <span>Home</span>}
            </NavLink>

            <SectionLabel collapsed={sidebarCollapsed} className="mt-5">Workspaces</SectionLabel>
            {launcherWorkspaces.map((app) => (
              <AppLauncherCard
                key={app.id}
                ws={app}
                lines={getWorkspaceStatLines(app.id, stats)}
                progress={getWorkspaceProgress(app.id, stats)}
                collapsed={sidebarCollapsed}
                onLaunch={() => launchApp(app)}
                active={activeWorkspace === app.id && location.pathname !== '/'}
              />
            ))}

            {isAdminRole && (
              <>
                <SectionLabel collapsed={sidebarCollapsed} className="mt-5">Platform</SectionLabel>
                <AppLauncherCard
                  ws={WORKSPACES.find((w) => w.id === 'admin')!}
                  lines={role === 'admin' ? ['Users', 'Settings', 'Enterprise'] : ['Users', 'Roles', 'Settings']}
                  progress={100}
                  collapsed={sidebarCollapsed}
                  onLaunch={() => launchApp(WORKSPACES.find((w) => w.id === 'admin')!)}
                  active={location.pathname.startsWith('/admin')}
                />
              </>
            )}
          </>
        ) : isProjectDetail ? (
          <ProjectContextNav collapsed={sidebarCollapsed} projectPath={location.pathname.split('?')[0]} />
        ) : (
          <>
            <button
              type="button"
              onClick={() => launchApp(ws)}
              className="mb-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-500 hover:bg-white/5 hover:text-slate-300"
            >
              {!sidebarCollapsed && <span>← {ws.label} home</span>}
            </button>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                title={item.label}
                className={({ isActive }) => navItemClass(isActive)}
                style={({ isActive }) => (isActive ? { borderLeftColor: ws.color } : undefined)}
              >
                {item.icon && <item.icon size={16} className="shrink-0 opacity-70" style={{ color: ws.color }} />}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-white/5 p-2">
        <button onClick={toggleSidebar} className="command-nav-item w-full justify-center gap-2 text-slate-500 hover:text-white">
          {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}

function ProjectContextNav({ collapsed, projectPath }: { collapsed: boolean; projectPath: string }) {
  const location = useLocation();
  const tab = new URLSearchParams(location.search).get('tab') || 'overview';
  return (
    <>
      <SectionLabel collapsed={collapsed}>Project</SectionLabel>
      <NavLink to="/projects" className={navLinkClass(collapsed, false)}>
        {!collapsed && <span>← Portfolio</span>}
      </NavLink>
      {PROJECT_TABS.map((t) => {
        const active = tab === t.id;
        return (
          <NavLink
            key={t.id}
            to={t.id === 'overview' ? projectPath : `${projectPath}?tab=${t.id}`}
            end={t.id === 'overview'}
            className={navLinkClass(collapsed, active)}
          >
            {!collapsed && <span>{t.label}</span>}
          </NavLink>
        );
      })}
    </>
  );
}

function navLinkClass(collapsed: boolean, active: boolean) {
  return cn(
    'mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
    active ? 'bg-white/10 text-white ring-1 ring-white/10' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
    collapsed && 'justify-center',
  );
}

function navItemClass(isActive: boolean) {
  return cn(
    'mb-0.5 flex items-center gap-3 rounded-xl border-l-2 px-3 py-2.5 text-sm transition-all',
    isActive ? 'bg-white/10 text-white ring-1 ring-white/10' : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200',
  );
}

function SectionLabel({ children, collapsed, className }: { children: string; collapsed: boolean; className?: string }) {
  return (
    <p className={cn('mb-2 px-3 text-[9px] font-semibold uppercase tracking-widest text-slate-600', collapsed && 'sr-only', className)}>
      {children}
    </p>
  );
}

function AppLauncherCard({
  ws, lines, progress, collapsed, onLaunch, active,
}: {
  ws: WorkspaceDef; lines: string[]; progress: number; collapsed: boolean; onLaunch: () => void; active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onLaunch}
      title={ws.label}
      className={cn(
        'group mb-2 w-full rounded-2xl border p-3 text-left transition-all duration-200',
        active ? 'border-white/20 bg-white/[0.08] shadow-lg' : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.05]',
      )}
      style={active ? { borderColor: `${ws.color}44`, boxShadow: `0 4px 24px ${ws.color}15` } : undefined}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex shrink-0 items-center justify-center rounded-xl ring-1', ws.ringClass)} style={{ backgroundColor: `${ws.color}12` }}>
          <AppIcon id={ws.id} size={collapsed ? 36 : 40} />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-100">{ws.label}</p>
            {lines.map((line) => <p key={line} className="text-[10px] text-slate-500">{line}</p>)}
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: ws.color }} />
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
