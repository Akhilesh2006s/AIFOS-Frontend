import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Pin } from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { ErrorState } from '@/components/ui/ErrorState';
import { ModuleTabs } from '@/components/layout/ModuleTabs';
import { ProjectOSOverview } from '@/components/workspace/ProjectOSOverview';
import { ProjectBoqTab, type BoqLine } from '@/components/project/ProjectBoqTab';
import { ProjectRequirementsTab, type MaterialRequirement } from '@/components/project/ProjectRequirementsTab';
import { ProjectIssuesTab, type ProjectIssue } from '@/components/project/ProjectIssuesTab';
import { ProjectDailyReportsTab, type DailyReport } from '@/components/project/ProjectDailyReportsTab';
import { ProjectDocumentsTab } from '@/components/project/ProjectDocumentsTab';
import { ProjectPlanningTab, type Milestone } from '@/components/project/ProjectPlanningTab';
import { ProjectAnalyticsTab } from '@/components/project/ProjectAnalyticsTab';
import type { ResourceAllocation } from '@/components/project/ProjectResourceAllocations';
import { PROJECT_TABS } from '@/config/workspaces';
import { useContextStore } from '@/store/context';
import { moduleApi } from '@/api/client';
import type { Project } from '@/types/entities';

const ACCENT = '#38BDF8';

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  const { setActiveProject, togglePin, pinnedProjects } = useContextStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [boq, setBoq] = useState<BoqLine[]>([]);
  const [sites, setSites] = useState<Array<{ _id: string; code: string; name: string; city: string }>>([]);
  const [requirements, setRequirements] = useState<MaterialRequirement[]>([]);
  const [issues, setIssues] = useState<ProjectIssue[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const [flow] = await Promise.all([
        moduleApi.projects.flow(projectId),
      ]);
      const p = flow.data.project as Project;
      if (!p) {
        setError('Project not found or you do not have access.');
        setProject(null);
        return;
      }
      setProject(p);
      setActiveProject({ id: p._id, name: p.name, code: p.code });
      setBoq(flow.data.boq);
      setSites(flow.data.sites);
      setRequirements(flow.data.requirements);
      setIssues(flow.data.issues);
      setReports(flow.data.reports);
      setMilestones(flow.data.milestones);
      setAllocations(flow.data.allocations || []);
    } catch {
      setError('Failed to load project. It may not exist or you may not have permission.');
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, setActiveProject]);

  useEffect(() => { load(); }, [load]);

  if (!projectId) return <Navigate to="/projects" replace />;
  if (!loading && (error || !project)) {
    return (
      <ModulePageLayout title="Project" subtitle="Not available" breadcrumbs={[{ label: 'Projects', path: '/projects' }, { label: 'Not found' }]}>
        <ErrorState title="Project not found" message={error || undefined} onRetry={load} />
      </ModulePageLayout>
    );
  }

  const tabLabel = PROJECT_TABS.find((t) => t.id === tab)?.label || 'Overview';
  const isPinned = pinnedProjects.some((p) => p.id === projectId);

  return (
    <ModulePageLayout
      hideWorkspace
      title={project?.name || 'Project'}
      subtitle={project ? `${project.code} · ${project.client || 'Client'} · PM: ${project.projectManager || '—'}` : ''}
      loading={loading}
      tabs={
        <ModuleTabs
          tabs={PROJECT_TABS}
          active={tab}
          onChange={(id) => setSearchParams(id === 'overview' ? {} : { tab: id })}
          accent={ACCENT}
        />
      }
      breadcrumbs={[
        { label: 'Projects', path: '/projects' },
        { label: project?.name || 'Project', path: `/projects/${projectId}` },
        ...(tab !== 'overview' ? [{ label: tabLabel }] : []),
      ]}
      heroActions={
        <div className="flex gap-2">
          {project && (
            <button
              onClick={() => togglePin({ id: project._id, name: project.name, code: project.code })}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <Pin size={14} className={isPinned ? 'fill-amber-400 text-amber-400' : ''} /> {isPinned ? 'Pinned' : 'Pin'}
            </button>
          )}
          <Link to="/projects" className="btn-ghost flex items-center gap-2 text-sm">
            <ArrowLeft size={16} /> Portfolio
          </Link>
        </div>
      }
    >
      {tab === 'overview' && project && (
        <ProjectOSOverview project={project} projectId={projectId} onRefresh={load} />
      )}
      {tab === 'planning' && project && (
        <ProjectPlanningTab
          projectId={projectId}
          milestones={milestones}
          sites={sites}
          allocations={allocations}
          projectStart={project.startDate}
          projectEnd={project.endDate}
          onRefresh={load}
        />
      )}
      {tab === 'boq' && <ProjectBoqTab projectId={projectId} lines={boq} onRefresh={load} />}
      {tab === 'requirements' && (
        <ProjectRequirementsTab projectId={projectId} requirements={requirements} onRefresh={load} />
      )}
      {tab === 'issues' && <ProjectIssuesTab projectId={projectId} issues={issues} onRefresh={load} />}
      {tab === 'daily-reports' && (
        <ProjectDailyReportsTab projectId={projectId} reports={reports} onRefresh={load} />
      )}
      {tab === 'documents' && <ProjectDocumentsTab projectId={projectId} />}
      {tab === 'analytics' && <ProjectAnalyticsTab projectId={projectId} />}
    </ModulePageLayout>
  );
}
