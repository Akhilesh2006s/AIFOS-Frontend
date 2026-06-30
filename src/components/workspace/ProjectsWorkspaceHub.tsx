import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pin, Clock, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { useContextStore } from '@/store/context';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar } from '@/components/ui/TableCells';
import { formatCurrency } from '@/lib/utils';
import type { Project } from '@/types/entities';

interface ProjectsWorkspaceHubProps {
  projects: Project[];
  stats: Record<string, number> | null;
  onOpenProject: (p: Project) => void;
}

export function ProjectsWorkspaceHub({ projects, stats, onOpenProject }: ProjectsWorkspaceHubProps) {
  const navigate = useNavigate();
  const { recentProjects, pinnedProjects, togglePin } = useContextStore();

  const open = (p: Project) => {
    onOpenProject(p);
    navigate(`/projects/${p._id}`);
  };

  const pinned = pinnedProjects.length
    ? projects.filter((p) => pinnedProjects.some((x) => x.id === p._id))
    : projects.slice(0, 2);

  const recent = recentProjects.length
    ? recentProjects.map((r) => projects.find((p) => p._id === r.id)).filter(Boolean) as Project[]
    : projects.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="command-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white">Portfolio</h3>
          <p className="text-[11px] text-slate-500">{stats?.active ?? 0} active · {stats?.totalProjects ?? 0} total</p>
          <div className="mt-4 space-y-2">
            {projects.slice(0, 5).map((p) => (
              <button
                key={p._id}
                onClick={() => open(p)}
                className="flex w-full items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-3 text-left ring-1 ring-white/5 hover:bg-white/[0.06]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">{p.name}</p>
                  <p className="text-[10px] text-slate-500">{p.code} · {p.client}</p>
                </div>
                <StatusBadge status={p.status} dot />
                <div className="w-24"><ProgressBar value={p.progressPercent} color="#38BDF8" showLabel={false} /></div>
                <span className="font-mono text-xs text-slate-400">{p.progressPercent}%</span>
                <ChevronRight size={14} className="text-slate-600" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <HubSection icon={Pin} title="Pinned" empty="Pin projects from portfolio">
            {pinned.map((p) => (
              <HubRow key={p._id} label={p.name} sub={p.code} onClick={() => open(p)} onPin={() => togglePin({ id: p._id, name: p.name, code: p.code })} pinned />
            ))}
          </HubSection>
          <HubSection icon={Clock} title="Recently Opened" empty="Open a project to track recents">
            {recent.map((p) => (
              <HubRow key={p._id} label={p.name} sub={p.code} onClick={() => open(p)} onPin={() => togglePin({ id: p._id, name: p.name, code: p.code })} />
            ))}
          </HubSection>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="command-card p-4">
          <div className="flex items-center gap-2 text-amber-400"><CheckCircle size={16} /><h4 className="text-sm font-semibold text-white">Approvals</h4></div>
          <p className="mt-2 font-mono text-2xl font-bold text-white">3</p>
          <p className="text-[10px] text-slate-500">PRs awaiting sign-off</p>
          <Link to="/supply-chain" className="mt-2 inline-block text-xs text-sky-400 hover:underline">Open Supply Chain →</Link>
        </div>
        <div className="command-card p-4">
          <div className="flex items-center gap-2 text-red-400"><AlertTriangle size={16} /><h4 className="text-sm font-semibold text-white">Issues</h4></div>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{stats?.openIssues ?? 0}</p>
          <p className="text-[10px] text-slate-500">Open site issues</p>
        </div>
        <div className="command-card p-4">
          <h4 className="text-sm font-semibold text-white">Today&apos;s Tasks</h4>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-400">
            <li>· Review BOQ for NH-44</li>
            <li>· Approve cement PR</li>
            <li>· Site inspection — Chainage 120</li>
          </ul>
        </div>
      </div>

      <div className="command-card p-4">
        <p className="text-[10px] uppercase tracking-wider text-slate-600">Financial snapshot</p>
        <div className="mt-2 flex flex-wrap gap-6">
          <div><p className="font-mono text-xl font-bold text-white">{formatCurrency(stats?.totalBudget ?? 0)}</p><p className="text-[10px] text-slate-500">Allocated</p></div>
          <div><p className="font-mono text-xl font-bold text-emerald-400">{formatCurrency(stats?.totalSpent ?? 0)}</p><p className="text-[10px] text-slate-500">Spent</p></div>
        </div>
      </div>
    </div>
  );
}

function HubSection({ icon: Icon, title, empty, children }: { icon: typeof Pin; title: string; empty: string; children: ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className="command-card p-4">
      <div className="mb-2 flex items-center gap-2"><Icon size={14} className="text-slate-500" /><h4 className="text-xs font-semibold text-white">{title}</h4></div>
      {hasChildren ? <div className="space-y-1">{children}</div> : <p className="text-[10px] text-slate-600">{empty}</p>}
    </div>
  );
}

function HubRow({ label, onClick, onPin, pinned }: { label: string; sub: string; onClick: () => void; onPin: () => void; pinned?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg hover:bg-white/5">
      <button onClick={onClick} className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-xs text-slate-300">{label}</button>
      <button onClick={(e) => { e.stopPropagation(); onPin(); }} className="p-1 text-slate-600 hover:text-amber-400" title="Pin">
        <Pin size={12} className={pinned ? 'fill-amber-400 text-amber-400' : ''} />
      </button>
    </div>
  );
}
