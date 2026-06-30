import { useState } from 'react';
import { Search } from 'lucide-react';
import { moduleApi } from '@/api/client';
import { useContextStore } from '@/store/context';

interface SearchResult {
  purchaseRequisitions?: Array<{ _id: string; prNumber: string; title: string }>;
  rfqs?: Array<{ _id: string; rfqNumber: string; title?: string }>;
  purchaseOrders?: Array<{ _id: string; poNumber: string }>;
  vendors?: Array<{ _id: string; name: string; code: string }>;
  materials?: Array<{ _id: string; name: string; code: string }>;
  grns?: Array<{ _id: string; grnNumber: string }>;
  consumption?: Array<{ _id: string; materialId: string; entryType: string }>;
}

export function SupplyChainSearch() {
  const activeProject = useContextStore((s) => s.activeProject);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true);
    const res = await moduleApi.supplyChain.search(q.trim(), activeProject?.id);
    setResults(res.data);
    setLoading(false);
  };

  const sections = results ? [
    { key: 'purchaseRequisitions', label: 'Purchase Requisitions', items: results.purchaseRequisitions, fmt: (i: { prNumber: string; title: string }) => `${i.prNumber} — ${i.title}` },
    { key: 'rfqs', label: 'RFQ', items: results.rfqs, fmt: (i: { rfqNumber: string; title?: string }) => i.title || i.rfqNumber },
    { key: 'purchaseOrders', label: 'Purchase Orders', items: results.purchaseOrders, fmt: (i: { poNumber: string }) => i.poNumber },
    { key: 'vendors', label: 'Vendors', items: results.vendors, fmt: (i: { name: string; code: string }) => `${i.code} — ${i.name}` },
    { key: 'materials', label: 'Materials', items: results.materials, fmt: (i: { name: string; code: string }) => `${i.code} — ${i.name}` },
    { key: 'grns', label: 'GRN', items: results.grns, fmt: (i: { grnNumber: string }) => i.grnNumber },
    { key: 'consumption', label: 'Consumption', items: results.consumption, fmt: (i: { materialId: string; entryType: string }) => `${i.entryType} — ${i.materialId}` },
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
            placeholder="Search PR, RFQ, PO, vendor, material, GRN, consumption…"
            className="search-input"
            aria-label="Search supply chain"
          />
        </div>
        <button type="button" onClick={search} disabled={loading} className="btn-accent px-4 text-sm">
          {loading ? '…' : 'Search'}
        </button>
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
