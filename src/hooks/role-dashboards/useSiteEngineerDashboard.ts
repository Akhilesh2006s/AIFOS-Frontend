import { useCallback, useEffect, useState } from 'react';
import { moduleApi } from '@/api/client';
import { isToday } from '@/lib/dateHelpers';
import type {
  DashboardActivity,
  DashboardAlert,
  DashboardKpi,
  DashboardQuickAction,
  DashboardWorkItem,
} from '@/components/dashboards/types';
import type { EChartsOption } from 'echarts';
import { AlertCircle, Camera, ClipboardList, FileText, Package } from 'lucide-react';

interface SiteEngineerDashboardData {
  projectId: string | null;
  projectName: string;
  kpis: DashboardKpi[];
  todaysWork: DashboardWorkItem[];
  alerts: DashboardAlert[];
  quickActions: DashboardQuickAction[];
  recentActivity: DashboardActivity[];
  chartOptions: EChartsOption[];
  table: { headers: string[]; rows: string[][] };
}

export function useSiteEngineerDashboard() {
  const [data, setData] = useState<SiteEngineerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const projectsRes = await moduleApi.projects.list('active');
      const projects = projectsRes.data ?? [];
      const project = projects[0];
      const projectId = project?._id ?? null;
      const projectName = project?.name ?? 'No active project';

      if (!projectId) {
        setData({
          projectId: null,
          projectName,
          kpis: [{ label: 'Active Projects', value: 0, color: '#64748b' }],
          todaysWork: [],
          alerts: [{ id: 'no-project', severity: 'info', title: 'No active project assigned', href: '/projects' }],
          quickActions: [
            { label: 'View Projects', href: '/projects', icon: FileText },
          ],
          recentActivity: [],
          chartOptions: [],
          table: { headers: [], rows: [] },
        });
        setLoading(false);
        return;
      }

      const [dashboard, issuesRes, reportsRes, mrsRes, equipmentRes] = await Promise.all([
        moduleApi.projects.dashboard(projectId),
        moduleApi.projects.issues(projectId),
        moduleApi.projects.dailyReports(projectId),
        moduleApi.projects.materialRequirements(projectId),
        moduleApi.equipment.list(),
      ]);

      const dash = dashboard.data ?? {};
      const health = dash.health ?? {};
      const issues = issuesRes.data ?? [];
      const reports = reportsRes.data ?? [];
      const mrs = mrsRes.data ?? [];
      const equipment = (equipmentRes.data ?? []).filter(
        (e: { projectId?: string; currentProjectId?: string }) =>
          e.projectId === projectId || e.currentProjectId === projectId,
      );

      const openIssues = issues.filter((i: { status?: string }) => !['resolved', 'closed'].includes(i.status ?? ''));
      const todayReport = reports.find((r: { reportDate?: string; createdAt?: string }) =>
        isToday(r.reportDate || r.createdAt),
      );
      const pendingMrs = mrs.filter((m: { status?: string }) => ['draft', 'pending'].includes(m.status ?? ''));

      const kpis: DashboardKpi[] = [
        { label: 'Project Progress', value: `${health.progressPercent ?? health.completion ?? 0}%`, color: '#22C55E' },
        { label: 'Open Issues', value: openIssues.length, color: '#EF4444' },
        { label: 'Materials Awaiting', value: pendingMrs.length, color: '#F97316' },
        { label: 'Equipment Assigned', value: equipment.length, color: '#3B82F6' },
        { label: 'Daily Report', value: todayReport ? 'Submitted' : 'Pending', color: todayReport ? '#22C55E' : '#EAB308' },
        { label: 'Milestones', value: health.delayedMilestones ? `${health.delayedMilestones} delayed` : 'On track', color: '#A855F7' },
      ];

      const todaysWork: DashboardWorkItem[] = (dash.todaysTasks ?? []).map((task: string, i: number) => ({
        id: `task-${i}`,
        label: task,
        href: `/projects/${projectId}`,
      }));

      if (!todayReport) {
        todaysWork.unshift({
          id: 'daily-report',
          label: 'Submit daily report',
          status: 'pending',
          href: `/projects/${projectId}?tab=reports`,
        });
      }

      const alerts: DashboardAlert[] = [];
      if (health.delayedMilestones > 0) {
        alerts.push({
          id: 'milestones',
          severity: 'warning',
          title: `${health.delayedMilestones} milestone(s) overdue`,
          href: `/projects/${projectId}?tab=milestones`,
        });
      }
      openIssues.slice(0, 3).forEach((issue: { _id: string; title?: string; priority?: string }) => {
        alerts.push({
          id: issue._id,
          severity: issue.priority === 'critical' ? 'critical' : 'warning',
          title: issue.title ?? 'Open issue',
          href: `/projects/${projectId}?tab=issues`,
        });
      });

      const quickActions: DashboardQuickAction[] = [
        { label: 'Submit Daily Report', href: `/projects/${projectId}?tab=reports`, icon: ClipboardList },
        { label: 'Report Issue', href: `/projects/${projectId}?tab=issues`, icon: AlertCircle },
        { label: 'Upload Photos', href: `/projects/${projectId}?tab=documents`, icon: Camera },
        { label: 'Request Material', href: `/projects/${projectId}?tab=requirements`, icon: Package },
      ];

      const recentActivity: DashboardActivity[] = (dash.recentActivity ?? []).slice(0, 10).map(
        (a: { type?: string; title?: string; message?: string; at?: string }, i: number) => ({
          id: `act-${i}`,
          type: a.type ?? 'activity',
          label: a.title ?? a.message ?? '—',
          at: a.at,
        }),
      );

      const chartOptions: EChartsOption[] = [
        {
          title: { text: 'Project Health', textStyle: { color: '#94a3b8', fontSize: 12 } },
          series: [{
            type: 'gauge',
            progress: { show: true },
            detail: { valueAnimation: true, formatter: '{value}%', color: '#fff' },
            data: [{ value: health.progressPercent ?? health.completion ?? 0, name: 'Progress' }],
            axisLine: { lineStyle: { color: [[1, '#22C55E']] } },
          }],
        },
        {
          title: { text: 'Issues by Status', textStyle: { color: '#94a3b8', fontSize: 12 } },
          xAxis: {
            type: 'category',
            data: ['Open', 'In Progress', 'Resolved'],
            axisLabel: { color: '#64748b' },
          },
          yAxis: { type: 'value', axisLabel: { color: '#64748b' }, splitLine: { lineStyle: { color: '#1e293b' } } },
          series: [{
            type: 'bar',
            data: [
              openIssues.filter((i: { status?: string }) => i.status === 'open').length,
              openIssues.filter((i: { status?: string }) => i.status === 'in_progress').length,
              issues.filter((i: { status?: string }) => ['resolved', 'closed'].includes(i.status ?? '')).length,
            ],
            itemStyle: { color: '#3B82F6' },
          }],
          grid: { left: 40, right: 20, bottom: 30, top: 40 },
        },
      ];

      const tableRows = openIssues.slice(0, 10).map((i: { title?: string; status?: string; priority?: string; createdAt?: string }) => [
        i.title,
        i.priority ?? '—',
        i.status,
        i.createdAt ? new Date(i.createdAt).toLocaleDateString('en-IN') : '—',
      ]);

      setData({
        projectId,
        projectName,
        kpis,
        todaysWork,
        alerts,
        quickActions,
        recentActivity,
        chartOptions,
        table: { headers: ['Issue', 'Priority', 'Status', 'Reported'], rows: tableRows },
      });
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, refresh: load };
}
