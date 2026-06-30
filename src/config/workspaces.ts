import {
  LayoutDashboard,
  Building2,
  Cog,
  Truck,
  Wrench,
  ShieldCheck,
  IndianRupee,
  BarChart3,
  Handshake,
  Settings,
  Plug,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  type LucideIcon,
} from 'lucide-react';

/** Six workspaces + Mission Control + Administration */
export type WorkspaceId =
  | 'command'
  | 'projects'
  | 'assets'
  | 'supply_chain'
  | 'business'
  | 'workforce'
  | 'insights'
  | 'integrations'
  | 'admin';

export interface WorkspaceDef {
  id: WorkspaceId;
  label: string;
  tagline: string;
  color: string;
  colorClass: string;
  ringClass: string;
  defaultPath: string;
  icon: LucideIcon;
}

/** Top-level workspaces shown in Mission Control */
export const WORKSPACES: WorkspaceDef[] = [
  {
    id: 'command',
    label: 'Mission Control',
    tagline: 'Infrastructure Operating System',
    color: '#F97316',
    colorClass: 'text-accent',
    ringClass: 'ring-accent/30',
    defaultPath: '/mission-control',
    icon: LayoutDashboard,
  },
  {
    id: 'projects',
    label: 'Projects',
    tagline: 'Portfolio · Planning · Delivery',
    color: '#38BDF8',
    colorClass: 'text-sky-400',
    ringClass: 'ring-sky-500/30',
    defaultPath: '/projects',
    icon: Building2,
  },
  {
    id: 'assets',
    label: 'Assets',
    tagline: 'Equipment · Fleet · Maintenance',
    color: '#1F4E79',
    colorClass: 'text-steel-400',
    ringClass: 'ring-navy-light/40',
    defaultPath: '/assets',
    icon: Cog,
  },
  {
    id: 'supply_chain',
    label: 'Supply Chain',
    tagline: 'Procurement · Vendor · Inventory',
    color: '#22C55E',
    colorClass: 'text-emerald-400',
    ringClass: 'ring-emerald-500/30',
    defaultPath: '/supply-chain',
    icon: Package,
  },
  {
    id: 'business',
    label: 'Business',
    tagline: 'Finance Lite · Compliance · Documents',
    color: '#10B981',
    colorClass: 'text-emerald-300',
    ringClass: 'ring-emerald-400/30',
    defaultPath: '/business',
    icon: IndianRupee,
  },
  {
    id: 'workforce',
    label: 'Workforce',
    tagline: 'People · Attendance · Allocations',
    color: '#F59E0B',
    colorClass: 'text-amber-400',
    ringClass: 'ring-amber-500/30',
    defaultPath: '/workforce',
    icon: Users,
  },
  {
    id: 'insights',
    label: 'Insights',
    tagline: 'Analytics · Reports · Executive',
    color: '#A78BFA',
    colorClass: 'text-violet-400',
    ringClass: 'ring-violet-500/30',
    defaultPath: '/insights',
    icon: BarChart3,
  },
  {
    id: 'integrations',
    label: 'Integrations',
    tagline: 'Connectors · External Systems',
    color: '#14B8A6',
    colorClass: 'text-teal-400',
    ringClass: 'ring-teal-500/30',
    defaultPath: '/integrations',
    icon: Plug,
  },
  {
    id: 'admin',
    label: 'Administration',
    tagline: 'Platform · Users · Settings',
    color: '#64748B',
    colorClass: 'text-slate-400',
    ringClass: 'ring-slate-500/30',
    defaultPath: '/admin',
    icon: Settings,
  },
];

export const LAUNCHER_WORKSPACES = WORKSPACES.filter((w) => w.id !== 'command' && w.id !== 'admin');

export interface WorkspaceNavItem {
  label: string;
  path: string;
  icon?: LucideIcon;
}

export const WORKSPACE_NAV: Record<WorkspaceId, WorkspaceNavItem[]> = {
  command: [
    { label: 'Home', path: '/mission-control', icon: LayoutDashboard },
    { label: 'Executive Brief', path: '/command/executive', icon: BarChart3 },
  ],
  projects: [
    { label: 'Portfolio', path: '/projects' },
  ],
  assets: [
    { label: 'Overview', path: '/assets' },
    { label: 'Equipment', path: '/equipment', icon: Cog },
    { label: 'Fleet', path: '/fleet', icon: Truck },
    { label: 'Maintenance', path: '/maintenance', icon: Wrench },
    { label: 'Fuel', path: '/fleet?tab=fuel' },
    { label: 'Compliance', path: '/compliance', icon: ShieldCheck },
    { label: 'Utilization', path: '/equipment?tab=utilization' },
    { label: 'GPS', path: '/fleet?tab=gps' },
    { label: 'Reports', path: '/assets?tab=reports' },
  ],
  supply_chain: [
    { label: 'Overview', path: '/supply-chain' },
    { label: 'Procurement', path: '/procurement', icon: ShoppingCart },
    { label: 'Vendors', path: '/vendors', icon: Handshake },
    { label: 'Warehouse', path: '/inventory?tab=warehouses', icon: Warehouse },
    { label: 'Inventory', path: '/inventory', icon: Package },
    { label: 'Consumption', path: '/consumption' },
    { label: 'Reports', path: '/supply-chain?tab=reports' },
  ],
  business: [
    { label: 'Overview', path: '/business' },
    { label: 'Finance Lite', path: '/business', icon: IndianRupee },
    { label: 'Vendor Bills', path: '/business/vendor-bills' },
    { label: 'Payments', path: '/business/payments' },
    { label: 'Compliance+', path: '/business/compliance', icon: ShieldCheck },
    { label: 'Documents', path: '/business/documents' },
  ],
  workforce: [
    { label: 'Dashboard', path: '/workforce' },
    { label: 'Employees', path: '/workforce?tab=employees' },
    { label: 'Contractors', path: '/workforce?tab=contractors' },
    { label: 'Teams', path: '/workforce?tab=teams' },
    { label: 'Allocations', path: '/workforce?tab=allocations' },
    { label: 'Attendance', path: '/workforce?tab=attendance' },
    { label: 'Safety', path: '/workforce?tab=safety' },
    { label: 'Permits', path: '/workforce?tab=permits' },
  ],
  insights: [
    { label: 'Overview', path: '/insights' },
    { label: 'Project Analytics', path: '/insights?tab=projects' },
    { label: 'Supply Chain', path: '/insights?tab=supply-chain' },
    { label: 'Asset Analytics', path: '/insights?tab=assets' },
    { label: 'Finance', path: '/insights?tab=finance' },
    { label: 'Compliance', path: '/insights?tab=compliance' },
    { label: 'Workforce', path: '/insights?tab=workforce' },
    { label: 'Safety', path: '/insights?tab=safety' },
    { label: 'Permits', path: '/insights?tab=permits' },
    { label: 'Platform', path: '/insights?tab=platform' },
    { label: 'Forecasts', path: '/insights?tab=forecasts' },
    { label: 'Custom Reports', path: '/insights?tab=reports' },
    { label: 'Exports', path: '/insights?tab=exports' },
    { label: 'Executive Brief', path: '/insights?tab=brief' },
    { label: 'Operational Intelligence', path: '/intelligence' },
    { label: 'Recommendations', path: '/intelligence?tab=recommendations' },
    { label: 'Risks', path: '/intelligence?tab=risks' },
    { label: 'Integrations', path: '/insights?tab=integrations' },
    { label: 'API Analytics', path: '/insights?tab=api-analytics' },
    { label: 'ERP Analytics', path: '/insights?tab=erp-analytics' },
    { label: 'Device Analytics', path: '/insights?tab=device-analytics' },
    { label: 'Communication Analytics', path: '/insights?tab=communication' },
    { label: 'Organization Analytics', path: '/insights?tab=organization-analytics' },
    { label: 'Global Analytics', path: '/insights?tab=global-analytics' },
  ],
  integrations: [
    { label: 'Connector Manager', path: '/integrations?tab=connectors' },
    { label: 'Communication', path: '/integrations?tab=comm' },
    { label: 'Templates', path: '/integrations?tab=comm&sub=templates' },
    { label: 'Message Queue', path: '/integrations?tab=comm&sub=queue' },
    { label: 'Campaigns', path: '/integrations?tab=comm&sub=campaigns' },
    { label: 'Workflow Rules', path: '/integrations?tab=comm&sub=rules' },
    { label: 'Field Integration', path: '/integrations?tab=field' },
    { label: 'Device Health', path: '/integrations?tab=field&sub=health' },
    { label: 'Telemetry', path: '/integrations?tab=field&sub=telemetry' },
    { label: 'ERP Sync', path: '/integrations?tab=erp' },
    { label: 'Field Mapping', path: '/integrations?tab=erp&sub=mappings' },
    { label: 'Sync Jobs', path: '/integrations?tab=erp&sub=jobs' },
    { label: 'Sync History', path: '/integrations?tab=erp&sub=history' },
    { label: 'REST Gateway', path: '/integrations?tab=gateway' },
    { label: 'Event Bus', path: '/integrations?tab=events' },
    { label: 'Webhooks', path: '/integrations?tab=webhooks' },
    { label: 'Retry Dashboard', path: '/integrations?tab=gateway&sub=retries' },
    { label: 'Installed', path: '/integrations?tab=connectors&sub=installed' },
    { label: 'Marketplace', path: '/integrations?tab=connectors&sub=marketplace' },
    { label: 'Logs', path: '/integrations?tab=connectors&sub=logs' },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin?tab=dashboard' },
    { label: 'Enterprise Platform', path: '/enterprise' },
    { label: 'Regional Settings', path: '/enterprise?tab=regional' },
    { label: 'Localization', path: '/enterprise?tab=localization' },
    { label: 'Org Hierarchy', path: '/enterprise?tab=hierarchy' },
    { label: 'Org Settings', path: '/enterprise?tab=settings' },
    { label: 'White Label', path: '/enterprise?tab=white-label' },
    { label: 'Themes', path: '/enterprise?tab=white-label&sub=themes' },
    { label: 'Email Branding', path: '/enterprise?tab=white-label&sub=email' },
    { label: 'PDF Branding', path: '/enterprise?tab=white-label&sub=pdf' },
    { label: 'Org Branding', path: '/enterprise?tab=white-label&sub=logos' },
    { label: 'Marketplace', path: '/marketplace' },
    { label: 'Connector Store', path: '/marketplace?tab=connectors' },
    { label: 'Dashboard Store', path: '/marketplace?tab=dashboards' },
    { label: 'Workflow Templates', path: '/marketplace?tab=workflows' },
    { label: 'Report Templates', path: '/marketplace?tab=reports' },
    { label: 'Installed Extensions', path: '/marketplace?tab=installed' },
    { label: 'Plugin SDK', path: '/marketplace?tab=developer' },
    { label: 'Developer Portal', path: '/developer' },
    { label: 'OAuth Apps', path: '/developer?tab=applications' },
    { label: 'Developer API Keys', path: '/developer?tab=api-keys' },
    { label: 'SDK & Swagger Docs', path: '/developer?tab=docs' },
    { label: 'Sandbox', path: '/developer?tab=sandbox' },
    { label: 'API Usage', path: '/developer?tab=usage' },
    { label: 'Enterprise License', path: '/developer?tab=license' },
    { label: 'Organizations', path: '/admin?tab=organizations' },
    { label: 'Users', path: '/admin?tab=users' },
    { label: 'Roles', path: '/admin?tab=roles' },
    { label: 'Permissions', path: '/admin?tab=permissions' },
    { label: 'Invitations', path: '/admin?tab=invitations' },
    { label: 'Audit', path: '/admin?tab=audit' },
    { label: 'Settings', path: '/admin?tab=settings' },
  ],
};

/** Project tabs — Phase 1 locked (see docs/PHASE1_ROADMAP.md) */
export const PROJECT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'planning', label: 'Planning' },
  { id: 'boq', label: 'BOQ' },
  { id: 'requirements', label: 'Material Req.' },
  { id: 'issues', label: 'Issues' },
  { id: 'daily-reports', label: 'Daily Reports' },
  { id: 'documents', label: 'Documents' },
  { id: 'analytics', label: 'Analytics' },
] as const;

export type ProjectTabId = (typeof PROJECT_TABS)[number]['id'];

export const COMMAND_PALETTE_ITEMS = [
  {
    group: 'Workspaces',
    items: [
      { label: 'Mission Control', path: '/mission-control', keywords: 'home os operating system mission', type: 'workspace' as const },
      { label: 'Projects Workspace', path: '/projects', keywords: 'project portfolio boq site nh44', type: 'workspace' as const },
      { label: 'Assets Workspace', path: '/assets', keywords: 'equipment fleet maintenance excavator', type: 'workspace' as const },
      { label: 'Supply Chain Workspace', path: '/supply-chain', keywords: 'procurement vendor inventory warehouse grn', type: 'workspace' as const },
      { label: 'Business Workspace', path: '/business', keywords: 'finance compliance documents', type: 'workspace' as const },
      { label: 'Workforce Workspace', path: '/workforce', keywords: 'people attendance site labour contractor', type: 'workspace' as const },
      { label: 'Insights Workspace', path: '/insights', keywords: 'analytics report executive dashboard', type: 'workspace' as const },
      { label: 'Operational Intelligence', path: '/intelligence', keywords: 'rules recommendations predictions risks brief intelligence', type: 'workspace' as const },
      { label: 'Integration Platform', path: '/integrations', keywords: 'connectors erp gps communication email sms whatsapp slack teams integration external', type: 'workspace' as const },
      { label: 'Administration', path: '/admin', keywords: 'platform users organizations roles permissions', type: 'workspace' as const },
    ],
  },
  {
    group: 'Navigate',
    items: [
      { label: 'Executive Brief', path: '/command/executive', keywords: 'executive kpi command', type: 'page' as const },
      { label: 'Procurement', path: '/procurement', keywords: 'pr po rfq purchase requisition', type: 'page' as const },
      { label: 'Vendors', path: '/vendors', keywords: 'supplier vendor gst pan', type: 'page' as const },
      { label: 'Inventory', path: '/inventory', keywords: 'stock warehouse grn material issue', type: 'page' as const },
      { label: 'Equipment', path: '/equipment', keywords: 'machine asset utilization', type: 'page' as const },
      { label: 'Fleet', path: '/fleet', keywords: 'vehicle truck trip fuel gps', type: 'page' as const },
      { label: 'Consumption', path: '/consumption', keywords: 'usage wastage site store cement', type: 'page' as const },
      { label: 'Document Center', path: '/business/documents', keywords: 'documents upload approval version archive', type: 'page' as const },
      { label: 'Compliance+', path: '/business/compliance', keywords: 'compliance renewal license statutory', type: 'page' as const },
      { label: 'Workforce', path: '/workforce', keywords: 'attendance allocation contractor team', type: 'page' as const },
    ],
  },
  {
    group: 'Create',
    items: [
      { label: 'New Project', path: '/projects', keywords: 'create project nh44 highway', type: 'action' as const },
      { label: 'New Purchase Request', path: '/procurement', keywords: 'pr requisition', type: 'action' as const },
      { label: 'New Vendor', path: '/vendors', keywords: 'register supplier', type: 'action' as const },
      { label: 'Register Equipment', path: '/equipment', keywords: 'machine asset', type: 'action' as const },
    ],
  },
];

export function workspaceFromPath(pathname: string): WorkspaceId {
  if (pathname.startsWith('/dashboard/')) {
    if (pathname.includes('warehouse') || pathname.includes('store-keeper') || pathname.includes('procurement')) {
      return 'supply_chain';
    }
    if (pathname.includes('equipment') || pathname.includes('maintenance')) return 'assets';
    if (pathname.includes('finance') || pathname.includes('compliance')) return 'business';
    if (
      pathname.includes('safety') ||
      pathname.includes('quality') ||
      pathname.includes('/hr') ||
      pathname.includes('supervisor') ||
      pathname.includes('contractor')
    ) {
      return 'workforce';
    }
    if (pathname.includes('project-manager') || pathname.includes('site-engineer')) return 'projects';
    if (pathname.includes('org-admin') || pathname.includes('platform-admin')) return 'admin';
    if (pathname.includes('executive') || pathname.includes('coo')) return 'command';
    return 'command';
  }
  if (pathname === '/mission-control' || pathname.startsWith('/command')) return 'command';
  if (pathname.startsWith('/projects')) return 'projects';
  if (pathname.startsWith('/assets') || pathname.startsWith('/equipment') || pathname.startsWith('/fleet') || pathname.startsWith('/maintenance')) return 'assets';
  if (pathname.startsWith('/supply-chain') || pathname.startsWith('/procurement') || pathname.startsWith('/vendors') || pathname.startsWith('/inventory') || pathname.startsWith('/consumption')) return 'supply_chain';
  if (pathname.startsWith('/business') || pathname.startsWith('/finance') || pathname.startsWith('/compliance')) return 'business';
  if (pathname.startsWith('/workforce')) return 'workforce';
  if (pathname.startsWith('/insights') || pathname.startsWith('/analytics') || pathname.startsWith('/intelligence')) return 'insights';
  if (pathname.startsWith('/integrations')) return 'integrations';
  if (pathname.startsWith('/enterprise') || pathname.startsWith('/admin') || pathname.startsWith('/marketplace') || pathname.startsWith('/developer')) return 'admin';
  return 'command';
}

export function getWorkspace(id: WorkspaceId) {
  return WORKSPACES.find((w) => w.id === id) ?? WORKSPACES[0];
}
