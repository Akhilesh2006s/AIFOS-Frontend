import type { WorkspaceId } from './workspaces';
import { ROLE_DASHBOARD_META } from './roleDashboardRegistry';

/** Role → default route after login (platform knows where you belong) */
export const ROLE_LANDING: Record<string, string> = {
  executive: ROLE_DASHBOARD_META.executive.route,
  admin: ROLE_DASHBOARD_META.admin.route,
  org_admin: ROLE_DASHBOARD_META.org_admin.route,
  coo: ROLE_DASHBOARD_META.coo.route,
  project_manager: ROLE_DASHBOARD_META.project_manager.route,
  site_engineer: ROLE_DASHBOARD_META.site_engineer.route,
  procurement_manager: ROLE_DASHBOARD_META.procurement_manager.route,
  warehouse_manager: ROLE_DASHBOARD_META.warehouse_manager.route,
  store_keeper: ROLE_DASHBOARD_META.store_keeper.route,
  equipment_manager: ROLE_DASHBOARD_META.equipment_manager.route,
  fleet_manager: ROLE_DASHBOARD_META.equipment_manager.route,
  maintenance_manager: ROLE_DASHBOARD_META.maintenance_manager.route,
  compliance_manager: ROLE_DASHBOARD_META.compliance_manager.route,
  safety_officer: ROLE_DASHBOARD_META.safety_officer.route,
  quality_engineer: ROLE_DASHBOARD_META.quality_engineer.route,
  finance_manager: ROLE_DASHBOARD_META.finance_manager.route,
  hr_manager: ROLE_DASHBOARD_META.hr_manager.route,
  supervisor: ROLE_DASHBOARD_META.supervisor.route,
  contractor_supervisor: ROLE_DASHBOARD_META.contractor_supervisor.route,
};

export const ROLE_WORKSPACE: Record<string, WorkspaceId> = {
  executive: 'command',
  admin: 'admin',
  org_admin: 'admin',
  coo: 'command',
  project_manager: 'projects',
  site_engineer: 'projects',
  procurement_manager: 'supply_chain',
  warehouse_manager: 'supply_chain',
  store_keeper: 'supply_chain',
  equipment_manager: 'assets',
  fleet_manager: 'assets',
  maintenance_manager: 'assets',
  compliance_manager: 'business',
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
  { label: 'Store Keeper — Lakshmi Devi', email: 'store@bekem.com', role: 'store_keeper' },
  { label: 'Site Engineer — Venkat Rao', email: 'site@bekem.com', role: 'site_engineer' },
  { label: 'Equipment — Karthik Singh', email: 'equipment@bekem.com', role: 'equipment_manager' },
  { label: 'Maintenance — Suresh Patel', email: 'maintenance@bekem.com', role: 'maintenance_manager' },
  { label: 'Safety — Arjun Nair', email: 'safety@bekem.com', role: 'safety_officer' },
  { label: 'Quality — Meera Iyer', email: 'quality@bekem.com', role: 'quality_engineer' },
  { label: 'Compliance — Ravi Shankar', email: 'compliance@bekem.com', role: 'compliance_manager' },
  { label: 'Finance — Deepa Menon', email: 'finance@bekem.com', role: 'finance_manager' },
  { label: 'HR — Kavitha Reddy', email: 'hr@bekem.com', role: 'hr_manager' },
  { label: 'Supervisor — Mohan Das', email: 'supervisor@bekem.com', role: 'supervisor' },
  { label: 'Contractor — Imran Khan', email: 'contractor@bekem.com', role: 'contractor_supervisor' },
  { label: 'Org Admin — Bekem Admin', email: 'admin@bekem.com', role: 'org_admin' },
] as const;

export const BEKEM_DEMO_PASSWORD = 'Bekem@Demo2026!';
