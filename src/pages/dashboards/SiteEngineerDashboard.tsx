import { CommandChartCard } from '@/components/command/CommandChartCard';
import { RoleDashboardShell } from '@/components/dashboards/RoleDashboardShell';
import { useSiteEngineerDashboard } from '@/hooks/role-dashboards/useSiteEngineerDashboard';

export function SiteEngineerDashboard() {
  const { data, loading } = useSiteEngineerDashboard();

  return (
    <RoleDashboardShell
      title="Site Operations"
      subtitle={data?.projectName ? `Active site: ${data.projectName}` : 'Daily reports, issues, materials, and progress'}
      workspaceLabel="Projects"
      workspaceColor="#3B82F6"
      loading={loading}
      kpis={data?.kpis ?? []}
      todaysWork={data?.todaysWork ?? []}
      alerts={data?.alerts ?? []}
      quickActions={data?.quickActions ?? []}
      recentActivity={data?.recentActivity ?? []}
      headerLink={
        data?.projectId
          ? { label: 'Project Detail', href: `/projects/${data.projectId}` }
          : { label: 'Projects', href: '/projects' }
      }
      charts={
        data?.chartOptions.map((option, i) => (
          <CommandChartCard key={i} title="" option={option} delay={i} />
        ))
      }
      table={
        data?.table
          ? { title: 'Open Issues', headers: data.table.headers, rows: data.table.rows, emptyMessage: 'No open issues' }
          : undefined
      }
    />
  );
}
