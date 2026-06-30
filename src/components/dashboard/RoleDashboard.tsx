import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardsApi } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { PageLoader } from '@/components/layout/PageShell';

interface Widget {
  id: string;
  title: string;
  type: string;
  size: string;
}

interface RoleDashboardData {
  role: string;
  layout: Widget[];
  data: Record<string, unknown>;
}

const ROLE_LABELS: Record<string, string> = {
  executive: 'Executive Command Center',
  project_manager: 'Project Manager Dashboard',
  procurement_manager: 'Procurement Manager Dashboard',
  warehouse_manager: 'Warehouse Manager Dashboard',
  equipment_manager: 'Equipment Manager Dashboard',
  fleet_manager: 'Fleet Manager Dashboard',
  maintenance_manager: 'Maintenance Manager Dashboard',
  site_engineer: 'Site Engineer Dashboard',
  store_keeper: 'Store Keeper Dashboard',
  admin: 'Platform Admin Dashboard',
};

export function RoleDashboard({ compact }: { compact?: boolean }) {
  const { user } = useAuthStore();
  const [dash, setDash] = useState<RoleDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardsApi.me().then((r) => setDash(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader message="Loading your dashboard..." />;
  if (!dash) return null;

  const title = ROLE_LABELS[dash.role] || 'Your Dashboard';

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">Role Dashboard</p>
          <h2 className="font-display text-lg font-bold text-white">{title}</h2>
          <p className="text-xs text-slate-500">Signed in as {user?.name} · {user?.role}</p>
        </div>
        <Link to="/analytics" className="btn-ghost text-xs">Full Analytics →</Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {dash.layout.map((widget, i) => (
          <WidgetCard key={widget.id} widget={widget} data={dash.data[widget.id]} delay={i} />
        ))}
      </div>
    </div>
  );
}

function WidgetCard({ widget, data, delay }: { widget: Widget; data: unknown; delay: number }) {
  const count = Array.isArray(data) ? data.length : typeof data === 'object' && data && 'stats' in (data as object) ? '—' : '—';

  return (
    <div className="command-card p-4" style={{ animationDelay: `${delay * 50}ms` }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{widget.type}</p>
      <h4 className="mt-1 text-sm font-semibold text-white">{widget.title}</h4>
      <div className="mt-3">
        {Array.isArray(data) ? (
          <p className="font-mono text-2xl font-bold text-accent">{data.length}</p>
        ) : (
          <pre className="max-h-24 overflow-auto text-[10px] text-slate-400">
            {data ? JSON.stringify(data, null, 0).slice(0, 120) + '…' : 'No data yet'}
          </pre>
        )}
        {Array.isArray(data) && data.length > 0 && (
          <p className="mt-1 text-[10px] text-slate-500">{count} records</p>
        )}
      </div>
    </div>
  );
}
