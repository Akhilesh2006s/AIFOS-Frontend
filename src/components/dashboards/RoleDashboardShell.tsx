import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, Clock, Zap } from 'lucide-react';
import { PageLoader } from '@/components/layout/PageShell';
import { ErrorState } from '@/components/ui/ErrorState';
import { RichKpiCard } from '@/components/command/RichKpiCard';
import { useAuthStore } from '@/store/auth';
import type { RoleDashboardTheme } from '@/config/roleDashboardRegistry';
import type {
  DashboardActivity,
  DashboardAlert,
  DashboardKpi,
  DashboardQuickAction,
  DashboardWorkItem,
} from './types';
import { formatDate } from '@/lib/utils';

const THEME_STYLES: Record<RoleDashboardTheme, { accent: string; glow?: string }> = {
  default: { accent: '#F97316' },
  executive: { accent: '#F97316', glow: '0 0 48px rgba(249,115,22,0.12)' },
  safety: { accent: '#EF4444', glow: '0 0 48px rgba(239,68,68,0.15)' },
  quality: { accent: '#14B8A6', glow: '0 0 48px rgba(20,184,166,0.12)' },
  finance: { accent: '#EAB308', glow: '0 0 48px rgba(234,179,8,0.1)' },
  field: { accent: '#06B6D4' },
  admin: { accent: '#94A3B8' },
};

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
  theme?: RoleDashboardTheme;
  workSectionTitle?: string;
  decisions?: DashboardWorkItem[];
  headerBadge?: string;
  companyName?: string;
  showRecentActivity?: boolean;
  largeActions?: boolean;
  error?: string | null;
  onRetry?: () => void;
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
  theme = 'default',
  workSectionTitle = "Things Waiting For You",
  decisions,
  headerBadge,
  companyName,
  showRecentActivity = true,
  largeActions = false,
  error,
  onRetry,
}: RoleDashboardShellProps) {
  const { user } = useAuthStore();
  const themeStyle = THEME_STYLES[theme];
  const workItems = decisions ?? todaysWork;
  const workLabel = decisions ? (workSectionTitle || 'Decisions Today') : workSectionTitle;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  const dayStr = now.toLocaleDateString('en-IN', { weekday: 'long' });

  if (loading) return <PageLoader message={`Loading ${title}...`} />;

  if (error && !kpis.length && !workItems.length) {
    return <ErrorState title={`${title} unavailable`} message={error} onRetry={onRetry} />;
  }

  const shellClass =
    theme === 'safety'
      ? 'border-t-2 border-red-500/40'
      : theme === 'quality'
        ? 'border-t-2 border-teal-500/40'
        : theme === 'finance'
          ? 'border-t-2 border-amber-500/30'
          : '';

  return (
    <div
      className={`mx-auto max-w-7xl space-y-8 pb-14 page-enter ${shellClass}`}
      style={themeStyle.glow ? { boxShadow: `inset ${themeStyle.glow}` } : undefined}
    >
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
          {companyName && (
            <p className="mt-1 text-sm font-medium text-slate-400">{companyName}</p>
          )}
          <p className="mt-1 text-xs text-slate-600">
            {dayStr} | {timeStr}
          </p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">{subtitle}</p>
          <p className="text-overline mt-2">{title}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {headerBadge && (
            <div
              className="rounded-2xl px-4 py-2 text-center ring-1 ring-white/10"
              style={{ background: `${workspaceColor}18`, borderColor: `${workspaceColor}44` }}
            >
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Company Health</p>
              <p className="font-display text-2xl font-bold text-white">{headerBadge}</p>
            </div>
          )}
          {headerLink && (
            <Link to={headerLink.href} className="btn-ghost text-xs">
              {headerLink.label} →
            </Link>
          )}
        </div>
      </motion.div>

      {/* Large field actions (site engineer, supervisor) */}
      {largeActions && quickActions.length > 0 && (
        <section>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.href + action.label}
                to={action.href}
                className="command-card flex min-h-[72px] items-center justify-center gap-3 p-5 text-center transition-all hover:border-white/20 hover:bg-white/5"
                style={{ borderColor: `${themeStyle.accent}33` }}
              >
                {action.icon && <action.icon size={22} style={{ color: themeStyle.accent }} />}
                <p className="text-base font-semibold text-white">{action.label}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

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

      {/* Today's Work / Decisions */}
      {workItems.length > 0 && (
        <section>
          <SectionLabel>{workLabel}</SectionLabel>
          <div className="command-card divide-y divide-white/5 p-0">
            {workItems.map((item) => (
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

      {/* Quick Actions (standard size — hidden when largeActions shown above) */}
      {!largeActions && quickActions.length > 0 && (
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

      {/* Things Waiting / Recent Activity */}
      {showRecentActivity && recentActivity.length > 0 && (
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
