import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, getStoredToken } from '@/store/auth';
import { getDefaultLandingPath } from '@/config/roleLanding';
import { canAccessRoute } from '@/config/rbac';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const storedToken = getStoredToken();

  if (!token && !storedToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user && !canAccessRoute(user.role, location.pathname)) {
    return <Navigate to={getDefaultLandingPath(user.role)} replace />;
  }

  return <>{children}</>;
}
