/**
 * Frontend RBAC — keep in sync with backend/src/common/config/role-permissions.ts
 */
import { ROLE_DASHBOARD_META } from './roleDashboardRegistry';

/** Roles with unrestricted operational access (not platform admin UI). */
export const ROLES_FULL_ACCESS = new Set(['admin', 'executive', 'coo']);

/** Platform-only frontend routes (admin role only). */
export const PLATFORM_ONLY_PREFIXES = [
  '/enterprise',
  '/developer',
  '/marketplace',
  '/dashboard/platform-admin',
];

/** API path prefixes — mirror backend ROLE_PERMISSIONS. */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  executive: ['*'],
  coo: ['*'],
  org_admin: ['/admin', '/mission-control', '/notifications', '/dashboards', '/explorer', '/audit'],
  finance_manager: ['/business', '/insights', '/mission-control', '/projects', '/notifications', '/documents', '/compliance', '/dashboards', '/explorer'],
  safety_officer: ['/workforce', '/mission-control', '/projects', '/notifications', '/dashboards', '/insights', '/explorer'],
  quality_engineer: ['/workforce', '/mission-control', '/projects', '/notifications', '/dashboards', '/insights', '/explorer'],
  hr_manager: ['/workforce', '/insights', '/mission-control', '/projects', '/notifications', '/documents', '/dashboards', '/explorer'],
  project_manager: ['/projects', '/workflow', '/documents', '/notifications', '/mission-control', '/insights', '/analytics', '/dashboards', '/business', '/workforce', '/explorer'],
  project_director: ['/projects', '/workflow', '/documents', '/notifications', '/mission-control', '/insights', '/analytics', '/business', '/workforce', '/dashboards', '/explorer'],
  site_engineer: ['/projects', '/documents', '/notifications', '/consumption', '/mission-control', '/workforce', '/dashboards', '/explorer'],
  supervisor: ['/workforce', '/projects', '/notifications', '/mission-control', '/dashboards', '/explorer'],
  contractor_supervisor: ['/workforce', '/notifications', '/mission-control', '/dashboards', '/explorer'],
  procurement_manager: ['/procurement', '/vendors', '/supply-chain', '/workflow', '/notifications', '/mission-control', '/insights', '/business', '/documents', '/integrations', '/inventory', '/dashboards', '/explorer'],
  warehouse_manager: ['/inventory', '/supply-chain', '/consumption', '/workflow', '/notifications', '/mission-control', '/business', '/documents', '/procurement', '/vendors', '/dashboards', '/explorer'],
  store_keeper: ['/inventory', '/consumption', '/workflow', '/notifications', '/mission-control', '/dashboards', '/supply-chain', '/explorer'],
  equipment_manager: ['/equipment', '/assets', '/fleet', '/maintenance', '/notifications', '/mission-control', '/insights', '/workforce', '/integrations', '/dashboards', '/explorer'],
  fleet_manager: ['/fleet', '/equipment', '/assets', '/notifications', '/integrations', '/mission-control', '/dashboards', '/explorer'],
  maintenance_manager: ['/maintenance', '/equipment', '/assets', '/notifications', '/workforce', '/mission-control', '/dashboards', '/explorer'],
  compliance_manager: ['/compliance', '/equipment', '/assets', '/notifications', '/mission-control', '/documents', '/insights', '/business', '/dashboards', '/explorer'],
  document_controller: ['/documents', '/notifications', '/mission-control', '/insights', '/projects', '/business', '/dashboards', '/explorer'],
  user: ['/projects', '/notifications', '/mission-control', '/dashboards', '/explorer'],
  employee: ['/projects', '/notifications', '/mission-control', '/workforce', '/dashboards', '/explorer'],
  viewer: ['/projects', '/insights', '/mission-control', '/notifications', '/dashboards', '/explorer'],
};

/** Maps API prefixes to frontend route prefixes. */
const API_TO_ROUTE_PREFIXES: Record<string, string[]> = {
  '/business': ['/business', '/finance'],
  '/procurement': ['/procurement'],
  '/vendors': ['/vendors'],
  '/inventory': ['/inventory'],
  '/supply-chain': ['/supply-chain'],
  '/consumption': ['/consumption'],
  '/equipment': ['/equipment', '/assets'],
  '/assets': ['/assets', '/equipment'],
  '/fleet': ['/fleet'],
  '/maintenance': ['/maintenance'],
  '/workforce': ['/workforce'],
  '/insights': ['/insights', '/intelligence', '/analytics', '/command/executive', '/ai'],
  '/analytics': ['/insights', '/analytics', '/intelligence'],
  '/integrations': ['/integrations'],
  '/projects': ['/projects'],
  '/mission-control': ['/mission-control', '/command'],
  '/documents': ['/business/documents', '/documents'],
  '/compliance': ['/business/compliance', '/compliance'],
  '/admin': ['/admin'],
  '/dashboards': ['/dashboard'],
  '/explorer': ['/explore'],
  '/audit': ['/admin'],
  '/notifications': [],
  '/workflow': ['/projects'],
};

const EXPLORER_ENTITY_API_PREFIX: Record<string, string> = {
  project: '/projects',
  site: '/projects',
  boq: '/projects',
  milestone: '/projects',
  'material-requirement': '/projects',
  'purchase-request': '/procurement',
  rfq: '/procurement',
  quotation: '/procurement',
  'purchase-order': '/procurement',
  vendor: '/vendors',
  grn: '/inventory',
  'warehouse-material': '/inventory',
  'material-issue': '/inventory',
  consumption: '/consumption',
  'vendor-bill': '/business',
  payment: '/business',
  equipment: '/equipment',
  'fleet-vehicle': '/fleet',
  maintenance: '/maintenance',
  'fuel-entry': '/fleet',
  operator: '/workforce',
  employee: '/workforce',
  team: '/workforce',
  attendance: '/workforce',
  permit: '/workforce',
  'safety-incident': '/workforce',
  inspection: '/workforce',
  ncr: '/workforce',
  capa: '/workforce',
  document: '/documents',
  'compliance-record': '/compliance',
};

function rolePerms(role: string): string[] {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.user;
}

function hasApiPrefix(role: string, prefix: string): boolean {
  const perms = rolePerms(role);
  if (perms.includes('*')) return true;
  return perms.includes(prefix);
}

function canAccessDashboard(role: string, path: string): boolean {
  if (ROLES_FULL_ACCESS.has(role)) {
    if (path.startsWith('/dashboard/platform-admin')) return role === 'admin';
    return true;
  }
  const meta = ROLE_DASHBOARD_META[role];
  if (!meta) return false;
  return path === meta.route || path.startsWith(`${meta.route}/`);
}

function canAccessExplorer(role: string, path: string): boolean {
  const perms = rolePerms(role);
  if (perms.includes('*')) return true;
  if (!perms.includes('/explorer') && !perms.some((p) => p !== '/dashboards' && p !== '/notifications' && p !== '/explorer' && p !== '/audit')) {
    return false;
  }
  if (path.includes('/by-number/')) {
    return hasApiPrefix(role, '/procurement');
  }
  const segments = path.split('/').filter(Boolean);
  const entityType = segments[1];
  if (!entityType) return hasApiPrefix(role, '/mission-control');
  if (entityType === 'purchase-request') return hasApiPrefix(role, '/procurement');
  const required = EXPLORER_ENTITY_API_PREFIX[entityType];
  if (!required) return perms.includes('/explorer');
  return hasApiPrefix(role, required);
}

/** Whether a role may navigate to a frontend route. */
export function canAccessRoute(role: string, pathname: string): boolean {
  const path = pathname.split('?')[0];

  if (path === '/' || path === '/login') return true;

  if (PLATFORM_ONLY_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return role === 'admin';
  }

  if (path.startsWith('/admin')) {
    return role === 'admin' || role === 'org_admin';
  }

  if (ROLES_FULL_ACCESS.has(role)) {
    return true;
  }

  if (role === 'org_admin') {
    if (path.startsWith('/dashboard/')) return canAccessDashboard(role, path);
    if (path.startsWith('/explore')) return true;
    if (path === '/mission-control' || path.startsWith('/command')) return true;
    return false;
  }

  if (path.startsWith('/dashboard/')) {
    return canAccessDashboard(role, path);
  }

  if (path.startsWith('/explore')) {
    return canAccessExplorer(role, path);
  }

  const perms = rolePerms(role);
  if (perms.includes('*')) return true;

  for (const [apiPrefix, routes] of Object.entries(API_TO_ROUTE_PREFIXES)) {
    if (!routes.some((r) => path === r || path.startsWith(`${r}/`))) continue;
    if (perms.includes(apiPrefix) || (apiPrefix === '/dashboards' && path.startsWith('/dashboard'))) {
      return true;
    }
    if (apiPrefix === '/workflow' && perms.includes('/projects') && path.startsWith('/projects')) {
      return true;
    }
  }

  return false;
}

/** Filter workspace sidebar / palette items by role. */
export function filterPathsByRole<T extends { path: string }>(role: string | undefined, items: T[]): T[] {
  if (!role) return items;
  return items.filter((item) => canAccessRoute(role, item.path.split('?')[0]));
}
