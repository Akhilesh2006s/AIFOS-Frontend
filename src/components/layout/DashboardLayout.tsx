import { Outlet, Navigate } from 'react-router-dom';
import { useEffect, useState, type CSSProperties } from 'react';
import { MissionControlBar } from './MissionControlBar';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { CommandHeader } from './CommandHeader';
import { SystemAlertsBar } from './SystemAlertsBar';
import { CommandPalette } from './CommandPalette';
import { BrandHydrator } from '@/components/brand/BrandHydrator';
import { ToastHost } from '@/components/ui/ToastHost';
import { ProjectContextBar } from './ProjectContextBar';
import { useAuthStore, getStoredToken } from '@/store/auth';
import { useUiStore } from '@/store/ui';
import { analyticsApi } from '@/api/client';
import { getWorkspace } from '@/config/workspaces';
import { useWorkspaceStore } from '@/store/workspace';

type SystemAlert = { id: string; message: string; severity: 'warning' | 'critical' | 'info' };

export function DashboardLayout() {
  const { token, hydrate } = useAuthStore();
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const ws = getWorkspace(activeWorkspace);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  useEffect(() => { hydrate(); }, [hydrate]);

  useEffect(() => {
    analyticsApi.executive().then((res) => {
      if (res.data?.systemAlerts?.length) setAlerts(res.data.systemAlerts);
    }).catch(() => {});
  }, []);

  if (!token && !getStoredToken()) {
    return <Navigate to="/login" replace />;
  }

  const sidebarWidth = sidebarCollapsed ? 72 : 272;

  return (
    <div
      className="command-shell flex min-h-screen flex-col bg-command-bg text-slate-200"
      style={{
        '--sidebar-width': `${sidebarWidth}px`,
        '--workspace-accent': ws.color,
      } as CSSProperties}
    >
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <MissionControlBar />

      <div className="flex flex-1 overflow-hidden">
        <WorkspaceSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <CommandHeader />
          <ProjectContextBar />
          <main
            id="main-content"
            className="command-content flex-1 overflow-y-auto px-4 py-6 pb-24 scrollbar-thin sm:px-6 lg:px-8 xl:py-8"
          >
            <Outlet />
          </main>
          <SystemAlertsBar alerts={alerts} />
        </div>
      </div>

      <CommandPalette />
      <BrandHydrator />
      <ToastHost />
    </div>
  );
}
