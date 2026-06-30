import { CommandChartCard } from '@/components/command/CommandChartCard';
import { RoleDashboardShell } from '@/components/dashboards/RoleDashboardShell';
import { useWarehouseDashboard } from '@/hooks/role-dashboards/useWarehouseDashboard';

export function WarehouseManagerDashboard() {
  const { data, loading } = useWarehouseDashboard();

  return (
    <RoleDashboardShell
      title="Warehouse Overview"
      subtitle="GRN, stock levels, issues, and warehouse operations"
      workspaceLabel="Supply Chain"
      workspaceColor="#22C55E"
      loading={loading}
      kpis={data?.kpis ?? []}
      todaysWork={data?.todaysWork ?? []}
      alerts={data?.alerts ?? []}
      quickActions={data?.quickActions ?? []}
      recentActivity={data?.recentActivity ?? []}
      headerLink={{ label: 'Full Inventory', href: '/inventory' }}
      charts={
        data?.chartOptions.map((option, i) => (
          <CommandChartCard key={i} title="" option={option} delay={i} />
        ))
      }
      table={
        data?.table
          ? { title: 'Stock Registry', headers: data.table.headers, rows: data.table.rows, emptyMessage: 'No materials registered' }
          : undefined
      }
    />
  );
}
