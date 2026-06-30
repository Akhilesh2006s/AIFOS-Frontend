import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Clock, Zap } from 'lucide-react';
import { PageLoader } from '@/components/layout/PageShell';
import { RichKpiCard } from '@/components/command/RichKpiCard';
import { useAuthStore } from '@/store/auth';
import type {
  DashboardActivity,
  DashboardAlert,
  DashboardKpi,
  DashboardQuickAction,
  DashboardWorkItem,
} from './types';
import { formatDate } from '@/lib/utils';

interface RoleDashboardShellProps {
  title: string;
  subtitle: string;
  workspaceLabel: string;
  workspaceColor: string;
  loading: boolean;
  kpis: DashboardKpi[];
  todaysWork: DashboardWorkItem[];
  alerts: DashboardAlert[];
  quickActions: DashboardQuickAction[];
  recentActivity: DashboardActivity[];
  charts?: React.ReactNode;
  table?: {
    title: string;
    emptyMessage?: string;
    headers: string[];
    rows: (string | React.ReactNode)[][];
  };
  headerLink?: { label: string; href: string };
}

export function RoleDashboardShell({
  title,
  subtitle,
  workspaceLabel,
  workspaceColor,
  loading,
  kpis,
  todaysWork,
  alerts,
  quickActions,
  recentActivity,
  charts,
  table,
  headerLink,
}: RoleDashboardShellProps) {
  const { user } = useAuthStore();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) return <PageLoader message={`Loading ${title}...`} />;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-14 page-enter">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: workspaceColor }}>
            {workspaceLabel}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {greeting()}, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">{subtitle}</p>
          <p className="text-overline mt-2">{title}</p>
        </div>
        {headerLink && (
          <Link to={headerLink.href} className="btn-ghost text-xs">
            {headerLink.label} →
          </Link>
        )}
      </motion.div>

      {/* KPIs */}
      {kpis.length > 0 && (
        <section>
          <SectionLabel>KPIs</SectionLabel>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            {kpis.map((kpi, i) => (
              <RichKpiCard key={kpi.label} {...kpi} delay={i} />
            ))}
          </div>
        </section>
      )}

      {/* Today's Work */}
      {todaysWork.length > 0 && (
        <section>
          <SectionLabel>Today&apos;s Work</SectionLabel>
          <div className="command-card divide-y divide-white/5 p-0">
            {todaysWork.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="flex items-center gap-3">
                  <Clock size={16} className="shrink-0 text-slate-500" />
                  <div>
                    {item.href ? (
                      <Link to={item.href} className="text-sm font-medium text-white hover:text-accent">
                        {item.label}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-white">{item.label}</p>
                    )}
                    {item.detail && <p className="text-xs text-slate-500">{item.detail}</p>}
                  </div>
                </div>
                {item.status && (
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase text-slate-400">
                    {item.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <section>
          <SectionLabel>Alerts</SectionLabel>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`command-card flex items-start gap-3 p-4 ${
                  alert.severity === 'critical'
                    ? 'border-red-500/30 bg-red-500/5'
                    : alert.severity === 'warning'
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : ''
                }`}
              >
                <AlertTriangle
                  size={18}
                  className={
                    alert.severity === 'critical'
                      ? 'text-red-400'
                      : alert.severity === 'warning'
                        ? 'text-amber-400'
                        : 'text-blue-400'
                  }
                />
                <div className="flex-1">
                  {alert.href ? (
                    <Link to={alert.href} className="text-sm font-semibold text-white hover:text-accent">
                      {alert.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold text-white">{alert.title}</p>
                  )}
                  {alert.message && <p className="mt-0.5 text-xs text-slate-400">{alert.message}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <section>
          <SectionLabel>Quick Actions</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {quickActions.map((action) => (
              <Link
                key={action.href + action.label}
                to={action.href}
                className="command-card group flex items-center gap-3 p-4 transition-all hover:border-white/15"
              >
                {action.icon ? (
                  <div className="rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
                    <action.icon size={18} className="text-accent" />
                  </div>
                ) : (
                  <Zap size={18} className="text-accent" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{action.label}</p>
                  {action.desc && <p className="text-[10px] text-slate-500">{action.desc}</p>}
                </div>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-white" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <section>
          <SectionLabel>Recent Activity</SectionLabel>
          <div className="command-card p-5">
            <ul className="divide-y divide-white/5">
              {recentActivity.slice(0, 10).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <span className="text-slate-300">
                    <span className="mr-2 uppercase text-[10px] text-slate-500">{item.type}</span>
                    {item.label}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {item.status && <span className="mr-2">{item.status}</span>}
                    {item.at ? formatDate(item.at) : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Charts */}
      {charts && (
        <section>
          <SectionLabel>Charts</SectionLabel>
          <div className="grid gap-4 lg:grid-cols-2">{charts}</div>
        </section>
      )}

      {/* Table */}
      {table && (
        <section>
          <SectionLabel>{table.title}</SectionLabel>
          <div className="command-card overflow-x-auto p-0 scrollbar-thin">
            {table.rows.length === 0 ? (
              <p className="table-empty-cell text-sm text-slate-500">{table.emptyMessage ?? 'No records'}</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    {table.headers.map((h) => (
                      <th key={h} scope="col">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, i) => (
                    <tr key={i} className="data-table-row">
                      {row.map((cell, j) => (
                        <td key={j}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <p className="section-label">{children}</p>
      <div className="h-px flex-1 bg-white/5" aria-hidden />
    </div>
  );
}
