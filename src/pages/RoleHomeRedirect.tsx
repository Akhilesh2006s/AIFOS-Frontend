import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { getDefaultLandingPath } from '@/config/roleLanding';

/** `/` — role-aware entry; platform knows where you belong */
export function RoleHomeRedirect() {
  const { user } = useAuthStore();
  let role = user?.role;
  if (!role) {
    try {
      const raw = sessionStorage.getItem('afios_user') || localStorage.getItem('afios_user') || '{}';
      role = JSON.parse(raw)?.role;
    } catch {
      role = undefined;
    }
  }
  return <Navigate to={getDefaultLandingPath(role)} replace />;
}
