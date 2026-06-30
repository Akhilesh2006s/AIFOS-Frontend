import { RoleDashboardShell } from '@/components/dashboards/RoleDashboardShell';
import { ROLE_DASHBOARD_META } from '@/config/roleDashboardRegistry';
import { useComplianceDashboard } from '@/hooks/role-dashboards/useComplianceDashboard';

const meta = ROLE_DASHBOARD_META.compliance_manager;

export function ComplianceManagerDashboard() {
  const { data, loading, error, refresh } = useComplianceDashboard();

  return (
    <RoleDashboardShell
      title={meta.title}
      subtitle={meta.subtitle}
      workspaceLabel={meta.workspaceLabel}
      workspaceColor={meta.workspaceColor}
      theme={meta.theme}
      workSectionTitle={meta.workSectionTitle}
      showRecentActivity={meta.showRecentActivity}
      loading={loading}
      error={error}
      onRetry={refresh}
      kpis={data?.kpis ?? []}
      todaysWork={data?.todaysWork ?? []}
      alerts={data?.alerts ?? []}
      quickActions={data?.quickActions ?? []}
      recentActivity={data?.recentActivity ?? []}
      headerLink={meta.headerLink}
      table={
        data?.table
          ? { title: 'Compliance Records', headers: data.table.headers, rows: data.table.rows, emptyMessage: 'No compliance records' }
          : undefined
      }
    />
  );
}
