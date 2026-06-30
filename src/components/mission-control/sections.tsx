import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, Bell, CheckCircle2, ChevronRight, Clock,
  FileText, Fuel, Search, Shield, ShieldCheck, TrendingUp, Users, Wrench,
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { explorerPath } from '@/lib/explorerLinks';
import { TodayWorkQueue } from '@/components/command/TodayWorkQueue';
import { missionControlApi } from '@/api/client';
import type {
  AlertItem, ActivityItem, MissionControlOverview, PipelineStage,
  ProjectHealthRow, TodaysWorkItem,
} from './types';

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
    </div>
  );
}

function KpiCard({ label, value, link, accent }: { label: string; value: number | string; link: string; accent?: string }) {
  return (
    <Link
      to={link}
      className="kpi-link-card group flex flex-col px-4 py-3"
      aria-label={`${label}: ${value}`}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn('mt-1 font-mono text-2xl font-bold', accent || 'text-white')}>{value}</p>
      <ChevronRight size={14} className="mt-2 text-slate-600 opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

export function FinancialHealthSection({ health }: { health: NonNullable<MissionControlOverview['financialHealth']> }) {
  const links = health.links;
  return (
    <section>
      <SectionHeader title="Financial Health" subtitle="Operational spend from Projects, Supply Chain, and Assets — read-only intelligence" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Total Budget" value={formatCurrency(health.totalBudget)} link={links.business} accent="text-sky-400" />
        <KpiCard label="Actual Spend" value={formatCurrency(health.actualSpend)} link={links.business} />
        <KpiCard label="Committed" value={formatCurrency(health.committedCost)} link={links.business} accent="text-amber-400" />
        <KpiCard label="Remaining" value={formatCurrency(health.remainingBudget)} link={links.business} accent="text-emerald-400" />
        <KpiCard label="Utilization" value={`${health.utilizationPercent}%`} link={links.budgetVsActual || links.business} />
        <KpiCard
          label="Over Budget"
          value={health.projectsOverBudget}
          link={links.projects || links.business}
          accent={health.projectsOverBudget > 0 ? 'text-red-400' : undefined}
        />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {health.forecastFinalCost != null && (
          <KpiCard label="Forecast" value={formatCurrency(health.forecastFinalCost)} link={links.business} accent="text-violet-400" />
        )}
        {health.highestCostDriver && (
          <KpiCard label="Top Driver" value={health.highestCostDriver.category} link={health.highestCostDriver.link} />
        )}
        {health.fuelCostToday != null && (
          <KpiCard label="Fuel Today" value={formatCurrency(health.fuelCostToday)} link="/equipment" accent="text-orange-400" />
        )}
        {health.maintenanceCostToday != null && (
          <KpiCard label="Maint. Today" value={formatCurrency(health.maintenanceCostToday)} link="/maintenance" accent="text-purple-400" />
        )}
        {health.largestBudgetVariance && (
          <KpiCard
            label="Largest Variance"
            value={health.largestBudgetVariance.name}
            link={health.largestBudgetVariance.link}
            accent="text-red-400"
          />
        )}
        {health.largestProjectSpend && (
          <KpiCard
            label="Top Spend"
            value={health.largestProjectSpend.name}
            link={health.largestProjectSpend.link}
          />
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {health.pendingVendorBills != null && (
          <KpiCard label="Pending Bills" value={health.pendingVendorBills} link={links.vendorBills || '/business/vendor-bills'} accent="text-sky-400" />
        )}
        {health.exceptionBills != null && (
          <KpiCard label="Exception Bills" value={health.exceptionBills} link={links.exceptions || '/business/vendor-bills?tab=exceptions'} accent={health.exceptionBills > 0 ? 'text-red-400' : undefined} />
        )}
        {health.blockedPayments != null && (
          <KpiCard label="Blocked Pay" value={formatCurrency(health.blockedPayments)} link={links.exceptions || '/business/vendor-bills?tab=exceptions'} />
        )}
        {health.invoicesAwaitingApproval != null && (
          <KpiCard label="Awaiting Approval" value={health.invoicesAwaitingApproval} link={links.vendorBills || '/business/vendor-bills?tab=review'} />
        )}
        {health.largestInvoice && (
          <KpiCard label="Largest Invoice" value={formatCurrency(health.largestInvoice.amount)} link={health.largestInvoice.link} />
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {health.paymentsDueToday != null && (
          <KpiCard label="Due Today" value={formatCurrency(health.paymentsDueToday)} link={links.payments || '/business/payments'} accent="text-yellow-400" />
        )}
        {health.overduePayments != null && (
          <KpiCard label="Overdue Pay" value={health.overduePayments} link={links.paymentsOverdue || '/business/payments?tab=overdue'} accent="text-red-400" />
        )}
        {health.cashRequiredThisWeek != null && (
          <KpiCard label="Cash This Week" value={formatCurrency(health.cashRequiredThisWeek)} link={links.payments || '/business/payments'} />
        )}
        {health.largestOutstandingVendor && (
          <KpiCard label="Top Vendor Due" value={formatCurrency(health.largestOutstandingVendor.amount)} link={health.largestOutstandingVendor.link} />
        )}
        {health.paymentsAwaitingApproval != null && (
          <KpiCard label="Pay Approval" value={health.paymentsAwaitingApproval} link={links.payments || '/business/payments?tab=scheduled'} />
        )}
      </div>
      {(health.recentlyPaidBills?.length ?? 0) > 0 && (
        <div className="command-card mt-4 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Recently Paid</p>
          <ul className="mt-2 divide-y divide-white/5">
            {health.recentlyPaidBills!.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <Link to={p.link} className="text-slate-300 hover:text-white">{p.paymentNumber}</Link>
                <span className="font-mono text-emerald-400">{formatCurrency(p.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {(health.overBudgetProjects?.length ?? 0) > 0 && (
        <div className="command-card mt-4 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Over Budget Projects</p>
          <ul className="mt-2 divide-y divide-white/5">
            {health.overBudgetProjects!.slice(0, 5).map((p) => (
              <li key={p.projectId} className="flex items-center justify-between py-2 text-sm">
                <Link to={p.link} className="text-slate-300 hover:text-white">{p.name}</Link>
                <span className="font-mono text-red-400">{p.utilizationPercent}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {(health.recommendations?.length ?? 0) > 0 && (
        <div className="command-card mt-4 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Executive Recommendations</p>
          <ul className="mt-2 space-y-2">
            {health.recommendations!.map((r) => (
              <li key={r.id}>
                <Link to={r.link} className="block rounded-lg border border-white/5 px-3 py-2 hover:border-white/15">
                  <p className="text-sm font-medium text-white">{r.title}</p>
                  <p className="text-xs text-slate-500">{r.message}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {(health.largestCostIncrease?.length ?? 0) > 0 && (
        <div className="command-card mt-4 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Largest Project Spend</p>
          <ul className="mt-2 divide-y divide-white/5">
            {health.largestCostIncrease!.slice(0, 5).map((p) => (
              <li key={p.projectId} className="flex items-center justify-between py-2 text-sm">
                <Link to={p.link} className="text-slate-300 hover:text-white">{p.name}</Link>
                <span className="font-mono text-accent">{formatCurrency(p.actualCost)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function ExecutiveDecisionsSection({ decisions }: {
  decisions: NonNullable<MissionControlOverview['executiveDecisions']>;
}) {
  return (
    <section>
      <TodayWorkQueue
        title={decisions.title}
        subtitle={decisions.subtitle}
        items={decisions.items.map((i) => ({
          ...i,
          priority: i.priority as 'critical' | 'high' | 'medium' | 'low',
        }))}
        estimatedMinutes={decisions.estimatedMinutes}
      />
    </section>
  );
}

export function ExecutiveSummarySection({ summary, platform }: {
  summary: MissionControlOverview['executiveSummary'];
  platform?: MissionControlOverview['platform'];
}) {
  const links = summary.links;
  const kpis = [
    { label: 'Active Projects', value: summary.activeProjects, link: links.activeProjects, accent: 'text-sky-400' },
    { label: 'Delayed Projects', value: summary.delayedProjects, link: links.delayedProjects, accent: summary.delayedProjects > 0 ? 'text-amber-400' : undefined },
    { label: 'Active Equipment', value: summary.activeEquipment, link: links.activeEquipment },
    { label: 'Under Maintenance', value: summary.equipmentUnderMaintenance, link: links.equipmentMaintenance, accent: summary.equipmentUnderMaintenance > 0 ? 'text-orange-400' : undefined },
    { label: 'Pending PR', value: summary.pendingPurchaseRequisitions, link: links.pendingPR, accent: summary.pendingPurchaseRequisitions > 0 ? 'text-yellow-400' : undefined },
    { label: 'Pending RFQ', value: summary.pendingRfqs, link: links.pendingRFQ },
    { label: 'Pending PO', value: summary.pendingPurchaseOrders, link: links.pendingPO },
    { label: 'Low Stock', value: summary.lowStockMaterials, link: links.lowStock, accent: summary.lowStockMaterials > 0 ? 'text-red-400' : undefined },
    { label: 'Open Issues', value: summary.openIssues, link: links.openIssues },
    { label: 'Open Breakdowns', value: summary.openBreakdowns, link: links.openBreakdowns, accent: summary.openBreakdowns > 0 ? 'text-red-400' : undefined },
  ];

  return (
    <section>
      <SectionHeader
        title="Executive Summary"
        subtitle={`Budget ${formatCurrency(summary.totalSpent)} / ${formatCurrency(summary.totalBudget)} · ${summary.budgetUtilization}% utilized`}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>
      {platform && (
        <div className="mt-3 flex flex-wrap gap-3">
          <div className="command-card flex items-center gap-2 px-4 py-2 text-sm">
            <Users size={16} className="text-accent" />
            <span className="text-slate-400">Users</span>
            <span className="font-mono font-semibold text-white">{platform.userCount}</span>
          </div>
          <div className="command-card flex items-center gap-2 px-4 py-2 text-sm">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="text-slate-400">Platform</span>
            <span className="font-medium capitalize text-emerald-400">{platform.status}</span>
          </div>
        </div>
      )}
    </section>
  );
}

export function PipelineSection({ stages }: { stages: PipelineStage[] }) {
  return (
    <section>
      <SectionHeader title="Operational Pipeline" subtitle="Production → Consumption — live counts per stage" />
      <div className="command-card overflow-x-auto p-4">
        <div className="flex min-w-max flex-col gap-0">
          {stages.map((stage, i) => (
            <div key={stage.key}>
              <Link
                to={stage.link}
                className="group flex items-center gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5"
              >
                <div className="w-28 shrink-0">
                  <p className="text-sm font-medium text-slate-200">{stage.label}</p>
                </div>
                <div className="flex flex-1 gap-3 text-center">
                  <StatPill label="Count" value={stage.count} />
                  <StatPill label="Pending" value={stage.pending} warn={stage.pending > 0} />
                  <StatPill label="Delayed" value={stage.delayed} danger={stage.delayed > 0} />
                  <StatPill label="Done" value={stage.completed} ok />
                </div>
                <ChevronRight size={14} className="text-slate-600 opacity-0 group-hover:opacity-100" />
              </Link>
              {i < stages.length - 1 && <div className="ml-6 border-l border-dashed border-white/10 py-1 pl-4 text-[10px] text-slate-600">↓</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatPill({ label, value, warn, danger, ok }: { label: string; value: number; warn?: boolean; danger?: boolean; ok?: boolean }) {
  return (
    <div className="min-w-[4rem] rounded-lg bg-white/5 px-2 py-1">
      <p className="text-[9px] uppercase text-slate-500">{label}</p>
      <p className={cn(
        'font-mono text-sm font-semibold',
        danger ? 'text-red-400' : warn ? 'text-amber-400' : ok ? 'text-emerald-400' : 'text-white',
      )}>{value}</p>
    </div>
  );
}

const PRIORITY_STYLE: Record<string, string> = {
  critical: 'border-red-500/30 bg-red-500/10 text-red-300',
  high: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  medium: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  low: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
};

export function TodaysWorkSection({ items }: { items: TodaysWorkItem[] }) {
  if (items.length === 0) {
    return (
      <section>
        <SectionHeader title="Today's Work" subtitle="Tasks, approvals, and deadlines for today" />
        <div className="command-card p-6 text-center text-sm text-slate-500">No urgent items for today</div>
      </section>
    );
  }
  return (
    <section>
      <SectionHeader title="Today's Work" subtitle="Tasks, approvals, and deadlines for today" />
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item, i) => (
          <Link
            key={`${item.type}-${i}`}
            to={item.link}
            className={cn('command-card flex items-center justify-between gap-3 border p-4 transition-colors hover:border-white/20', PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.medium)}
          >
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider opacity-70">{item.type.replace('_', ' ')}</p>
              <p className="truncate text-sm font-medium">{item.label}</p>
            </div>
            <ArrowRight size={14} className="shrink-0 opacity-60" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ActivityFeedSection({ items }: { items: ActivityItem[] }) {
  return (
    <section>
      <SectionHeader title="Live Activity Feed" subtitle="Chronological operational events" />
      <div className="command-card divide-y divide-white/5">
        {items.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">No recent activity</p>
        ) : (
          items.map((a) => (
            <Link key={a.id} to={a.link} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]">
              <div className="mt-0.5 rounded-lg bg-accent/10 p-1.5">
                <Clock size={14} className="text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-200">{a.title}</p>
                <p className="text-xs text-slate-500">{a.message}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-slate-600">
                  <span>{a.user}</span>
                  {a.projectId && <span>· Project</span>}
                  {a.timestamp && (
                    <span>
                      · {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' '}
                      {formatDate(a.timestamp)}
                    </span>
                  )}
                </div>
              </div>
              <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[9px] uppercase text-slate-500">{a.type}</span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

const ALERT_PRIORITY: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 ring-red-500/30',
  high: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  medium: 'bg-sky-500/15 text-sky-400 ring-sky-500/30',
  low: 'bg-slate-500/15 text-slate-400 ring-slate-500/30',
};

export function AlertsSection({ alerts }: { alerts: AlertItem[] }) {
  return (
    <section>
      <SectionHeader title="Alerts" subtitle="Priority operational and compliance alerts" />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {alerts.length === 0 ? (
          <div className="command-card col-span-full p-6 text-center text-sm text-slate-500">No active alerts</div>
        ) : (
          alerts.map((a, i) => (
            <Link key={i} to={a.link} className="command-card group p-4 transition-colors hover:border-white/20">
              <div className="flex items-start justify-between gap-2">
                <AlertTriangle size={18} className={cn('shrink-0', a.priority === 'critical' ? 'text-red-400' : 'text-amber-400')} />
                <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ring-1', ALERT_PRIORITY[a.priority] || ALERT_PRIORITY.medium)}>
                  {a.priority}
                </span>
              </div>
              <p className="mt-2 font-medium text-white">{a.title}</p>
              <p className="mt-1 text-xs text-slate-500">{a.message}</p>
              <ChevronRight size={14} className="mt-2 text-slate-600 opacity-0 group-hover:opacity-100" />
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

export function ProjectHealthSection({ rows }: { rows: ProjectHealthRow[] }) {
  const [sort, setSort] = useState<'healthScore' | 'progress' | 'name'>('healthScore');

  const sorted = [...rows].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    return (a[sort] as number) - (b[sort] as number);
  });

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <SectionHeader title="Project Health" subtitle="All projects — sorted by lowest health first" />
        <div className="flex gap-1">
          {(['healthScore', 'progress', 'name'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                'rounded-lg px-2 py-1 text-[10px] font-medium uppercase',
                sort === s ? 'bg-accent/20 text-accent' : 'text-slate-500 hover:bg-white/5',
              )}
            >
              {s === 'healthScore' ? 'Health' : s}
            </button>
          ))}
        </div>
      </div>
      <div className="command-card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Health</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Issues</th>
              <th className="px-4 py-3">Delayed</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Procurement</th>
              <th className="px-4 py-3">Equipment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sorted.map((p) => (
              <tr key={p.id} className="group hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <Link to={p.link} className="font-medium text-white group-hover:text-accent">{p.name}</Link>
                  <p className="text-[10px] text-slate-500">{p.code}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('font-mono font-semibold', healthColor(p.healthScore))}>{p.healthScore}</span>
                  <p className="text-[10px] text-slate-500">{p.healthLabel}</p>
                </td>
                <td className="px-4 py-3 font-mono">{p.progress}%</td>
                <td className="px-4 py-3 font-mono">{p.openIssues}</td>
                <td className="px-4 py-3 font-mono text-amber-400">{p.delayedMilestones}</td>
                <td className="px-4 py-3">
                  <BudgetBadge status={p.budgetStatus} />
                </td>
                <td className="px-4 py-3 font-mono">{p.openProcurement}</td>
                <td className="px-4 py-3 font-mono">{p.equipmentAssigned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function healthColor(score: number) {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function BudgetBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ok: 'text-emerald-400',
    warn: 'text-amber-400',
    over: 'text-red-400',
  };
  return <span className={cn('text-xs font-medium uppercase', map[status] || 'text-slate-400')}>{status}</span>;
}

export function AssetHealthSection({ health }: { health: Record<string, number> }) {
  const items = [
    { label: 'Running', value: health.running, link: '/equipment', icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Idle', value: health.idle, link: '/equipment?status=idle', icon: Clock, color: 'text-slate-400' },
    { label: 'Breakdown', value: health.breakdown, link: '/maintenance?tab=breakdowns', icon: Wrench, color: 'text-red-400' },
    { label: 'Maint. Due', value: health.maintenanceDue, link: '/maintenance', icon: Wrench, color: 'text-amber-400' },
    { label: 'Fuel Today', value: formatCurrency(health.fuelToday ?? 0), link: '/equipment', icon: Fuel, color: 'text-sky-400' },
    { label: 'Avg Utilization', value: `${health.avgUtilization ?? 0}%`, link: '/assets', icon: TrendingUp },
    { label: 'Compliance Expiring', value: health.complianceExpiring, link: '/compliance', icon: Shield, color: 'text-orange-400' },
  ];
  return (
    <section>
      <SectionHeader title="Asset Health" subtitle="Fleet and equipment operational status" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <Link key={item.label} to={item.link} className="command-card flex items-center gap-3 p-4 hover:border-white/20">
            <item.icon size={20} className={item.color || 'text-accent'} />
            <div>
              <p className="text-[10px] uppercase text-slate-500">{item.label}</p>
              <p className="font-mono text-lg font-bold text-white">{item.value}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function SupplyChainHealthSection({ health }: { health: Record<string, number> }) {
  const items = [
    { label: 'Open PR', value: health.openPR, link: '/procurement?tab=pr' },
    { label: 'Open RFQ', value: health.openRFQ, link: '/procurement?tab=rfq' },
    { label: 'Pending PO', value: health.pendingPO, link: '/procurement?tab=po' },
    { label: "Today's GRN", value: health.todayGrn, link: '/inventory?tab=grn' },
    { label: 'Material Issued', value: health.materialIssued, link: '/inventory?tab=issues' },
    { label: "Today's Consumption", value: health.todayConsumption, link: '/consumption' },
    { label: 'Low Stock', value: health.lowStock, link: '/inventory?tab=materials', warn: true },
    { label: 'Procurement Spend', value: formatCurrency(health.procurementSpend ?? 0), link: '/supply-chain' },
  ];
  return (
    <section>
      <SectionHeader title="Supply Chain Health" subtitle="Procurement and inventory pipeline" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((item) => (
          <Link key={item.label} to={item.link} className="command-card p-4 hover:border-white/20">
            <p className="text-[10px] uppercase text-slate-500">{item.label}</p>
            <p className={cn('mt-1 font-mono text-xl font-bold', item.warn && Number(item.value) > 0 ? 'text-red-400' : 'text-white')}>
              {item.value}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function DocumentCenterSection({ center }: { center: NonNullable<MissionControlOverview['documentCenter']> }) {
  const links = center.links;
  return (
    <section>
      <SectionHeader title="Document Center" subtitle="Enterprise repository — approvals, versions, entity-linked documents" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <KpiCard
          label="Pending Approvals"
          value={center.pendingDocumentApprovals}
          link={links.pending}
          accent={center.pendingDocumentApprovals > 0 ? 'text-amber-400' : undefined}
        />
        <KpiCard label="Total Documents" value={center.totalDocuments} link={links.center} />
        <KpiCard label="Archive" value="View" link={links.archive} />
      </div>
      {center.recentUploads?.length > 0 && (
        <div className="command-card mt-3 divide-y divide-white/5">
          {center.recentUploads.slice(0, 5).map((d) => (
            <Link key={d.id} to={d.link} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]">
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={14} className="shrink-0 text-slate-500" />
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-200">{d.title}</p>
                  <p className="text-[10px] text-slate-500">{d.category.replace(/_/g, ' ')} · v{d.version ?? 1}</p>
                </div>
              </div>
              <span className={cn(
                'shrink-0 rounded px-1.5 py-0.5 text-[10px]',
                d.approvalStatus === 'pending' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-400',
              )}>
                {d.approvalStatus}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function CompliancePlusSection({ compliance }: { compliance: NonNullable<MissionControlOverview['compliancePlus']> }) {
  const links = compliance.links;
  return (
    <section>
      <SectionHeader title="Compliance+" subtitle="Renewals, approvals, escalations — company, equipment, vendor, labour, contract" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Pending Renewals" value={compliance.pendingRenewals} link={links.renewals} accent={compliance.pendingRenewals > 0 ? 'text-amber-400' : undefined} />
        <KpiCard label="Pending Approvals" value={compliance.pendingApprovals} link={links.approvals} accent="text-orange-400" />
        <KpiCard label="Expiring Soon" value={compliance.expiringSoon} link={links.center} accent="text-yellow-400" />
        <KpiCard label="Expired" value={compliance.expired} link={links.center} accent={compliance.expired > 0 ? 'text-red-400' : undefined} />
        <KpiCard label="Escalated" value={compliance.escalated} link={links.timeline} accent={compliance.escalated > 0 ? 'text-red-400' : undefined} />
      </div>
      {compliance.alerts?.length > 0 && (
        <div className="command-card mt-3 divide-y divide-white/5">
          {compliance.alerts.map((a) => (
            <Link key={a.id} to={a.link} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <ShieldCheck size={14} className="text-amber-400" />
                <span className="text-sm text-slate-200">{a.documentType}</span>
              </div>
              <span className="text-[10px] text-amber-300">{a.alertTier?.replace(/_/g, ' ')}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function WorkforceSection({ workforce }: { workforce: NonNullable<MissionControlOverview['workforce']> }) {
  const links = workforce.links;
  return (
    <section>
      <SectionHeader title="Workforce" subtitle="People on site · attendance · permits · training" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="On Site" value={workforce.peopleOnSite} link={links.workforce} accent="text-sky-400" />
        <KpiCard label="Present" value={workforce.attendancePresent} link={links.attendance} accent="text-emerald-400" />
        <KpiCard label="Open Permits" value={workforce.openPermits} link={links.allocations} />
        <KpiCard label="Cert Alerts" value={workforce.safetyAlerts} link={links.workforce} accent={workforce.safetyAlerts > 0 ? 'text-red-400' : undefined} />
        <KpiCard label="Training Due" value={workforce.trainingExpiry} link={links.employees} accent="text-amber-400" />
        <KpiCard label="Contractors" value={workforce.contractors} link={links.workforce} />
      </div>
    </section>
  );
}

export function SafetySection({ safety }: { safety: NonNullable<MissionControlOverview['safety']> }) {
  const links = safety.links;
  return (
    <section>
      <SectionHeader title="Safety" subtitle="Incidents · near miss · PPE · toolbox talks · score" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Critical" value={safety.criticalIncidents} link={links.incidents} accent={safety.criticalIncidents > 0 ? 'text-red-400' : undefined} />
        <KpiCard label="Near Miss" value={safety.openNearMiss} link={links.nearMiss} accent="text-amber-400" />
        <KpiCard label="PPE %" value={`${safety.ppeCompliance}%`} link={links.ppe} accent="text-sky-400" />
        <KpiCard label="Safety Score" value={safety.safetyScore} link={links.safety} accent={safety.safetyScore < 70 ? 'text-red-400' : 'text-emerald-400'} />
        <KpiCard label="Toolbox Today" value={safety.toolboxTalksToday} link={links.toolbox} />
        <KpiCard label="Observations" value={safety.openObservations} link={links.safety} />
      </div>
    </section>
  );
}

export function PtwSection({ ptw }: { ptw: NonNullable<MissionControlOverview['ptw']> }) {
  const links = ptw.links;
  return (
    <section>
      <SectionHeader title="Permit to Work" subtitle="Pending · active · high risk · expired · closures" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Pending" value={ptw.pendingApprovals} link={links.pending} accent="text-amber-400" />
        <KpiCard label="Active" value={ptw.activePermits} link={links.active} accent="text-emerald-400" />
        <KpiCard label="High Risk" value={ptw.highRiskWork} link={links.highRisk} accent={ptw.highRiskWork > 0 ? 'text-red-400' : undefined} />
        <KpiCard label="Expired" value={ptw.expiredPermits} link={links.permits} accent={ptw.expiredPermits > 0 ? 'text-red-400' : undefined} />
        <KpiCard label="Closed Today" value={ptw.closedToday} link={links.permits} />
      </div>
    </section>
  );
}

export function QualitySection({ quality }: { quality: NonNullable<MissionControlOverview['quality']> }) {
  const links = quality.links;
  return (
    <section>
      <SectionHeader title="Quality" subtitle="NCR · tests · inspections · quality score" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Open NCR" value={quality.openNcr} link={links.ncr} accent={quality.openNcr > 0 ? 'text-red-400' : undefined} />
        <KpiCard label="Failed Tests" value={quality.failedTests} link={links.tests} accent={quality.failedTests > 0 ? 'text-red-400' : undefined} />
        <KpiCard label="Pending Insp." value={quality.pendingInspections} link={links.inspections} accent="text-amber-400" />
        <KpiCard label="Quality Score" value={quality.qualityScore} link={links.quality} accent={quality.qualityScore < 70 ? 'text-red-400' : 'text-emerald-400'} />
        <KpiCard label="CAPA Pending" value={quality.capaPending} link={links.capa} accent="text-violet-400" />
      </div>
    </section>
  );
}

export function WorkforceIntelligenceSection({ workforceIntelligence: wi }: { workforceIntelligence: NonNullable<MissionControlOverview['workforceIntelligence']> }) {
  const links = wi.links;
  return (
    <section>
      <SectionHeader title="Workforce Intelligence" subtitle="Productivity · training · skills · certifications · performance" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Productivity" value={wi.productivity} link={links.productivity} accent="text-emerald-400" />
        <KpiCard label="Training Due" value={wi.trainingDue} link={links.training} accent={wi.trainingDue > 0 ? 'text-amber-400' : undefined} />
        <KpiCard label="Skill Gaps" value={wi.skillGaps} link={links.skills} accent={wi.skillGaps > 0 ? 'text-red-400' : undefined} />
        <KpiCard label="Cert Expiry" value={wi.certificationExpiry} link={links.certifications} accent={wi.certificationExpiry > 0 ? 'text-red-400' : undefined} />
        <KpiCard label="Performance" value={wi.topPerformingTeams[0] ? String((wi.topPerformingTeams[0] as { crewScore?: number }).crewScore ?? '—') : '—'} link={links.performance} accent="text-sky-400" />
      </div>
    </section>
  );
}

export function OperationalIntelligenceSection({ operationalIntelligence: oi }: { operationalIntelligence: NonNullable<MissionControlOverview['operationalIntelligence']> }) {
  const links = oi.links;
  return (
    <section>
      <SectionHeader title="Operational Intelligence" subtitle="Rules · recommendations · predictions · risks · briefs" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Overall Risk" value={oi.overallRisk} link={links.risks || '/intelligence?tab=risks'} accent={oi.overallRisk > 60 ? 'text-red-400' : 'text-emerald-400'} />
        <KpiCard label="Recommendations" value={oi.recommendations} link={links.recommendations || '/intelligence?tab=recommendations'} accent="text-violet-400" />
        <KpiCard label="Critical Recs" value={oi.criticalRecommendations} link={links.recommendations || '/intelligence?tab=recommendations'} accent={oi.criticalRecommendations > 0 ? 'text-red-400' : undefined} />
        <KpiCard label="Rules (24h)" value={oi.rulesTriggered} link={links.rules || '/intelligence?tab=rules'} accent="text-amber-400" />
        <KpiCard label="Intelligence Hub" value="Open" link={links.intelligence || '/intelligence'} accent="text-sky-400" />
      </div>
    </section>
  );
}

export function RecommendationsSection({ recommendations: rec }: { recommendations: NonNullable<MissionControlOverview['recommendations']> }) {
  const links = rec.links;
  return (
    <section>
      <SectionHeader title="Recommendations" subtitle="Deterministic actions from operational data — no AI" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard label="Active" value={rec.total} link={links.intelligence || '/intelligence?tab=recommendations'} accent="text-violet-400" />
        <KpiCard label="Critical" value={rec.critical} link={links.intelligence || '/intelligence?tab=recommendations'} accent={rec.critical > 0 ? 'text-red-400' : undefined} />
        <KpiCard label="Avg Score" value={rec.avgScore} link={links.scoring || '/intelligence?tab=recommendations&sub=scoring'} accent="text-amber-400" />
        <KpiCard label="View All" value="Open" link={links.intelligence || '/intelligence?tab=recommendations'} accent="text-sky-400" />
      </div>
      {rec.topRecommendations.length > 0 && (
        <div className="mt-3 space-y-2">
          {rec.topRecommendations.slice(0, 3).map((r) => (
            <Link key={r.id} to={r.link} className="command-card flex items-center justify-between px-4 py-3 hover:border-violet-500/30">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{r.title}</p>
                <p className="truncate text-xs text-slate-500">{r.message}</p>
              </div>
              <span className="ml-3 shrink-0 font-mono text-sm text-violet-400">{r.score}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function PredictionsSection({ predictions: pred }: { predictions: NonNullable<MissionControlOverview['predictions']> }) {
  const links = pred.links;
  return (
    <section>
      <SectionHeader title="Prediction Summary" subtitle="Deterministic forecasts from operational history — no AI" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard label="Accuracy" value={`${pred.overallAccuracy}%`} link={links.accuracy || '/intelligence?tab=predictions&sub=accuracy'} accent="text-violet-400" />
        <KpiCard label="Projects" value={pred.projectsWithForecasts} link={links.predictions || '/intelligence?tab=predictions&sub=projects'} accent="text-sky-400" />
        <KpiCard label="Budget (+1mo)" value={pred.budgetForecast ? `₹${Number(pred.budgetForecast).toLocaleString('en-IN')}` : '—'} link={links.charts || '/intelligence?tab=predictions&sub=charts'} accent="text-emerald-400" />
        <KpiCard label="Completion (+1mo)" value={`${pred.completionForecast}%`} link={links.predictions || '/intelligence?tab=predictions'} accent="text-amber-400" />
      </div>
      {pred.topProjectForecasts.length > 0 && (
        <div className="mt-3 space-y-2">
          {pred.topProjectForecasts.map((p) => (
            <Link key={p.projectId} to={p.link} className="command-card flex items-center justify-between px-4 py-3 hover:border-violet-500/30">
              <span className="truncate text-sm font-medium text-white">{p.name}</span>
              <span className="ml-3 shrink-0 font-mono text-sm text-violet-400">{p.currentProgress}% → {p.forecastProgress}%</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function RisksSection({ risks: r }: { risks: NonNullable<MissionControlOverview['risks']> }) {
  const links = r.links;
  return (
    <section>
      <SectionHeader title="Risk Dashboard" subtitle="Operational risk scores — deterministic, continuously updated" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Overall Risk" value={r.overallScore} link={links.risks || '/intelligence?tab=risks'} accent={r.overallScore > 60 ? 'text-red-400' : 'text-emerald-400'} />
        <KpiCard label="Critical" value={r.critical} link={links.risks || '/intelligence?tab=risks'} accent={r.critical > 0 ? 'text-red-400' : undefined} />
        <KpiCard label="High" value={r.high} link={links.risks || '/intelligence?tab=risks'} accent={r.high > 0 ? 'text-orange-400' : undefined} />
        <KpiCard label="Project Score" value={r.entityScores.project} link={links.domains || '/intelligence?tab=risks&sub=domains'} accent="text-amber-400" />
        <KpiCard label="Heat Map" value="Open" link={links.heatmap || '/intelligence?tab=risks&sub=heatmap'} accent="text-violet-400" />
      </div>
      {r.topRisks.length > 0 && (
        <div className="mt-3 space-y-2">
          {r.topRisks.slice(0, 3).map((risk) => (
            <Link key={risk.id} to={risk.link} className="command-card flex items-center justify-between px-4 py-3 hover:border-red-500/30">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{risk.title}</p>
                <p className="truncate text-xs text-slate-500">{risk.description}</p>
              </div>
              <span className="ml-3 shrink-0 font-mono text-sm text-red-400">{risk.score}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function ExecutiveBriefSection({ executiveBrief: eb }: { executiveBrief: NonNullable<MissionControlOverview['executiveBrief']> }) {
  const links = eb.links;
  return (
    <section>
      <SectionHeader title="Executive Brief" subtitle="Auto-generated briefing — templates + live data, no AI" />
      <div className="command-card mb-3 p-4">
        <p className="text-sm text-slate-300">{eb.summary}</p>
        <p className="mt-2 text-xs text-slate-500">Operational health: <span className="font-mono text-emerald-400">{eb.operationalHealth.score}/100 ({eb.operationalHealth.label})</span></p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <KpiCard label="Health" value={`${eb.operationalHealth.score}`} link={links.briefs || '/intelligence?tab=briefs'} accent="text-emerald-400" />
        <KpiCard label="Top Risks" value={eb.topRisks.length} link={links.briefs || '/intelligence?tab=risks'} accent="text-red-400" />
        <KpiCard label="Recommendations" value={eb.topRecommendations.length} link="/intelligence?tab=recommendations" accent="text-violet-400" />
        <KpiCard label="Full Brief" value="Open" link={links.insights || '/insights?tab=brief'} accent="text-sky-400" />
      </div>
      {eb.topRisks.length > 0 && (
        <div className="mt-3 space-y-2">
          {eb.topRisks.slice(0, 2).map((r, i) => (
            <Link key={i} to={r.link} className="command-card flex items-center justify-between px-4 py-3 hover:border-sky-500/30">
              <span className="truncate text-sm text-white">{r.title}</span>
              <span className="ml-3 shrink-0 font-mono text-sm text-red-400">{r.score}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function ConnectorHealthSection({ connectorHealth: ch }: { connectorHealth: NonNullable<MissionControlOverview['connectorHealth']> }) {
  const links = ch.links;
  return (
    <section>
      <SectionHeader title="Connector Health" subtitle="External integration status — install · configure · monitor" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Installed" value={ch.installed} link={links.installed || '/integrations?tab=connectors&sub=installed'} accent="text-teal-400" />
        <KpiCard label="Connected" value={ch.connected} link={links.connectors || '/integrations'} accent="text-emerald-400" />
        <KpiCard label="Errors" value={ch.errors} link={links.connectors || '/integrations'} accent={ch.errors > 0 ? 'text-red-400' : undefined} />
        <KpiCard label="Success %" value={`${ch.successPercent}%`} link={links.logs || '/integrations?tab=connectors&sub=logs'} accent="text-sky-400" />
        <KpiCard label="Avg Response" value={`${ch.avgResponseTimeMs}ms`} link={links.connectors || '/integrations'} />
      </div>
      {ch.unhealthyConnectors.length > 0 && (
        <div className="mt-3 space-y-2">
          {ch.unhealthyConnectors.slice(0, 3).map((c) => (
            <Link key={c.id} to={c.link || '/integrations'} className="command-card flex items-center justify-between px-4 py-3 hover:border-red-500/30">
              <span className="truncate text-sm text-white">{c.name}</span>
              <span className="ml-3 shrink-0 text-xs uppercase text-red-400">{c.status}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function ApiHealthSection({ apiHealth: ah }: { apiHealth: NonNullable<MissionControlOverview['apiHealth']> }) {
  const links = ah.links;
  return (
    <section>
      <SectionHeader title="API Health" subtitle="REST gateway · event bus · retries · rate limits" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Active Routes" value={ah.activeRoutes} link={links.gateway || '/integrations?tab=gateway'} accent="text-teal-400" />
        <KpiCard label="Pending Jobs" value={ah.pendingJobs} link={links.retries || '/integrations?tab=gateway&sub=retries'} accent="text-amber-400" />
        <KpiCard label="Failed" value={ah.failedRequests} link={links.failed || '/integrations?tab=gateway&sub=failed'} accent={ah.failedRequests > 0 ? 'text-red-400' : undefined} />
        <KpiCard label="Events (24h)" value={ah.eventsLast24h} link={links.events || '/integrations?tab=events'} accent="text-sky-400" />
        <KpiCard label="Gateway %" value={`${ah.gatewaySuccessRate}%`} link={links.gateway || '/integrations?tab=gateway'} accent="text-emerald-400" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <KpiCard label="Total Events" value={ah.eventsTotal} link={links.events || '/integrations?tab=events'} />
        <KpiCard label="API Keys" value={ah.apiKeys} link="/integrations?tab=gateway&sub=keys" />
        <KpiCard label="Rate Limit/min" value={ah.globalRateLimit} link={links.gateway || '/integrations?tab=gateway'} />
      </div>
    </section>
  );
}

export function ErpSyncSection({ erpSync: es }: { erpSync: NonNullable<MissionControlOverview['erpSync']> }) {
  const links = es.links;
  return (
    <section>
      <SectionHeader title="ERP Sync" subtitle="Tally · SAP · Oracle · Dynamics — field mapping · jobs · history" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="ERP Connectors" value={es.erpConnectors} link={links.connectors || '/integrations?tab=erp&sub=connectors'} accent="text-teal-400" />
        <KpiCard label="Active Jobs" value={es.activeJobs} link={links.jobs || '/integrations?tab=erp&sub=jobs'} accent="text-sky-400" />
        <KpiCard label="Open Errors" value={es.openErrors} link={links.errors || '/integrations?tab=erp&sub=errors'} accent={es.openErrors > 0 ? 'text-red-400' : undefined} />
        <KpiCard label="Runs (24h)" value={es.runsLast24h} link={links.history || '/integrations?tab=erp&sub=history'} accent="text-violet-400" />
        <KpiCard label="Success %" value={`${es.successRate}%`} link={links.erp || '/integrations?tab=erp'} accent="text-emerald-400" />
      </div>
      {es.recentIssues.length > 0 && (
        <div className="mt-3 space-y-2">
          {es.recentIssues.slice(0, 3).map((r) => (
            <Link key={r.id} to={r.link || '/integrations?tab=erp&sub=history'} className="command-card flex items-center justify-between px-4 py-3 hover:border-red-500/30">
              <span className="truncate text-sm text-white">{r.connectorName}</span>
              <span className="ml-3 shrink-0 text-xs text-red-400">{r.recordsFailed} failed</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function DeviceHealthSection({ deviceHealth: dh }: { deviceHealth: NonNullable<MissionControlOverview['deviceHealth']> }) {
  const links = dh.links;
  return (
    <section>
      <SectionHeader title="Device Health" subtitle="GPS · RFID · biometric · fuel · IoT · OEM telemetry" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Field Connectors" value={dh.fieldConnectors} link={links.field || '/integrations?tab=field'} accent="text-teal-400" />
        <KpiCard label="Devices" value={dh.devices} link={links.devices || '/integrations?tab=field&sub=devices'} accent="text-sky-400" />
        <KpiCard label="Online" value={dh.devicesOnline} link={links.health || '/integrations?tab=field&sub=health'} accent="text-emerald-400" />
        <KpiCard label="Offline" value={dh.devicesOffline} link={links.health || '/integrations?tab=field&sub=health'} accent={dh.devicesOffline > 0 ? 'text-amber-400' : undefined} />
        <KpiCard label="Telemetry (24h)" value={dh.telemetryLast24h} link={links.telemetry || '/integrations?tab=field&sub=telemetry'} accent="text-violet-400" />
      </div>
      {dh.unhealthyDevices.length > 0 && (
        <div className="mt-3 space-y-2">
          {dh.unhealthyDevices.slice(0, 3).map((d) => (
            <Link key={d.id} to={links.health || '/integrations?tab=field&sub=health'} className="command-card flex items-center justify-between px-4 py-3 hover:border-amber-500/30">
              <span className="truncate text-sm text-white">{d.name}</span>
              <span className="ml-3 shrink-0 text-xs uppercase text-amber-400">{d.health}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function CommunicationSection({ communication: cm }: { communication: NonNullable<MissionControlOverview['communication']> }) {
  const links = cm.links;
  return (
    <section>
      <SectionHeader title="Communication" subtitle="Email · SMS · WhatsApp · Teams · Slack — templates · queue · campaigns" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Connectors" value={cm.commConnectors} link={links.comm || '/integrations?tab=comm'} accent="text-teal-400" />
        <KpiCard label="Queue" value={cm.queuePending} link={links.queue || '/integrations?tab=comm&sub=queue'} accent="text-amber-400" />
        <KpiCard label="Delivered (24h)" value={cm.deliveredLast24h} link={links.comm || '/integrations?tab=comm'} accent="text-emerald-400" />
        <KpiCard label="Failed" value={cm.failed} link={links.queue || '/integrations?tab=comm&sub=queue'} accent={cm.failed > 0 ? 'text-red-400' : undefined} />
        <KpiCard label="Success %" value={`${cm.successRate}%`} link={links.comm || '/integrations?tab=comm'} accent="text-sky-400" />
      </div>
      {cm.recentFailed.length > 0 && (
        <div className="mt-3 space-y-2">
          {cm.recentFailed.slice(0, 3).map((f) => (
            <Link key={f.id} to={f.link} className="command-card flex items-center justify-between px-4 py-3 hover:border-red-500/30">
              <span className="truncate text-sm text-white">{f.channel} → {f.recipient}</span>
              <span className="ml-3 shrink-0 text-xs text-red-400">failed</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function RegionDashboardSection({ regionDashboard: rd }: { regionDashboard: NonNullable<MissionControlOverview['regionDashboard']> }) {
  const links = rd.links;
  return (
    <section>
      <SectionHeader title="Region Dashboard" subtitle="Multi-country · currency · timezone · regional compliance" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Countries" value={rd.countriesActive} link={links.enterprise || '/enterprise?tab=regional'} accent="text-violet-400" />
        <KpiCard label="Regions" value={rd.regionsConfigured} link={links.enterprise || '/enterprise?tab=regional'} accent="text-sky-400" />
        <KpiCard label="Currencies" value={rd.currenciesInUse} link={links.enterprise || '/enterprise?tab=regional'} accent="text-emerald-400" />
        <KpiCard label="Timezones" value={rd.timezonesActive} link={links.localization || '/enterprise?tab=localization'} accent="text-amber-400" />
        <KpiCard label="Locales" value={rd.localesActive} link={links.localization || '/enterprise?tab=localization'} accent="text-teal-400" />
      </div>
      {rd.byCountry.length > 0 && (
        <div className="mt-3 space-y-2">
          {rd.byCountry.slice(0, 4).map((c) => (
            <Link key={c.countryCode} to={c.link} className="command-card flex items-center justify-between px-4 py-3 hover:border-violet-500/30">
              <span className="truncate text-sm text-white">{c.countryName} · {c.regions} region{c.regions !== 1 ? 's' : ''}</span>
              <span className="ml-3 shrink-0 text-xs text-violet-400">{c.currency} · {c.compliancePack || c.countryCode}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function BrandPreviewSection({ brandPreview: bp }: { brandPreview: NonNullable<MissionControlOverview['brandPreview']> }) {
  const links = bp.links;
  return (
    <section>
      <SectionHeader title="Brand Preview" subtitle="Tenant white-label · theme · domain · email/PDF identity" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        <KpiCard label="Theme" value={bp.themeName || bp.themeId || '—'} link={links.whiteLabel || '/enterprise?tab=white-label'} accent="text-violet-400" />
        <KpiCard label="Domain" value={bp.domainStatus === 'active' ? 'Active' : 'Pending'} link={links.domain || '/enterprise?tab=white-label&sub=domain'} accent={bp.domainStatus === 'active' ? 'text-emerald-400' : 'text-amber-400'} />
        <KpiCard label="Themed Orgs" value={bp.themedOrganizations} link={links.whiteLabel || '/enterprise?tab=white-label'} accent="text-sky-400" />
      </div>
      <Link to={links.whiteLabel || '/enterprise?tab=white-label'} className="command-card mt-3 flex items-center gap-4 px-4 py-4 hover:border-violet-500/30">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ backgroundColor: bp.primaryColor }}>
          {(bp.displayName || 'AF')[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">{bp.displayName || 'Organization'}</p>
          <p className="truncate text-xs text-slate-500">{bp.customDomain || 'No custom domain'} · {bp.themeName}</p>
        </div>
        <span className="shrink-0 text-xs text-violet-400">Preview →</span>
      </Link>
    </section>
  );
}

export function MarketplaceSection({ marketplace: mk }: { marketplace: NonNullable<MissionControlOverview['marketplace']> }) {
  const links = mk.links;
  return (
    <section>
      <SectionHeader title="Marketplace" subtitle="Extensions · connectors · dashboards · workflow & report templates" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Installed" value={mk.installedCount} link={links.installed || '/marketplace?tab=installed'} accent="text-emerald-400" />
        <KpiCard label="Catalog" value={mk.catalogCount} link={links.marketplace || '/marketplace'} accent="text-sky-400" />
        <KpiCard label="Updates" value={mk.pendingUpdates} link={links.installed || '/marketplace?tab=installed'} accent={mk.pendingUpdates > 0 ? 'text-amber-400' : undefined} />
        <KpiCard label="Connectors" value={mk.connectorStore} link="/marketplace?tab=connectors" accent="text-violet-400" />
        <KpiCard label="Dashboards" value={mk.dashboardStore} link="/marketplace?tab=dashboards" />
        <KpiCard label="Templates" value={mk.workflowTemplates + mk.reportTemplates} link="/marketplace?tab=workflows" accent="text-teal-400" />
      </div>
      {mk.topRated.length > 0 && (
        <div className="mt-3 space-y-2">
          {mk.topRated.map((p) => (
            <Link key={p.id} to={p.link || links.marketplace || '/marketplace'} className="command-card flex items-center justify-between px-4 py-3 hover:border-emerald-500/30">
              <span className="truncate text-sm text-white">{p.name}</span>
              <span className="ml-3 shrink-0 text-xs text-amber-400">★ {p.ratingAvg} ({p.ratingCount})</span>
            </Link>
          ))}
        </div>
      )}
      {mk.recentInstalls.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {mk.recentInstalls.slice(0, 3).map((i) => (
            <Link key={i.pluginId} to={i.link} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-1.5 text-xs text-slate-400 hover:border-emerald-500/30 hover:text-white">
              {i.name} v{i.version}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function DeveloperSection({ developer: dev }: { developer: NonNullable<MissionControlOverview['developer']> }) {
  const links = dev.links;
  const usagePct = dev.requestsLimit ? Math.round((dev.requestsToday / dev.requestsLimit) * 100) : 0;
  return (
    <section>
      <SectionHeader title="Developer Platform" subtitle={`${dev.tier} license · OAuth apps · API keys · sandbox`} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Applications" value={dev.applications} link={links.applications || '/developer?tab=applications'} accent="text-violet-400" />
        <KpiCard label="API Keys" value={dev.apiKeys} link={links.apiKeys || '/developer?tab=api-keys'} accent="text-sky-400" />
        <KpiCard label="Sandbox Apps" value={dev.sandboxApps} link={links.developer || '/developer?tab=sandbox'} accent="text-teal-400" />
        <KpiCard label="Requests Today" value={dev.requestsToday} link={links.insights || '/insights?tab=api-analytics'} />
        <KpiCard label="Quota %" value={`${usagePct}%`} link={links.developer || '/developer?tab=usage'} accent={usagePct > 80 ? 'text-amber-400' : undefined} />
        <KpiCard label="Avg Latency" value={`${dev.avgLatencyMs}ms`} link={links.insights || '/insights?tab=api-analytics'} accent={dev.errorsToday > 0 ? 'text-red-400' : 'text-emerald-400'} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link to={links.docs || '/developer?tab=docs'} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-1.5 text-xs text-slate-400 hover:border-violet-500/30 hover:text-white">SDK & Swagger →</Link>
        <Link to="/marketplace?tab=developer" className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-1.5 text-xs text-slate-400 hover:border-violet-500/30 hover:text-white">Publish Plugin →</Link>
      </div>
    </section>
  );
}

export function PlatformAdminSection({ platformAdmin }: { platformAdmin: NonNullable<MissionControlOverview['platformAdmin']> }) {
  const links = platformAdmin.links;
  return (
    <section>
      <SectionHeader title="Platform Administration" subtitle="Organizations · users · invitations · security" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        <KpiCard label="Organizations" value={platformAdmin.organizations} link={links.organizations} accent="text-sky-400" />
        <KpiCard label="Users Online" value={platformAdmin.usersOnline} link={links.users} accent="text-emerald-400" />
        <KpiCard label="Pending Invites" value={platformAdmin.pendingInvitations} link={links.invitations} accent="text-amber-400" />
        <KpiCard label="Locked Users" value={platformAdmin.lockedUsers} link={links.users} accent={platformAdmin.lockedUsers > 0 ? 'text-red-400' : undefined} />
        <KpiCard label="Total Users" value={platformAdmin.totalUsers} link={links.admin} />
      </div>
    </section>
  );
}

export function NotificationsSection({
  items,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onRefresh,
}: {
  items: MissionControlOverview['notifications']['items'];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onRefresh: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'approval' | 'compliance' | 'maintenance'>('all');

  const filtered = items.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'approval') return n.type.includes('pr') || n.type.includes('approval');
    if (filter === 'compliance') return n.type.includes('compliance');
    if (filter === 'maintenance') return n.type.includes('maintenance') || n.type.includes('breakdown');
    return true;
  });

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <SectionHeader title="Notifications" subtitle={`${unreadCount} unread`} />
        <div className="flex flex-wrap gap-1">
          {(['all', 'unread', 'approval', 'compliance', 'maintenance'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-lg px-2 py-1 text-[10px] font-medium capitalize',
                filter === f ? 'bg-accent/20 text-accent' : 'text-slate-500 hover:bg-white/5',
              )}
            >
              {f}
            </button>
          ))}
          {unreadCount > 0 && (
            <button onClick={onMarkAllRead} className="rounded-lg bg-white/5 px-2 py-1 text-[10px] text-slate-400 hover:text-white">
              Mark all read
            </button>
          )}
        </div>
      </div>
      <div className="command-card divide-y divide-white/5">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">No notifications</p>
        ) : (
          filtered.map((n) => (
            <div key={n._id} className={cn('flex items-start gap-3 px-4 py-3', !n.read && 'bg-accent/5')}>
              <Bell size={16} className={cn('mt-0.5 shrink-0', n.read ? 'text-slate-600' : 'text-accent')} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-200">{n.title}</p>
                <p className="text-xs text-slate-500">{n.message}</p>
                {n.createdAt && <p className="mt-1 text-[10px] text-slate-600">{formatDate(n.createdAt)}</p>}
              </div>
              {!n.read && (
                <button
                  onClick={() => { onMarkRead(n._id); onRefresh(); }}
                  className="shrink-0 rounded-lg bg-white/5 px-2 py-1 text-[10px] text-slate-400 hover:text-white"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function MissionControlSearchSection() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      missionControlApi.search(query).then((res) => setResults(res.data)).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <section>
      <SectionHeader title="Global Search" subtitle="Search projects, equipment, POs, materials, vendors — Ctrl+K anywhere" />
      <div className="command-card p-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
          <Search size={18} className="text-accent" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, equipment, purchase orders, materials…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">⌘K</kbd>
        </div>
        {loading && <p className="mt-3 text-center text-xs text-slate-500">Searching…</p>}
        {results && <SearchResults data={results} />}
      </div>
    </section>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SearchResults({ data }: { data: any }) {
  const groups: Array<{ title: string; items: Array<{ _id?: string; id?: string; name?: string; title?: string; code?: string; poNumber?: string; path: string }> }> = [
    { title: 'Projects', items: (data.projects || []).map((p: { _id: string; name: string; code: string }) => ({ ...p, path: explorerPath('project', p._id) })) },
    { title: 'Equipment', items: (data.equipment || []).map((e: { _id: string; name: string; code: string }) => ({ ...e, path: explorerPath('equipment', e._id) })) },
    { title: 'Purchase Orders', items: (data.purchaseOrders || []).map((po: { _id: string; poNumber: string }) => ({ ...po, name: po.poNumber, path: explorerPath('purchase-order', po._id) })) },
    { title: 'Materials', items: (data.materials || []).map((m: { _id: string; name: string; code: string }) => ({ ...m, path: explorerPath('warehouse-material', m._id) })) },
    { title: 'Vendors', items: (data.vendors || []).map((v: { _id: string; name: string }) => ({ ...v, path: explorerPath('vendor', v._id) })) },
    { title: 'Issues', items: (data.issues || []).map((i: { id: string; label: string; path: string }) => ({ _id: i.id, name: i.label, path: i.path })) },
    { title: 'Daily Reports', items: (data.dailyReports || []).map((d: { id: string; label: string; path: string }) => ({ _id: d.id, name: d.label, path: d.path })) },
    { title: 'Documents', items: (data.documents || []).map((d: { id: string; label: string; path: string; category?: string }) => ({ _id: d.id, name: d.label, title: d.label, path: d.path?.startsWith('/explore') ? d.path : explorerPath('document', d.id), code: d.category })) },
    { title: 'Compliance', items: (data.compliance || []).map((c: { id: string; label: string; path: string; category?: string }) => ({ _id: c.id, name: c.label, path: c.path?.startsWith('/explore') ? c.path : explorerPath('compliance-record', c.id), code: c.category })) },
  ].filter((g) => g.items.length > 0);

  if (groups.length === 0) return <p className="mt-4 text-center text-sm text-slate-500">No results</p>;

  return (
    <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">{g.title}</p>
          {g.items.map((item) => (
            <Link
              key={item._id || item.id}
              to={item.path}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-white/5"
            >
              <span className="text-slate-200">{item.name || item.title}</span>
              {item.code && <span className="text-[10px] text-slate-500">{item.code}</span>}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
