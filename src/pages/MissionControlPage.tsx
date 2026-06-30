import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useMissionControl } from '@/hooks/useMissionControl';
import { moduleApi } from '@/api/client';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { OrganizationSelector } from '@/components/mission-control/OrganizationSelector';
import { PERSONA_LABELS, type MissionControlOverview, type MissionControlSection } from '@/components/mission-control/types';
import { useOrgStore } from '@/store/org';
import {
  ActivityFeedSection,
  AlertsSection,
  AssetHealthSection,
  FinancialHealthSection,
  CompliancePlusSection,
  DocumentCenterSection,
  PlatformAdminSection,
  PtwSection,
  QualitySection,
  SafetySection,
  WorkforceIntelligenceSection,
  OperationalIntelligenceSection,
  RecommendationsSection,
  PredictionsSection,
  RisksSection,
  ExecutiveBriefSection,
  ConnectorHealthSection,
  ApiHealthSection,
  ErpSyncSection,
  DeviceHealthSection,
  CommunicationSection,
  RegionDashboardSection,
  BrandPreviewSection,
  MarketplaceSection,
  DeveloperSection,
  WorkforceSection,
  ExecutiveSummarySection,
  ExecutiveDecisionsSection,
  MissionControlSearchSection,
  NotificationsSection,
  PipelineSection,
  ProjectHealthSection,
  SupplyChainHealthSection,
  TodaysWorkSection,
} from '@/components/mission-control/sections';

function hasFinancialHealth(health?: MissionControlOverview['financialHealth']): health is NonNullable<MissionControlOverview['financialHealth']> {
  if (!health) return false;
  return health.totalBudget != null || health.actualSpend != null || (health.utilizationPercent ?? 0) > 0;
}

export function MissionControlPage() {
  const { user } = useAuthStore();
  const { hydrate: hydrateOrg } = useOrgStore();
  const { data, loading, error, refresh, degraded } = useMissionControl();

  useEffect(() => { hydrateOrg(); }, [hydrateOrg]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleMarkRead = async (id: string) => {
    await moduleApi.notifications.markRead(id);
    refresh();
  };

  const handleMarkAllRead = async () => {
    await moduleApi.notifications.markAllRead();
    refresh();
  };

  const visible = new Set(data?.visibleSections ?? []);

  const renderSection = (key: MissionControlSection) => {
    if (!data || !visible.has(key)) return null;
    switch (key) {
      case 'executiveDecisions':
        return data.executiveDecisions
          ? <ExecutiveDecisionsSection key={key} decisions={data.executiveDecisions} />
          : null;
      case 'executiveSummary':
        return <ExecutiveSummarySection key={key} summary={data.executiveSummary} platform={data.platform} />;
      case 'financialHealth':
        return hasFinancialHealth(data.financialHealth) ? <FinancialHealthSection key={key} health={data.financialHealth} /> : null;
      case 'pipeline':
        return <PipelineSection key={key} stages={data.pipeline} />;
      case 'todaysWork':
        return <TodaysWorkSection key={key} items={data.todaysWork} />;
      case 'activity':
        return <ActivityFeedSection key={key} items={data.activity} />;
      case 'alerts':
        return <AlertsSection key={key} alerts={data.alerts} />;
      case 'projectHealth':
        return <ProjectHealthSection key={key} rows={data.projectHealth} />;
      case 'assetHealth':
        return <AssetHealthSection key={key} health={data.assetHealth} />;
      case 'supplyChainHealth':
        return <SupplyChainHealthSection key={key} health={data.supplyChainHealth} />;
      case 'documentCenter':
        return data.documentCenter ? <DocumentCenterSection key={key} center={data.documentCenter} /> : null;
      case 'compliancePlus':
        return data.compliancePlus ? <CompliancePlusSection key={key} compliance={data.compliancePlus} /> : null;
      case 'workforce':
        return data.workforce ? <WorkforceSection key={key} workforce={data.workforce} /> : null;
      case 'safety':
        return data.safety ? <SafetySection key={key} safety={data.safety} /> : null;
      case 'ptw':
        return data.ptw ? <PtwSection key={key} ptw={data.ptw} /> : null;
      case 'quality':
        return data.quality ? <QualitySection key={key} quality={data.quality} /> : null;
      case 'workforceIntelligence':
        return data.workforceIntelligence ? <WorkforceIntelligenceSection key={key} workforceIntelligence={data.workforceIntelligence} /> : null;
      case 'operationalIntelligence':
        return data.operationalIntelligence ? <OperationalIntelligenceSection key={key} operationalIntelligence={data.operationalIntelligence} /> : null;
      case 'recommendations':
        return data.recommendations ? <RecommendationsSection key={key} recommendations={data.recommendations} /> : null;
      case 'predictions':
        return data.predictions ? <PredictionsSection key={key} predictions={data.predictions} /> : null;
      case 'risks':
        return data.risks ? <RisksSection key={key} risks={data.risks} /> : null;
      case 'executiveBrief':
        return data.executiveBrief ? <ExecutiveBriefSection key={key} executiveBrief={data.executiveBrief} /> : null;
      case 'connectorHealth':
        return data.connectorHealth ? <ConnectorHealthSection key={key} connectorHealth={data.connectorHealth} /> : null;
      case 'apiHealth':
        return data.apiHealth ? <ApiHealthSection key={key} apiHealth={data.apiHealth} /> : null;
      case 'erpSync':
        return data.erpSync ? <ErpSyncSection key={key} erpSync={data.erpSync} /> : null;
      case 'deviceHealth':
        return data.deviceHealth ? <DeviceHealthSection key={key} deviceHealth={data.deviceHealth} /> : null;
      case 'communication':
        return data.communication ? <CommunicationSection key={key} communication={data.communication} /> : null;
      case 'regionDashboard':
        return data.regionDashboard ? <RegionDashboardSection key={key} regionDashboard={data.regionDashboard} /> : null;
      case 'brandPreview':
        return data.brandPreview ? <BrandPreviewSection key={key} brandPreview={data.brandPreview} /> : null;
      case 'marketplace':
        return data.marketplace ? <MarketplaceSection key={key} marketplace={data.marketplace} /> : null;
      case 'developer':
        return data.developer ? <DeveloperSection key={key} developer={data.developer} /> : null;
      case 'platformAdmin':
        return data.platformAdmin ? <PlatformAdminSection key={key} platformAdmin={data.platformAdmin} /> : null;
      case 'notifications':
        return (
          <NotificationsSection
            key={key}
            items={(data.notifications?.items ?? []).map((n) => ({ ...n, _id: String(n._id) }))}
            unreadCount={data.notifications?.unreadCount ?? 0}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            onRefresh={refresh}
          />
        );
      case 'search':
        return <MissionControlSearchSection key={key} />;
      default:
        return null;
    }
  };

  const sectionOrder: MissionControlSection[] = [
    'executiveDecisions',
    'executiveSummary',
    'financialHealth',
    'pipeline',
    'todaysWork',
    'activity',
    'alerts',
    'projectHealth',
    'assetHealth',
    'supplyChainHealth',
    'documentCenter',
    'compliancePlus',
    'workforce',
    'safety',
    'ptw',
    'quality',
    'workforceIntelligence',
    'operationalIntelligence',
    'recommendations',
    'predictions',
    'risks',
    'executiveBrief',
    'connectorHealth',
    'apiHealth',
    'erpSync',
    'deviceHealth',
    'communication',
    'regionDashboard',
    'brandPreview',
    'marketplace',
    'developer',
    'platformAdmin',
    'notifications',
    'search',
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">Mission Control</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
            {greeting()}, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            What requires your attention today — role-prioritized operational queue
          </p>
          {data && (
            <p className="mt-1 text-[10px] text-slate-600">
              {PERSONA_LABELS[data.persona]} · Updated {new Date(data.generatedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {data?.organizationSelector && (
            <OrganizationSelector selector={data.organizationSelector} onOrgChange={refresh} />
          )}
          <button
            onClick={() => refresh()}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400 hover:text-white"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </motion.div>

      {loading && !data && <PageSkeleton />}

      {degraded && error && (
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200" role="status">
          {error}
        </p>
      )}

      {error && !data && <ErrorState message={error} onRetry={refresh} />}

      {data && (data.visibleSections?.length ? data.visibleSections : sectionOrder).map((s) => renderSection(s as MissionControlSection))}
    </div>
  );
}
