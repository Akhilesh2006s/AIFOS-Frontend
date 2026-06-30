import type { WorkspaceId } from './workspaces';

/** Role → default route after login (platform knows where you belong) */
export const ROLE_LANDING: Record<string, string> = {
  executive: '/mission-control',
  admin: '/admin',
  org_admin: '/admin',
  coo: '/mission-control',
  project_manager: '/projects',
  site_engineer: '/dashboard/site-engineer',
  procurement_manager: '/supply-chain',
  warehouse_manager: '/dashboard/warehouse',
  store_keeper: '/dashboard/store-keeper',
  equipment_manager: '/assets',
  fleet_manager: '/assets',
  maintenance_manager: '/dashboard/maintenance',
  compliance_manager: '/dashboard/compliance',
  safety_officer: '/workforce?tab=safety',
  quality_engineer: '/workforce?tab=quality',
  finance_manager: '/business',
  hr_manager: '/workforce',
  supervisor: '/workforce',
  contractor_supervisor: '/workforce?tab=attendance',
};

export const ROLE_WORKSPACE: Record<string, WorkspaceId> = {
  executive: 'command',
  admin: 'command',
  org_admin: 'command',
  coo: 'command',
  project_manager: 'projects',
  site_engineer: 'projects',
  procurement_manager: 'supply_chain',
  warehouse_manager: 'supply_chain',
  store_keeper: 'supply_chain',
  equipment_manager: 'assets',
  fleet_manager: 'assets',
  maintenance_manager: 'assets',
  compliance_manager: 'assets',
  safety_officer: 'workforce',
  quality_engineer: 'workforce',
  finance_manager: 'business',
  hr_manager: 'workforce',
  supervisor: 'workforce',
  contractor_supervisor: 'workforce',
};

export function getDefaultLandingPath(role?: string): string {
  if (!role) return '/mission-control';
  return ROLE_LANDING[role] ?? '/mission-control';
}

export function getRoleWorkspace(role?: string): WorkspaceId {
  if (!role) return 'command';
  return ROLE_WORKSPACE[role] ?? 'command';
}

/** Bekem demo personas for login quick-select */
export const BEKEM_DEMO_ACCOUNTS = [
  { label: 'CEO — Rajesh Kumar', email: 'ceo@bekem.com', role: 'executive' },
  { label: 'COO — Vikram Desai', email: 'coo@bekem.com', role: 'coo' },
  { label: 'Project Manager — Priya Sharma', email: 'pm@bekem.com', role: 'project_manager' },
  { label: 'Procurement — Anil Reddy', email: 'procurement@bekem.com', role: 'procurement_manager' },
  { label: 'Warehouse — Ramesh Naidu', email: 'warehouse@bekem.com', role: 'warehouse_manager' },
  { label: 'Site Engineer — Venkat Rao', email: 'site@bekem.com', role: 'site_engineer' },
  { label: 'Finance — Deepa Menon', email: 'finance@bekem.com', role: 'finance_manager' },
  { label: 'Safety — Arjun Nair', email: 'safety@bekem.com', role: 'safety_officer' },
] as const;

export const BEKEM_DEMO_PASSWORD = 'Bekem@123';
