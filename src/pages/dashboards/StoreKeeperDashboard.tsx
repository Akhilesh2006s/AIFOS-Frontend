import { CommandChartCard } from '@/components/command/CommandChartCard';
import { RoleDashboardShell } from '@/components/dashboards/RoleDashboardShell';
import { useStoreKeeperDashboard } from '@/hooks/role-dashboards/useStoreKeeperDashboard';

export function StoreKeeperDashboard() {
  const { data, loading } = useStoreKeeperDashboard();

  return (
    <RoleDashboardShell
      title="Store Operations"
      subtitle="Issue materials, track consumption, and manage site stores"
      workspaceLabel="Supply Chain"
      workspaceColor="#22C55E"
      loading={loading}
      kpis={data?.kpis ?? []}
      todaysWork={data?.todaysWork ?? []}
      alerts={data?.alerts ?? []}
      quickActions={data?.quickActions ?? []}
      recentActivity={data?.recentActivity ?? []}
      headerLink={{ label: 'Issue Queue', href: '/inventory?tab=issues' }}
      charts={
        data?.chartOptions.map((option, i) => (
          <CommandChartCard key={i} title="" option={option} delay={i} />
        ))
      }
      table={
        data?.table
          ? { title: 'Material Issues', headers: data.table.headers, rows: data.table.rows, emptyMessage: 'No pending issues' }
          : undefined
      }
    />
  );
}
