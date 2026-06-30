import { useEffect } from 'react';
import { useBrandStore } from '@/store/brand';
import { useOrgStore } from '@/store/org';

export function BrandHydrator() {
  const load = useBrandStore((s) => s.load);
  const activeOrganizationId = useOrgStore((s) => s.activeOrganizationId);

  useEffect(() => {
    load(activeOrganizationId || undefined).catch(() => undefined);
  }, [load, activeOrganizationId]);

  return null;
}
