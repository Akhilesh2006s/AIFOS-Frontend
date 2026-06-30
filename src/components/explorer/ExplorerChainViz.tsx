import { Link } from 'react-router-dom';
import { Check, AlertTriangle, Clock, Ban, Circle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { explorerPath, type ExplorerEntityType } from '@/lib/explorerLinks';

export interface ExplorerChainNode {
  key: string;
  label: string;
  status: 'complete' | 'active' | 'waiting' | 'blocked' | 'delayed' | 'not_started';
  detail?: string;
  entityType?: ExplorerEntityType;
  entityId?: string;
}

const STATUS_META = {
  complete: { icon: Check, ring: 'ring-emerald-500/40 bg-emerald-500/10 text-emerald-400', label: 'Complete' },
  active: { icon: Circle, ring: 'ring-sky-500/40 bg-sky-500/10 text-sky-400', label: 'In progress' },
  waiting: { icon: Clock, ring: 'ring-amber-500/40 bg-amber-500/10 text-amber-400', label: 'Waiting' },
  blocked: { icon: Ban, ring: 'ring-red-500/40 bg-red-500/10 text-red-400', label: 'Blocked' },
  delayed: { icon: AlertTriangle, ring: 'ring-orange-500/40 bg-orange-500/10 text-orange-400', label: 'Delayed' },
  not_started: { icon: Circle, ring: 'ring-white/10 bg-white/5 text-slate-500', label: 'Not started' },
} as const;

interface ExplorerChainVizProps {
  projectName?: string;
  nodes: ExplorerChainNode[];
}

export function ExplorerChainViz({ projectName, nodes }: ExplorerChainVizProps) {
  return (
    <div className="command-card p-5">
      {projectName && (
        <p className="mb-4 text-sm font-medium text-slate-300">{projectName}</p>
      )}
      <div className="space-y-0">
        {nodes.map((node, i) => {
          const meta = STATUS_META[node.status];
          const Icon = meta.icon;
          const inner = (
            <>
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1', meta.ring)}>
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-white">{node.label}</p>
                  <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ring-1', meta.ring)}>
                    {meta.label}
                  </span>
                </div>
                {node.detail && <p className="mt-0.5 text-xs text-slate-500">{node.detail}</p>}
              </div>
              {node.entityType && node.entityId && (
                <ChevronRight size={16} className="shrink-0 text-slate-600" />
              )}
            </>
          );

          const className = 'group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.04]';

          return (
            <div key={node.key}>
              {node.entityType && node.entityId ? (
                <Link to={explorerPath(node.entityType, node.entityId)} className={className}>
                  {inner}
                </Link>
              ) : (
                <div className={className}>{inner}</div>
              )}
              {i < nodes.length - 1 && (
                <div className="ml-5 border-l border-dashed border-white/10 py-1 pl-6 text-[10px] text-slate-600">↓</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
