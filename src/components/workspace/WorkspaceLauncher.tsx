import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { LAUNCHER_WORKSPACES } from '@/config/workspaces';
import { useCloudStats, getWorkspaceStatLines, getWorkspaceProgress } from '@/hooks/useCloudStats';
import { useWorkspaceStore } from '@/store/workspace';
import { AppIcon } from '@/components/icons/AppIcon';
import { cn } from '@/lib/utils';
import type { WorkspaceId } from '@/config/workspaces';

interface WorkspaceLauncherProps {
  compact?: boolean;
}

export function WorkspaceLauncher({ compact }: WorkspaceLauncherProps) {
  const navigate = useNavigate();
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const { stats } = useCloudStats();

  const open = (id: WorkspaceId, path: string) => {
    setWorkspace(id);
    navigate(path);
  };

  return (
    <div className={cn('grid gap-4', compact ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3')}>
      {LAUNCHER_WORKSPACES.map((ws, i) => {
        const lines = getWorkspaceStatLines(ws.id, stats);
        const progress = getWorkspaceProgress(ws.id, stats);
        return (
          <motion.button
            key={ws.id}
            type="button"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => open(ws.id, ws.defaultPath)}
            className="group command-card flex items-start gap-4 p-5 text-left transition-all hover:border-white/15 hover:shadow-glow"
            style={{ ['--hover-glow' as string]: `${ws.color}22` }}
          >
            <div className="rounded-2xl ring-1 ring-white/10 p-1" style={{ backgroundColor: `${ws.color}10` }}>
              <AppIcon id={ws.id} size={52} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-bold text-white">{ws.label}</h3>
                <ChevronRight size={18} className="shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{ws.tagline}</p>
              {lines.map((line) => (
                <p key={line} className="mt-1 text-[10px] text-slate-600">{line}</p>
              ))}
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: ws.color }} />
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
