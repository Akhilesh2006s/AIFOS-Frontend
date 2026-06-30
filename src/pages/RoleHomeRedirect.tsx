import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { getDefaultLandingPath } from '@/config/roleLanding';

/** `/` — role-aware entry; platform knows where you belong */
export function RoleHomeRedirect() {
  const { user } = useAuthStore();
  const role = user?.role || JSON.parse(localStorage.getItem('afios_user') || '{}')?.role;
  return <Navigate to={getDefaultLandingPath(role)} replace />;
}
