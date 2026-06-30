import { CommandChartCard } from '@/components/command/CommandChartCard';
import { RoleDashboardShell } from '@/components/dashboards/RoleDashboardShell';
import { useComplianceDashboard } from '@/hooks/role-dashboards/useComplianceDashboard';

export function ComplianceManagerDashboard() {
  const { data, loading } = useComplianceDashboard();

  return (
    <RoleDashboardShell
      title="Compliance Overview"
      subtitle="RC, insurance, fitness, licenses, AMC, and regulatory alerts"
      workspaceLabel="Assets"
      workspaceColor="#1F4E79"
      loading={loading}
      kpis={data?.kpis ?? []}
      todaysWork={data?.todaysWork ?? []}
      alerts={data?.alerts ?? []}
      quickActions={data?.quickActions ?? []}
      recentActivity={data?.recentActivity ?? []}
      headerLink={{ label: 'Compliance Module', href: '/compliance' }}
      charts={
        data?.chartOptions.map((option, i) => (
          <CommandChartCard key={i} title="" option={option} delay={i} />
        ))
      }
      table={
        data?.table
          ? { title: 'Compliance Records', headers: data.table.headers, rows: data.table.rows, emptyMessage: 'No compliance records' }
          : undefined
      }
    />
  );
}
