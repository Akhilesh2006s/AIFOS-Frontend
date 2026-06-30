import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Cog, Truck, Wrench, ShieldCheck, ChevronRight, Activity, FileText } from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { ModuleTabs } from '@/components/layout/ModuleTabs';
import { AssetsSearch } from '@/components/assets/AssetsSearch';
import { useContextStore } from '@/store/context';
import { moduleApi } from '@/api/client';
import { formatCurrency, cn } from '@/lib/utils';

const LINKS = [
  { label: 'Equipment', path: '/equipment', icon: Cog, desc: 'Registry & machine profiles' },
  { label: 'Fleet', path: '/fleet', icon: Truck, desc: 'Vehicles, drivers, trips' },
  { label: 'Maintenance', path: '/maintenance', icon: Wrench, desc: 'Work orders & breakdowns' },
  { label: 'Fuel', path: '/fleet?tab=fuel', icon: Truck, desc: 'Fuel entries & efficiency' },
  { label: 'Compliance', path: '/compliance', icon: ShieldCheck, desc: 'RC, insurance, permits' },
];

const REPORT_TABS = [{ id: 'overview', label: 'Overview' }, { id: 'reports', label: 'Reports' }] as const;

interface DashboardData {
  kpis: {
    totalEquipment: number; running: number; idle: number; underMaintenance: number;
    breakdowns: number; fuelCostToday: number; engineHoursToday: number;
    upcomingServices: number; complianceAlerts: number; utilizationPercent: number; costPerHour: number;
  };
  recentActivity: Array<{ type: string; label: string; status: string }>;
}

export function AssetsWorkspacePage() {
  const activeProject = useContextStore((s) => s.activeProject);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [reports, setReports] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const pid = activeProject?.id;
      const dash = await moduleApi.assets.dashboard(pid);
      setDashboard(dash.data);
      if (tab === 'reports') {
        const rep = await moduleApi.assets.reports(pid);
        setReports(rep.data);
      }
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [activeProject?.id, tab]);

  const k = dashboard?.kpis;
  const segments = k ? [
    { label: 'Running', count: k.running, color: 'bg-emerald-500', pct: k.totalEquipment ? (k.running / k.totalEquipment) * 100 : 0 },
    { label: 'Idle', count: k.idle, color: 'bg-amber-400', pct: k.totalEquipment ? (k.idle / k.totalEquipment) * 100 : 0 },
    { label: 'Breakdown', count: k.underMaintenance, color: 'bg-red-500', pct: k.totalEquipment ? (k.underMaintenance / k.totalEquipment) * 100 : 0 },
  ] : [];

  return (
    <ModulePageLayout
      title="Assets"
      subtitle={activeProject ? `Equipment lifecycle · ${activeProject.name}` : 'Heavy equipment, fleet, maintenance & compliance'}
      loading={loading}
      tabs={<ModuleTabs tabs={REPORT_TABS} active={tab} onChange={(id) => setSearchParams(id === 'overview' ? {} : { tab: id })} accent="#1F4E79" />}
      stats={k ? [
        { label: 'Total Equipment', value: k.totalEquipment, color: '#1F4E79' },
        { label: 'Running', value: k.running, color: '#22C55E' },
        { label: 'Fuel Today', value: formatCurrency(k.fuelCostToday), color: '#F97316' },
        { label: 'Hours Today', value: k.engineHoursToday, color: '#3B82F6' },
        { label: 'Upcoming Services', value: k.upcomingServices, color: '#EAB308' },
        { label: 'Compliance Alerts', value: k.complianceAlerts, color: '#EF4444' },
        { label: 'Utilization', value: `${k.utilizationPercent}%`, color: '#1F4E79', progress: k.utilizationPercent },
        { label: 'Cost / Hour', value: formatCurrency(k.costPerHour), color: '#A855F7' },
      ] : []}
    >
      {tab === 'overview' && (
        <>
          <AssetsSearch />
          {segments.length > 0 && (
            <div className="command-card p-6">
              <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
                {segments.map((s) => (
                  <div key={s.label} className={cn('h-full', s.color)} style={{ width: `${s.pct}%` }} title={`${s.label}: ${s.count}`} />
                ))}
              </div>
              <div className="mt-3 flex gap-6 text-xs text-slate-500">
                {segments.map((s) => <span key={s.label}>{s.label}: <strong className="text-white">{s.count}</strong></span>)}
              </div>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LINKS.map((item) => (
              <Link key={item.path} to={item.path} className="command-card group flex items-start gap-4 p-5 transition-all hover:border-white/15">
                <div className="rounded-xl bg-sky-500/10 p-3 ring-1 ring-sky-500/20">
                  <item.icon size={22} className="text-sky-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{item.label}</h3>
                  <p className="mt-1 text-xs text-slate-500">{item.desc}</p>
                  <ChevronRight size={16} className="mt-2 text-slate-600 group-hover:text-white" />
                </div>
              </Link>
            ))}
          </div>
          {dashboard?.recentActivity && dashboard.recentActivity.length > 0 && (
            <div className="command-card p-5">
              <h3 className="flex items-center gap-2 font-semibold text-white"><Activity size={18} className="text-sky-400" /> Recent Activity</h3>
              <ul className="mt-4 divide-y divide-white/5">
                {dashboard.recentActivity.slice(0, 8).map((a, i) => (
                  <li key={i} className="flex justify-between py-2 text-sm">
                    <span><span className="uppercase text-slate-500">{a.type}</span> {a.label}</span>
                    <span className="text-xs text-slate-500">{a.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {tab === 'reports' && reports && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <ReportCard label="Running Equipment" value={String(reports.running)} />
            <ReportCard label="Idle Equipment" value={String(reports.idle)} />
            <ReportCard label="Compliance Alerts" value={String((reports.complianceAlerts as unknown[])?.length || 0)} />
          </div>
          <div className="command-card p-5">
            <h3 className="flex items-center gap-2 font-semibold text-white"><FileText size={18} /> Utilization Report</h3>
            <p className="mt-2 text-xs text-slate-500">Export CSV / PDF — placeholder</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-slate-500"><th className="p-2">Code</th><th className="p-2">Name</th><th className="p-2">Util %</th><th className="p-2">Hours</th><th className="p-2">Project</th></tr></thead>
                <tbody>
                  {((reports.utilization as Array<Record<string, unknown>>) || []).map((r, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="p-2 font-mono">{String(r.code)}</td>
                      <td className="p-2">{String(r.name)}</td>
                      <td className="p-2">{String(r.utilizationPercent)}%</td>
                      <td className="p-2">{String(r.engineHours)}</td>
                      <td className="p-2">{String(r.projectId || '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-ghost text-xs">Export CSV</button>
              <button type="button" className="btn-ghost text-xs">Export PDF</button>
            </div>
          </div>
        </div>
      )}
    </ModulePageLayout>
  );
}

function ReportCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="command-card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-mono text-2xl text-white">{value}</p>
    </div>
  );
}
