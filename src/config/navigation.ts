import {
  LayoutDashboard,
  Building2,
  ShoppingCart,
  Handshake,
  Package,
  Layers,
  Cog,
  Truck,
  Wrench,
  ShieldCheck,
  IndianRupee,
  Users,
  BarChart3,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export interface NavCloud {
  id: string;
  label: string;
  subtitle: string;
  path: string;
  icon: LucideIcon;
  accent: string;
  badge?: string;
  phase?: 1 | 2;
  order: number;
}

export interface NavSection {
  title: string;
  items: NavCloud[];
}

export const homeNav: NavCloud = {
  id: 'home',
  label: 'Home',
  subtitle: 'Command Center',
  path: '/',
  icon: LayoutDashboard,
  accent: 'text-accent',
  order: 0,
};

/** Operational chain — order mirrors real infrastructure workflow */
export const operationalClouds: NavCloud[] = [
  { id: 'projects', label: 'Projects Cloud', subtitle: 'BOQ, Budget & Progress', path: '/projects', icon: Building2, accent: 'text-sky-400', order: 1 },
  { id: 'procurement', label: 'Procurement Cloud', subtitle: 'PR → RFQ → PO', path: '/procurement', icon: ShoppingCart, accent: 'text-orange-400', order: 2 },
  { id: 'vendors', label: 'Vendor Cloud', subtitle: 'Suppliers & Performance', path: '/vendors', icon: Handshake, accent: 'text-amber-400', order: 3 },
  { id: 'inventory', label: 'Inventory Cloud', subtitle: 'GRN, Stock & Issue', path: '/inventory', icon: Package, accent: 'text-teal-400', order: 4 },
  { id: 'consumption', label: 'Consumption Cloud', subtitle: 'Usage, Waste & Reconcile', path: '/consumption', icon: Layers, accent: 'text-violet-400', order: 5 },
  { id: 'equipment', label: 'Equipment Cloud', subtitle: 'Assets & Utilization', path: '/equipment', icon: Cog, accent: 'text-slate-300', order: 6 },
  { id: 'fleet', label: 'Fleet Cloud', subtitle: 'Vehicles & Trips', path: '/fleet', icon: Truck, accent: 'text-blue-400', order: 7 },
  { id: 'maintenance', label: 'Maintenance Cloud', subtitle: 'Work Orders & PM', path: '/maintenance', icon: Wrench, accent: 'text-amber-400', order: 8 },
];

export const navSections: NavSection[] = [
  {
    title: 'Operational Chain',
    items: operationalClouds,
  },
  {
    title: 'Enterprise',
    items: [
      { id: 'finance', label: 'Finance Cloud', subtitle: 'Budget, Cost & Billing', path: '/finance', icon: IndianRupee, accent: 'text-emerald-400', phase: 2, order: 9 },
      { id: 'compliance', label: 'Compliance Cloud', subtitle: 'Safety, Legal & Audit', path: '/compliance', icon: ShieldCheck, accent: 'text-yellow-400', order: 10 },
      { id: 'hr', label: 'Workforce Cloud', subtitle: 'People & Attendance', path: '/workforce', icon: Users, accent: 'text-violet-400', phase: 2, order: 11 },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { id: 'analytics', label: 'Analytics Cloud', subtitle: 'Reports & Insights', path: '/analytics', icon: BarChart3, accent: 'text-cyan-400', order: 12 },
      { id: 'ai', label: 'AI Assistant', subtitle: 'Intelligence at Work', path: '/ai', icon: Sparkles, accent: 'text-orange-400', order: 13 },
    ],
  },
];
