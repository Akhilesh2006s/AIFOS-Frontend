import { Navigate } from 'react-router-dom';

/** Legacy route — Compliance+ lives in Business Workspace */
export function CompliancePage() {
  return <Navigate to="/business/compliance" replace />;
}
