import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Handshake, Package, Warehouse, ChevronRight, Activity } from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { LivePipeline } from '@/components/command/LivePipeline';
import { SupplyChainSearch } from '@/components/supply-chain/SupplyChainSearch';
import { RoleTodayWorkPanel } from '@/components/command/RoleTodayWorkPanel';
import { useContextStore } from '@/store/context';
import { moduleApi } from '@/api/client';
import { formatCurrency } from '@/lib/utils';

const LINKS = [
  { label: 'Procurement', path: '/procurement', icon: ShoppingCart, desc: 'PR, RFQ, compare, PO' },
  { label: 'Vendors', path: '/vendors', icon: Handshake, desc: 'Supplier registry' },
  { label: 'Warehouse', path: '/inventory?tab=warehouses', icon: Warehouse, desc: 'Locations & stock' },
  { label: 'Inventory', path: '/inventory', icon: Package, desc: 'GRN, issues, ledger' },
  { label: 'Consumption', path: '/consumption', icon: Package, desc: 'Site usage & reconciliation' },
];

interface DashboardData {
  kpis: {
    pendingPR: number;
    openRfq: number;
    poAwaitingApproval: number;
    todayGrn: number;
    lowStock: number;
    pendingIssues: number;
    materialConsumption: number;
    procurementSpend: number;
  };
  recentActivity: Array<{ type: string; label: string; status: string; at?: string }>;
  recentNotifications: Array<{ title: string; message: string; type: string }>;
}

export function SupplyChainWorkspacePage() {
  const activeProject = useContextStore((s) => s.activeProject);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [pipeline, setPipeline] = useState<Array<{ key: string; label: string; status: 'done' | 'active' | 'waiting'; detail?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const pid = activeProject?.id;
      const [dash, projects] = await Promise.all([
        moduleApi.supplyChain.dashboard(pid),
        pid ? Promise.resolve(null) : moduleApi.projects.list(),
      ]);
      setDashboard(dash.data);
      const projectId = pid || projects?.data[0]?._id;
      if (projectId) {
        const pipe = await moduleApi.supplyChain.pipeline(projectId);
        setPipeline(pipe.data);
      }
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [activeProject?.id]);

  const k = dashboard?.kpis;

  return (
    <ModulePageLayout
      title="Supply Chain"
      subtitle={activeProject ? `Procurement lifecycle for ${activeProject.name}` : 'Material requirement through site consumption'}
      loading={loading}
      stats={[
        { label: 'Pending PR', value: k?.pendingPR ?? '—', color: '#EAB308' },
        { label: 'Open RFQ', value: k?.openRfq ?? '—', color: '#F97316' },
        { label: "Today's GRN", value: k?.todayGrn ?? '—', color: '#22C55E' },
        { label: 'Low Stock', value: k?.lowStock ?? '—', color: '#EF4444' },
        { label: 'Pending Issues', value: k?.pendingIssues ?? '—', color: '#A855F7' },
        { label: 'Procurement Spend', value: k ? formatCurrency(k.procurementSpend) : '—', color: '#3B82F6' },
      ]}
    >
      <SupplyChainSearch />

      <div className="mb-6">
        <RoleTodayWorkPanel />
      </div>

      {pipeline.length > 0 && <LivePipeline steps={pipeline} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((item) => (
          <Link key={item.path} to={item.path} className="command-card group flex items-start gap-4 p-5 transition-all hover:border-white/15">
            <div className="rounded-xl bg-emerald-500/10 p-3 ring-1 ring-emerald-500/20">
              <item.icon size={22} className="text-emerald-400" />
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
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <Activity size={18} className="text-emerald-400" /> Recent Activity
          </h3>
          <ul className="mt-4 divide-y divide-white/5">
            {dashboard.recentActivity.slice(0, 8).map((a, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-300"><span className="uppercase text-slate-500">{a.type}</span> {a.label}</span>
                <span className="text-xs text-slate-500">{a.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ModulePageLayout>
  );
}
