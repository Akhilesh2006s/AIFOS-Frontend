import { Building2 } from 'lucide-react';
import { useOrgStore } from '@/store/org';
import { cn } from '@/lib/utils';

interface Props {
  selector?: {
    activeOrganizationId?: string;
    activeOrganizationName?: string;
    switchableOrganizations?: Array<{ id: string; name: string; code?: string }>;
  };
  onOrgChange?: () => void;
}

export function OrganizationSelector({ selector, onOrgChange }: Props) {
  const { activeOrganizationId, setActiveOrganizationId } = useOrgStore();
  const orgs = selector?.switchableOrganizations || [];
  const currentId = activeOrganizationId || selector?.activeOrganizationId || orgs[0]?.id || '';

  if (orgs.length <= 1) {
    const name = selector?.activeOrganizationName || orgs[0]?.name;
    if (!name) return null;
    return (
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
        <Building2 size={14} className="text-violet-400" />
        <span>{name}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 size={14} className="text-violet-400" />
      <select
        value={currentId}
        onChange={(e) => {
          setActiveOrganizationId(e.target.value);
          onOrgChange?.();
        }}
        className={cn('rounded-lg border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200')}
      >
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>{o.name}{o.code ? ` (${o.code})` : ''}</option>
        ))}
      </select>
    </div>
  );
}
