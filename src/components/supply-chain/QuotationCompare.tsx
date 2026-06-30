import { useEffect, useState } from 'react';
import { Trophy, Star, Shield, IndianRupee } from 'lucide-react';
import { moduleApi } from '@/api/client';
import { formatCurrency } from '@/lib/utils';

interface CompareRow {
  quotation: { _id: string };
  vendorId: string;
  price: number;
  gst: number;
  deliveryDays: number;
  warranty?: string;
  paymentTerms?: string;
  technicalCompliance: boolean;
  remarks?: string;
  scores: { price: number; delivery: number; technical: number; commercial: number; value: number };
  isLowestPrice: boolean;
  isBestValue: boolean;
  isTechnicalWinner: boolean;
  isCommercialWinner: boolean;
}

interface Props {
  rfqId: string;
  vendors: Array<{ _id: string; name: string }>;
  onAward?: (quotationId: string) => void;
}

const STRATEGIES = [
  { id: 'lowest_price', label: 'Lowest Price', icon: IndianRupee },
  { id: 'best_value', label: 'Best Value', icon: Star },
  { id: 'technical', label: 'Technical Winner', icon: Shield },
  { id: 'commercial', label: 'Commercial Winner', icon: Trophy },
] as const;

export function QuotationCompare({ rfqId, vendors, onAward }: Props) {
  const [strategy, setStrategy] = useState<string>('best_value');
  const [rows, setRows] = useState<CompareRow[]>([]);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const vendorName = (id: string) => vendors.find((v) => v._id === id)?.name || id.slice(-6);

  const load = async (s: string) => {
    setLoading(true);
    const res = await moduleApi.procurement.compareQuotations(rfqId, s);
    setRows(res.data.quotations || []);
    setWinnerId(res.data.winner?._id || null);
    setLoading(false);
  };

  useEffect(() => { load(strategy); }, [rfqId, strategy]);

  if (loading) return <div className="py-12 text-center text-slate-500">Loading comparison…</div>;
  if (!rows.length) return <div className="py-12 text-center text-slate-500">No quotations to compare yet.</div>;

  const maxPrice = Math.max(...rows.map((r) => r.price), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {STRATEGIES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStrategy(s.id)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              strategy === s.id ? 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/40' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <s.icon size={14} /> {s.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => {
          const isWinner = row.quotation._id === winnerId;
          const pricePct = Math.round((1 - row.price / maxPrice) * 100);
          return (
            <div
              key={row.quotation._id}
              className={`relative rounded-xl border p-5 transition ${
                isWinner ? 'border-yellow-500/50 bg-yellow-500/5 ring-2 ring-yellow-500/30' : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              {isWinner && (
                <span className="absolute -top-2 right-4 rounded-full bg-yellow-500 px-2 py-0.5 text-[10px] font-bold uppercase text-black">
                  Recommended
                </span>
              )}
              <h4 className="font-semibold text-white">{vendorName(row.vendorId)}</h4>
              <p className="mt-1 font-mono text-2xl text-yellow-400">{formatCurrency(row.price)}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pricePct}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-500">{pricePct}% below highest bid</p>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">GST</dt><dd className="font-mono">{formatCurrency(row.gst)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Delivery</dt><dd>{row.deliveryDays} days</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Warranty</dt><dd>{row.warranty || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Payment</dt><dd>{row.paymentTerms || '—'}</dd></div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Technical</dt>
                  <dd className={row.technicalCompliance ? 'text-emerald-400' : 'text-red-400'}>
                    {row.technicalCompliance ? 'Compliant' : 'Non-compliant'}
                  </dd>
                </div>
              </dl>

              <div className="mt-3 flex flex-wrap gap-1">
                {row.isLowestPrice && <Badge color="emerald">Lowest Price</Badge>}
                {row.isBestValue && <Badge color="yellow">Best Value</Badge>}
                {row.isTechnicalWinner && <Badge color="blue">Technical</Badge>}
                {row.isCommercialWinner && <Badge color="purple">Commercial</Badge>}
              </div>

              {onAward && (
                <button
                  type="button"
                  onClick={() => onAward(row.quotation._id)}
                  className="mt-4 w-full rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  Award Vendor
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-500/20 text-emerald-300',
    yellow: 'bg-yellow-500/20 text-yellow-300',
    blue: 'bg-blue-500/20 text-blue-300',
    purple: 'bg-purple-500/20 text-purple-300',
  };
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${colors[color]}`}>{children}</span>;
}
