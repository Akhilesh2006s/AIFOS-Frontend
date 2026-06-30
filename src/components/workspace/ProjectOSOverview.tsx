import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, Cog, AlertTriangle, Bell, Users, Truck } from 'lucide-react';
import { WorkflowActions } from '@/components/workflow/WorkflowActions';
import { ProjectWorkflowJourney, buildProjectJourney } from '@/components/project/ProjectWorkflowJourney';
import { ProjectOperationalChain, type OperationalChainStage } from '@/components/project/ProjectOperationalChain';
import { ProgressBar } from '@/components/ui/TableCells';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { moduleApi } from '@/api/client';
import { formatCurrency } from '@/lib/utils';
import type { Project } from '@/types/entities';

interface DashboardData {
  health: {
    score: number;
    healthLabel: string;
    overallProgress: number;
    boqCompletion: number;
    openIssues: number;
    delayedMilestones: number;
    pendingApprovals: number;
    materialRequirementStatus: { total: number; approved: number; pending: number };
    procurementProgress: { percent: number; pending: number };
    equipmentAssigned: number;
    teamAllocations: number;
  };
  todaysTasks: string[];
  milestones: Array<{ _id: string; name: string; targetDate: string; status: string; progressPercent: number }>;
  issues: Array<{ _id: string; title: string; status: string }>;
  pendingPrs: Array<{ _id: string; prNumber?: string; status: string }>;
  requirements: Array<{ status: string }>;
  equipmentAssigned: Array<{ resourceName: string }>;
  recentActivity: Array<{ type: string; title: string; message: string; at?: string }>;
}

export function ProjectOSOverview({ project, projectId, onRefresh }: { project: Project; projectId: string; onRefresh: () => void }) {
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [unread, setUnread] = useState(0);
  const [chain, setChain] = useState<{ stages: OperationalChainStage[]; completionImpact: string; projectCode: string } | null>(null);

  useEffect(() => {
    moduleApi.projects.dashboard(projectId).then((r) => setDash(r.data));
    moduleApi.notifications.unreadCount(projectId).then((r) => setUnread(r.data?.count ?? 0));
    moduleApi.projects.operationalChain(projectId).then((r) => setChain(r.data)).catch(() => undefined);
  }, [projectId, onRefresh]);

  if (!dash) {
    return <div className="command-card p-8 text-center text-sm text-slate-500">Loading project dashboard…</div>;
  }

  const { health } = dash;
  const healthColor = health.healthLabel === 'good' ? '#22C55E' : health.healthLabel === 'warn' ? '#EAB308' : '#EF4444';
  const journey = buildProjectJourney({
    milestones: dash.milestones,
    boq: health.boqCompletion > 0 ? [1] : [],
    requirements: dash.requirements,
    prsPending: dash.pendingPrs.length,
  });

  return (
    <div className="space-y-5">
      {chain && (
        <ProjectOperationalChain
          stages={chain.stages}
          completionImpact={chain.completionImpact}
          projectCode={chain.projectCode}
        />
      )}
      <ProjectWorkflowJourney projectId={projectId} steps={journey} />

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="command-card p-5 lg:col-span-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Project Health</p>
          <p className="mt-2 font-mono text-4xl font-bold" style={{ color: healthColor }}>{health.score}</p>
          <p className="text-xs text-slate-500">Score · {health.overallProgress}% progress</p>
          <div className="mt-3"><ProgressBar value={health.overallProgress} color={healthColor} /></div>
        </div>

        <div className="command-card p-5 lg:col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Today&apos;s tasks</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {dash.todaysTasks.length ? dash.todaysTasks.map((task) => (
              <div key={task} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5 text-xs text-slate-300 ring-1 ring-white/5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {task}
              </div>
            )) : (
              <p className="text-xs text-slate-500">No pending tasks — operational chain on track.</p>
            )}
          </div>
        </div>

        <div className="command-card p-5">
          <div className="flex items-center gap-2"><Bell size={14} className="text-amber-400" /><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Notifications</p></div>
          <p className="mt-2 font-mono text-2xl font-bold text-white">{unread}</p>
          <p className="text-[10px] text-slate-500">unread for this project</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'BOQ', value: `${health.boqCompletion}%`, tab: 'boq' },
          { label: 'Material Req.', value: `${health.materialRequirementStatus.approved}/${health.materialRequirementStatus.total}`, tab: 'requirements' },
          { label: 'Procurement', value: `${health.procurementProgress.percent}%`, path: '/procurement' },
          { label: 'Open issues', value: health.openIssues, tab: 'issues' },
          { label: 'Pending approvals', value: health.pendingApprovals, tab: 'requirements' },
        ].map((c) => (
          c.path ? (
            <Link key={c.label} to={c.path} className="command-card p-4 hover:border-white/15">
              <p className="text-[10px] text-slate-500">{c.label}</p>
              <p className="mt-1 font-mono text-xl font-bold text-white">{c.value}</p>
            </Link>
          ) : (
            <Link key={c.label} to={`/projects/${projectId}?tab=${c.tab}`} className="command-card p-4 hover:border-white/15">
              <p className="text-[10px] text-slate-500">{c.label}</p>
              <p className="mt-1 font-mono text-xl font-bold text-white">{c.value}</p>
            </Link>
          )
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="command-card p-4">
          <p className="mb-2 text-xs font-semibold text-white">Milestones</p>
          <div className="space-y-2">
            {dash.milestones.slice(0, 4).map((m) => (
              <div key={m._id} className="flex items-center justify-between text-xs">
                <span className="truncate text-slate-300">{m.name}</span>
                <StatusBadge status={m.status} dot />
              </div>
            ))}
            {!dash.milestones.length && <p className="text-[10px] text-slate-600">No milestones</p>}
          </div>
          <Link to={`/projects/${projectId}?tab=planning`} className="mt-2 inline-block text-[10px] text-sky-400 hover:underline">Planning →</Link>
        </div>

        <div className="command-card p-4">
          <p className="mb-2 text-xs font-semibold text-white">Team & equipment</p>
          <div className="flex gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Users size={12} /> {health.teamAllocations} team</span>
            <span className="flex items-center gap-1"><Truck size={12} /> {health.equipmentAssigned} equipment</span>
          </div>
          {dash.equipmentAssigned.slice(0, 3).map((e, i) => (
            <p key={i} className="mt-1 text-[10px] text-slate-500">{e.resourceName}</p>
          ))}
        </div>

        <div className="command-card p-4">
          <p className="mb-2 text-xs font-semibold text-white">Recent activity</p>
          <div className="max-h-32 space-y-1.5 overflow-y-auto">
            {dash.recentActivity.map((a, i) => (
              <p key={i} className="text-[10px] text-slate-500"><span className="text-slate-300">{a.title}</span> — {a.message}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Procurement', icon: ShoppingCart, path: '/procurement', detail: `${dash.pendingPrs.length} pending PR`, color: '#EAB308' },
          { label: 'Inventory', icon: Package, path: '/inventory', detail: 'Site stores', color: '#22C55E' },
          { label: 'Equipment', icon: Cog, path: '/equipment', detail: `${health.equipmentAssigned} allocated`, color: '#1F4E79' },
          { label: 'Issues', icon: AlertTriangle, path: `/projects/${projectId}?tab=issues`, detail: `${health.openIssues} open`, color: '#EF4444' },
        ].map((d) => (
          <Link key={d.label} to={d.path} className="command-card group p-4 transition-all hover:border-white/15">
            <d.icon size={18} style={{ color: d.color }} />
            <p className="mt-2 text-sm font-semibold text-white">{d.label}</p>
            <p className="text-[10px] text-slate-500">{d.detail}</p>
          </Link>
        ))}
      </div>

      <p className="text-[10px] text-slate-600">Budget {formatCurrency(project.budgetAmount)} · Spent {formatCurrency(project.spentAmount)}</p>

      <WorkflowActions projectId={projectId} onRefresh={onRefresh} />
    </div>
  );
}
