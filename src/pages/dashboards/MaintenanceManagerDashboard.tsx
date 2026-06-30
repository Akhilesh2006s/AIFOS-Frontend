import { CommandChartCard } from '@/components/command/CommandChartCard';
import { RoleDashboardShell } from '@/components/dashboards/RoleDashboardShell';
import { useMaintenanceDashboard } from '@/hooks/role-dashboards/useMaintenanceDashboard';

export function MaintenanceManagerDashboard() {
  const { data, loading } = useMaintenanceDashboard();

  return (
    <RoleDashboardShell
      title="Maintenance Command"
      subtitle="Work orders, breakdowns, preventive schedule, and equipment uptime"
      workspaceLabel="Assets"
      workspaceColor="#1F4E79"
      loading={loading}
      kpis={data?.kpis ?? []}
      todaysWork={data?.todaysWork ?? []}
      alerts={data?.alerts ?? []}
      quickActions={data?.quickActions ?? []}
      recentActivity={data?.recentActivity ?? []}
      headerLink={{ label: 'Maintenance Module', href: '/maintenance' }}
      charts={
        data?.chartOptions.map((option, i) => (
          <CommandChartCard key={i} title="" option={option} delay={i} />
        ))
      }
      table={
        data?.table
          ? { title: 'Open Work Orders', headers: data.table.headers, rows: data.table.rows, emptyMessage: 'No open work orders' }
          : undefined
      }
    />
  );
}
