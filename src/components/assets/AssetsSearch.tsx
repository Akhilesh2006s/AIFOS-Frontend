import { useState } from 'react';
import { Search } from 'lucide-react';
import { moduleApi } from '@/api/client';
import { useContextStore } from '@/store/context';

export function AssetsSearch() {
  const activeProject = useContextStore((s) => s.activeProject);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Record<string, Array<{ _id: string } & Record<string, string>>> | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true);
    const res = await moduleApi.assets.search(q.trim(), activeProject?.id);
    setResults(res.data);
    setLoading(false);
  };

  const sections = results ? [
    { key: 'equipment', label: 'Equipment', items: results.equipment, fmt: (i: { name?: string; code?: string }) => `${i.code} — ${i.name}` },
    { key: 'vehicles', label: 'Vehicles', items: results.vehicles, fmt: (i: { name?: string; registrationNumber?: string }) => `${i.registrationNumber} — ${i.name}` },
    { key: 'operators', label: 'Operators', items: results.operators, fmt: (i: { name?: string; code?: string }) => `${i.code} — ${i.name}` },
    { key: 'workOrders', label: 'Work Orders', items: results.workOrders, fmt: (i: { woNumber?: string; title?: string }) => `${i.woNumber} — ${i.title}` },
    { key: 'fuel', label: 'Fuel Entries', items: results.fuel, fmt: (i: { quantity?: number; filledBy?: string }) => `${i.quantity}L — ${i.filledBy || ''}` },
    { key: 'compliance', label: 'Compliance', items: results.compliance, fmt: (i: { documentType?: string; documentNumber?: string }) => `${i.documentType} — ${i.documentNumber}` },
  ].filter((s) => s.items?.length) : [];

  return (
    <div className="command-card p-4">
      <div className="flex gap-2">
        <div className="search-input-wrap">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="Search equipment, vehicle, operator, work order, fuel, compliance…"
            className="search-input"
            aria-label="Search assets"
          />
        </div>
        <button type="button" onClick={search} disabled={loading} className="btn-accent px-4 text-sm">{loading ? '…' : 'Search'}</button>
      </div>
      {sections.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((sec) => (
            <div key={sec.key} className="rounded-lg bg-white/[0.03] p-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{sec.label}</h4>
              <ul className="mt-2 space-y-1">
                {sec.items!.slice(0, 5).map((item) => (
                  <li key={item._id} className="text-sm text-slate-300">{sec.fmt(item as never)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
