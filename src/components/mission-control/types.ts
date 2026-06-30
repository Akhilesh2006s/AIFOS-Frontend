export type MissionControlSection =
  | 'executiveDecisions'
  | 'executiveSummary'
  | 'financialHealth'
  | 'pipeline'
  | 'todaysWork'
  | 'activity'
  | 'alerts'
  | 'projectHealth'
  | 'assetHealth'
  | 'supplyChainHealth'
  | 'documentCenter'
  | 'compliancePlus'
  | 'workforce'
  | 'safety'
  | 'ptw'
  | 'quality'
  | 'workforceIntelligence'
  | 'operationalIntelligence'
  | 'recommendations'
  | 'predictions'
  | 'risks'
  | 'executiveBrief'
  | 'connectorHealth'
  | 'apiHealth'
  | 'erpSync'
  | 'deviceHealth'
  | 'communication'
  | 'regionDashboard'
  | 'brandPreview'
  | 'marketplace'
  | 'developer'
  | 'platformAdmin'
  | 'notifications'
  | 'search';

export type ExecutivePersona = 'ceo' | 'coo' | 'project_director' | 'org_admin';

export interface PipelineStage {
  key: string;
  label: string;
  count: number;
  pending: number;
  completed: number;
  delayed: number;
  link: string;
}

export interface TodaysWorkItem {
  type: string;
  label: string;
  projectId?: string;
  link: string;
  priority: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  message: string;
  projectId?: string;
  user: string;
  timestamp?: string;
  link: string;
}

export interface AlertItem {
  priority: string;
  title: string;
  message: string;
  link: string;
}

export interface ProjectHealthRow {
  id: string;
  name: string;
  code: string;
  status: string;
  healthScore: number;
  healthLabel: string;
  progress: number;
  openIssues: number;
  delayedMilestones: number;
  budgetStatus: string;
  openProcurement: number;
  equipmentAssigned: number;
  link: string;
}

export interface MissionControlOverview {
  persona: ExecutivePersona;
  visibleSections: MissionControlSection[];
  organizationSelector?: {
    activeOrganizationId?: string;
    activeOrganizationName?: string;
    activeLogoUrl?: string;
    switchableOrganizations?: Array<{ id: string; name: string; code?: string }>;
    organizationCount?: number;
    links?: Record<string, string>;
  };
  executiveSummary: {
    activeProjects: number;
    delayedProjects: number;
    activeEquipment: number;
    equipmentUnderMaintenance: number;
    pendingPurchaseRequisitions: number;
    pendingRfqs: number;
    pendingPurchaseOrders: number;
    lowStockMaterials: number;
    openIssues: number;
    openBreakdowns: number;
    totalBudget: number;
    totalSpent: number;
    budgetUtilization: number;
    links: Record<string, string>;
  };
  pipeline: PipelineStage[];
  executiveDecisions?: {
    title: string;
    subtitle: string;
    items: Array<{
      id: string;
      label: string;
      detail?: string;
      priority: string;
      link: string;
      amount?: number;
      category: string;
    }>;
    estimatedMinutes: number;
  };
  todaysWork: TodaysWorkItem[];
  activity: ActivityItem[];
  alerts: AlertItem[];
  projectHealth: ProjectHealthRow[];
  assetHealth: Record<string, number>;
  supplyChainHealth: Record<string, number>;
  documentCenter?: {
    pendingDocumentApprovals: number;
    totalDocuments: number;
    recentUploads: Array<{ id: string; title: string; category: string; approvalStatus: string; link: string; uploadedAt: string; version?: number }>;
    links: { center: string; pending: string; archive: string };
  };
  compliancePlus?: {
    pendingRenewals: number;
    pendingApprovals: number;
    escalated: number;
    expiringSoon: number;
    expired: number;
    alerts: Array<{ id: string; documentType: string; alertTier: string; link: string }>;
    links: { center: string; renewals: string; approvals: string; timeline: string };
  };
  workforce?: {
    peopleOnSite: number;
    attendancePresent: number;
    openPermits: number;
    safetyAlerts: number;
    trainingExpiry: number;
    contractors: number;
    alerts: Array<Record<string, unknown>>;
    links: { workforce: string; employees: string; attendance: string; allocations: string };
  };
  safety?: {
    criticalIncidents: number;
    openNearMiss: number;
    ppeCompliance: number;
    safetyScore: number;
    toolboxTalksToday: number;
    activeIncidents: number;
    openObservations: number;
    alerts: Array<Record<string, unknown>>;
    links: { safety: string; incidents: string; nearMiss: string; toolbox: string; ppe: string };
  };
  ptw?: {
    pendingApprovals: number;
    activePermits: number;
    highRiskWork: number;
    expiredPermits: number;
    closedToday: number;
    alerts: Array<Record<string, unknown>>;
    links: { permits: string; pending: string; active: string; highRisk: string };
  };
  quality?: {
    openNcr: number;
    failedTests: number;
    pendingInspections: number;
    qualityScore: number;
    capaPending: number;
    alerts: Array<Record<string, unknown>>;
    links: { quality: string; inspections: string; tests: string; ncr: string; capa: string };
  };
  workforceIntelligence?: {
    productivity: number;
    trainingDue: number;
    skillGaps: number;
    certificationExpiry: number;
    topPerformingTeams: Array<Record<string, unknown>>;
    lowPerformingSites: Array<Record<string, unknown>>;
    alerts: Array<Record<string, unknown>>;
    links: { productivity: string; training: string; skills: string; certifications: string; performance: string; intelligence: string };
  };
  operationalIntelligence?: {
    overallRisk: number;
    recommendations: number;
    criticalRecommendations: number;
    rulesTriggered: number;
    topRecommendations: Array<Record<string, unknown>>;
    topRisks: Array<Record<string, unknown>>;
    links: Record<string, string>;
  };
  recommendations?: {
    total: number;
    critical: number;
    avgScore: number;
    topRecommendations: Array<{ id: string; title: string; message: string; severity: string; score: number; type: string; link: string }>;
    links: Record<string, string>;
  };
  predictions?: {
    overallAccuracy: number;
    projectsWithForecasts: number;
    budgetForecast: number;
    completionForecast: number;
    topProjectForecasts: Array<{ projectId: string; name: string; currentProgress: number; forecastProgress: number; link: string }>;
    links: Record<string, string>;
  };
  risks?: {
    overallScore: number;
    critical: number;
    high: number;
    entityScores: { project: number; equipment: number; vendor: number; workforce: number; organization: number };
    topRisks: Array<{ id: string; title: string; description: string; score: number; severity: string; domain: string; link: string }>;
    links: Record<string, string>;
  };
  executiveBrief?: {
    title: string;
    summary: string;
    operationalHealth: { score: number; label: string };
    topRisks: Array<{ title: string; score: number; severity: string; link: string }>;
    topRecommendations: Array<{ title: string; message: string; score: number; link: string }>;
    topOpportunities: Array<{ title: string; message: string; score: number; link: string }>;
    forecastSummary: Record<string, unknown>;
    links: Record<string, string>;
  };
  connectorHealth?: {
    installed: number;
    connected: number;
    errors: number;
    successPercent: number;
    avgResponseTimeMs: number;
    unhealthyConnectors: Array<{ id: string; name: string; status: string; link: string }>;
    links: Record<string, string>;
  };
  apiHealth?: {
    activeRoutes: number;
    pendingJobs: number;
    failedRequests: number;
    eventsTotal: number;
    eventsLast24h: number;
    gatewaySuccessRate: number;
    apiKeys: number;
    globalRateLimit: number;
    links: Record<string, string>;
  };
  erpSync?: {
    erpConnectors: number;
    activeJobs: number;
    openErrors: number;
    runsLast24h: number;
    successRate: number;
    recentIssues: Array<{ id: string; connectorName: string; status: string; recordsFailed: number; link: string }>;
    links: Record<string, string>;
  };
  deviceHealth?: {
    fieldConnectors: number;
    devices: number;
    devicesOnline: number;
    devicesOffline: number;
    telemetryLast24h: number;
    unhealthyDevices: Array<{ id: string; name: string; health: string; deviceType: string }>;
    links: Record<string, string>;
  };
  communication?: {
    commConnectors: number;
    queuePending: number;
    deliveredLast24h: number;
    failed: number;
    successRate: number;
    activeCampaigns: number;
    recentFailed: Array<{ id: string; channel: string; recipient: string; lastError?: string; link: string }>;
    links: Record<string, string>;
  };
  regionDashboard?: {
    countriesActive: number;
    regionsConfigured: number;
    currenciesInUse: number;
    timezonesActive: number;
    localesActive: number;
    byCountry: Array<{ countryCode: string; countryName: string; regions: number; currency?: string; compliancePack?: string; link: string }>;
    links: Record<string, string>;
  };
  brandPreview?: {
    displayName?: string;
    themeId?: string;
    themeName?: string;
    logoUrl?: string;
    primaryColor: string;
    customDomain?: string;
    domainStatus?: string;
    themedOrganizations: number;
    links: Record<string, string>;
  };
  marketplace?: {
    catalogCount: number;
    installedCount: number;
    pendingUpdates: number;
    connectorStore: number;
    dashboardStore: number;
    workflowTemplates: number;
    reportTemplates: number;
    topRated: Array<{ id: string; name: string; type: string; ratingAvg: number; ratingCount: number; link: string }>;
    recentInstalls: Array<{ pluginId: string; name: string; type: string; version: string; link: string }>;
    links: Record<string, string>;
  };
  developer?: {
    tier: string;
    applications: number;
    apiKeys: number;
    sandboxApps: number;
    requestsToday: number;
    requestsLimit: number;
    errorsToday: number;
    avgLatencyMs: number;
    links: Record<string, string>;
  };
  financialHealth?: {
    totalBudget: number;
    actualSpend: number;
    committedCost: number;
    remainingBudget: number;
    utilizationPercent: number;
    forecastFinalCost?: number;
    projectsOverBudget: number;
    overBudgetProjects?: Array<{ projectId: string; name: string; utilizationPercent: number; link: string }>;
    highestCostDriver?: { category: string; amount: number; link: string } | null;
    largestBudgetVariance?: { projectId: string; name: string; variance: number; link: string } | null;
    fuelCostToday?: number;
    maintenanceCostToday?: number;
    topCostCategory?: string;
    largestProjectSpend?: { projectId: string; name: string; actualCost: number; link: string } | null;
    recommendations?: Array<{ id: string; severity: string; title: string; message: string; link: string }>;
    largestCostIncrease?: Array<{ projectId: string; name: string; actualCost: number; link: string }>;
    pendingVendorBills?: number;
    pendingVendorBillsAmount?: number;
    exceptionBills?: number;
    blockedPayments?: number;
    largestInvoice?: { id: string; invoiceNumber: string; amount: number; link: string } | null;
    invoicesAwaitingApproval?: number;
    paymentsDueToday?: number;
    overduePayments?: number;
    overduePaymentAmount?: number;
    cashRequiredThisWeek?: number;
    largestOutstandingVendor?: { vendorId: string; amount: number; link: string } | null;
    recentlyPaidBills?: Array<{ id: string; paymentNumber: string; amount: number; paidDate?: string; link: string }>;
    paymentsAwaitingApproval?: number;
    links: Record<string, string>;
  };
  notifications: {
    items: Array<{
      _id: string;
      type: string;
      title: string;
      message: string;
      read: boolean;
      createdAt?: string;
      projectId?: string;
    }>;
    unreadCount: number;
  };
  platform?: { userCount: number; status: string };
  platformAdmin?: {
    organizations: number;
    usersOnline: number;
    pendingInvitations: number;
    lockedUsers: number;
    totalUsers: number;
    links: { admin: string; users: string; organizations: string; invitations: string };
  };
  generatedAt: string;
}

export const PERSONA_LABELS: Record<ExecutivePersona, string> = {
  ceo: 'CEO View',
  coo: 'COO View',
  project_director: 'Project Director View',
  org_admin: 'Organization Admin View',
};
