import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, ShoppingCart, Handshake, Cog, Package, Users } from 'lucide-react';

const ACTIONS = [
  { label: 'Project', path: '/projects', icon: Building2, color: 'text-sky-400' },
  { label: 'Purchase Request', path: '/procurement', icon: ShoppingCart, color: 'text-yellow-400' },
  { label: 'Vendor', path: '/vendors', icon: Handshake, color: 'text-amber-400' },
  { label: 'Equipment', path: '/equipment', icon: Cog, color: '#1F4E79' },
  { label: 'Material Issue', path: '/inventory?tab=issues', icon: Package, color: 'text-emerald-400' },
  { label: 'Employee', path: '/workforce', icon: Users, color: 'text-violet-400' },
];

export function QuickActionMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
      >
        <Plus size={16} className="text-accent" />
        <span className="hidden sm:inline">New</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-command-sidebar shadow-glassxl">
            <p className="border-b border-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Create</p>
            {ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => { navigate(a.path); setOpen(false); }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <a.icon size={16} className={a.color} />
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
