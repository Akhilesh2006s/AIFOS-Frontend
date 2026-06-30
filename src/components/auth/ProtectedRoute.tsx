import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

const ADMIN_PATHS = ['/admin', '/enterprise', '/developer', '/marketplace'];

const ROLE_ROUTE_ACCESS: Record<string, RegExp[]> = {
  admin: [/.*/],
  executive: [/.*/],
  coo: [/.*/],
  org_admin: [/.*/],
  finance_manager: [/^\/(business|insights|mission-control|projects|dashboard|notifications|documents|compliance)/],
  procurement_manager: [/^\/(procurement|vendors|supply-chain|inventory|consumption|integrations|insights|mission-control|business|documents|dashboard)/],
  warehouse_manager: [/^\/(inventory|supply-chain|consumption|procurement|vendors|mission-control|business|documents|dashboard)/],
  store_keeper: [/^\/(inventory|consumption|supply-chain|mission-control|dashboard)/],
  equipment_manager: [/^\/(equipment|assets|fleet|maintenance|integrations|insights|mission-control|workforce|dashboard)/],
  fleet_manager: [/^\/(fleet|equipment|assets|maintenance|mission-control|dashboard)/],
  maintenance_manager: [/^\/(maintenance|equipment|assets|fleet|mission-control|workforce|dashboard)/],
  compliance_manager: [/^\/(compliance|business|equipment|assets|insights|mission-control|documents|dashboard)/],
  hr_manager: [/^\/(workforce|insights|mission-control|projects|dashboard)/],
  project_manager: [/^\/(projects|business|workforce|insights|mission-control|documents|dashboard)/],
  project_director: [/^\/(projects|business|workforce|insights|mission-control|documents|dashboard)/],
  site_engineer: [/^\/(projects|consumption|workforce|mission-control|documents|dashboard)/],
  supervisor: [/^\/(workforce|projects|mission-control|dashboard)/],
  contractor_supervisor: [/^\/(workforce|mission-control|dashboard)/],
  safety_officer: [/^\/(workforce|projects|mission-control|dashboard|insights)/],
  quality_engineer: [/^\/(workforce|projects|mission-control|dashboard|insights)/],
  document_controller: [/^\/(business\/documents|documents|projects|insights|mission-control|dashboard)/],
  viewer: [/^\/(projects|insights|mission-control|dashboard)/],
  employee: [/^\/(projects|workforce|mission-control|dashboard)/],
  user: [/^\/(projects|mission-control|dashboard)/],
};

function canAccess(role: string, pathname: string) {
  if (['admin', 'executive', 'coo', 'org_admin'].includes(role)) return true;
  if (pathname.startsWith('/explore')) {
    const rules = ROLE_ROUTE_ACCESS[role] || ROLE_ROUTE_ACCESS.user;
    return rules.some((re) => re.test('/mission-control'));
  }
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) return false;
  const rules = ROLE_ROUTE_ACCESS[role] || ROLE_ROUTE_ACCESS.user;
  return rules.some((re) => re.test(pathname));
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user && !canAccess(user.role, location.pathname)) {
    return <Navigate to="/mission-control" replace />;
  }

  return <>{children}</>;
}
