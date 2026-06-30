import { RoleDashboardShell } from '@/components/dashboards/RoleDashboardShell';
import { ROLE_DASHBOARD_META } from '@/config/roleDashboardRegistry';
import { useSiteEngineerDashboard } from '@/hooks/role-dashboards/useSiteEngineerDashboard';

const meta = ROLE_DASHBOARD_META.site_engineer;

export function SiteEngineerDashboard() {
  const { data, loading } = useSiteEngineerDashboard();

  return (
    <RoleDashboardShell
      title={meta.title}
      subtitle={data?.projectName ? `Active site: ${data.projectName}` : meta.subtitle}
      workspaceLabel={meta.workspaceLabel}
      workspaceColor={meta.workspaceColor}
      theme={meta.theme}
      workSectionTitle={meta.workSectionTitle}
      showRecentActivity={meta.showRecentActivity}
      largeActions={meta.largeActions}
      loading={loading}
      kpis={data?.kpis ?? []}
      todaysWork={data?.todaysWork ?? []}
      alerts={data?.alerts ?? []}
      quickActions={data?.quickActions ?? []}
      recentActivity={data?.recentActivity ?? []}
      headerLink={
        data?.projectId
          ? { label: 'Project Detail', href: `/projects/${data.projectId}` }
          : meta.headerLink
      }
      table={
        data?.table
          ? { title: 'Open Issues', headers: data.table.headers, rows: data.table.rows, emptyMessage: 'No open issues' }
          : undefined
      }
    />
  );
}
