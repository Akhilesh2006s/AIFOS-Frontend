import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, GitBranch } from 'lucide-react';
import { ExplorerChainViz } from '@/components/explorer/ExplorerChainViz';
import { explorerPath } from '@/lib/explorerLinks';
import type { ExplorerChainNode, ExplorerRelationship } from '@/types/explorer';

interface ExplorerRelationshipPanelProps {
  upstream: ExplorerChainNode[];
  downstream: ExplorerChainNode[];
  relationships: ExplorerRelationship[];
  fullChain: ExplorerChainNode[];
  projectName?: string;
}

export function ExplorerRelationshipPanel({
  upstream,
  downstream,
  relationships,
  fullChain,
  projectName,
}: ExplorerRelationshipPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <DependencySection
          title="Upstream dependencies"
          subtitle="Where did this originate?"
          icon={ArrowUp}
          nodes={upstream}
          empty="No upstream dependencies."
        />
        <DependencySection
          title="Downstream dependencies"
          subtitle="What depends on this?"
          icon={ArrowDown}
          nodes={downstream}
          empty="No downstream impact recorded."
        />
      </div>

      <ExplorerChainViz projectName={projectName} nodes={fullChain} />

      {relationships.length > 0 && (
        <div className="command-card">
          <div className="border-b border-white/5 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <GitBranch size={16} className="text-violet-400" />
              Related records
            </p>
          </div>
          <div className="divide-y divide-white/5">
            {relationships.map((r) => (
              <Link
                key={`${r.entityType}-${r.entityId}`}
                to={explorerPath(r.entityType, r.entityId)}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03]"
              >
                <div>
                  <p className="text-[10px] uppercase text-slate-500">
                    {r.direction === 'upstream' ? '↑ ' : r.direction === 'downstream' ? '↓ ' : ''}
                    {r.role}
                  </p>
                  <p className="text-sm text-white">{r.label}</p>
                  {r.meta && <p className="text-xs text-slate-500">{r.meta}</p>}
                </div>
                <span className="text-xs text-violet-400">Explore →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DependencySection({
  title,
  subtitle,
  icon: Icon,
  nodes,
  empty,
}: {
  title: string;
  subtitle: string;
  icon: typeof ArrowUp;
  nodes: ExplorerChainNode[];
  empty: string;
}) {
  return (
    <div className="command-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={16} className="text-violet-400" />
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-[11px] text-slate-500">{subtitle}</p>
        </div>
      </div>
      {nodes.length === 0 ? (
        <p className="text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {nodes.map((n) => (
            <li key={n.key}>
              {n.entityType && n.entityId ? (
                <Link to={explorerPath(n.entityType, n.entityId)} className="block rounded-lg border border-white/5 px-3 py-2 hover:border-violet-500/30">
                  <p className="text-sm text-white">{n.label}</p>
                  {n.detail && <p className="text-xs text-slate-500">{n.detail}</p>}
                </Link>
              ) : (
                <div className="rounded-lg border border-white/5 px-3 py-2">
                  <p className="text-sm text-slate-300">{n.label}</p>
                  {n.detail && <p className="text-xs text-slate-500">{n.detail}</p>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
