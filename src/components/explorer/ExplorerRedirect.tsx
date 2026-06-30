import { Navigate, useParams } from 'react-router-dom';
import { explorerPath, explorerPrByNumber } from '@/lib/explorerLinks';

type RedirectMap = {
  entityType: Parameters<typeof explorerPath>[0];
  paramName: string;
  byNumber?: boolean;
};

const REDIRECTS: Record<string, RedirectMap> = {
  equipment: { entityType: 'equipment', paramName: 'id' },
  'vendor-bill': { entityType: 'vendor-bill', paramName: 'billId' },
  payment: { entityType: 'payment', paramName: 'paymentId' },
  document: { entityType: 'document', paramName: 'docId' },
  'compliance-record': { entityType: 'compliance-record', paramName: 'recordId' },
};

export function ExplorerRedirect({ kind }: { kind: keyof typeof REDIRECTS }) {
  const params = useParams();
  const config = REDIRECTS[kind];
  const id = params[config.paramName];
  if (!id) return <Navigate to="/mission-control" replace />;
  if (config.byNumber) return <Navigate to={explorerPrByNumber(id)} replace />;
  return <Navigate to={explorerPath(config.entityType, id)} replace />;
}
