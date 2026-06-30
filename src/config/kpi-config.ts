import {
  Building2,
  Cog,
  Truck,
  Package,
  ShoppingCart,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

export interface KpiVisualConfig {
  icon: LucideIcon;
  iconColor: string;
}

export const commandKpiVisuals: Record<string, KpiVisualConfig> = {
  'total-projects': { icon: Building2, iconColor: 'text-sky-400' },
  'active-equipment': { icon: Cog, iconColor: 'text-slate-300' },
  'fleet-on-trip': { icon: Truck, iconColor: 'text-blue-400' },
  'inventory-value': { icon: Package, iconColor: 'text-teal-400' },
  'pending-pos': { icon: ShoppingCart, iconColor: 'text-orange-400' },
  'safety-alerts': { icon: ShieldCheck, iconColor: 'text-amber-400' },
  // legacy ids
  'active-projects': { icon: Building2, iconColor: 'text-sky-400' },
  'equipment-utilization': { icon: Cog, iconColor: 'text-slate-300' },
  'pending-prs': { icon: ShoppingCart, iconColor: 'text-orange-400' },
  'compliance-alerts': { icon: ShieldCheck, iconColor: 'text-amber-400' },
};

export const defaultCommandKpiVisual: KpiVisualConfig = {
  icon: Building2,
  iconColor: 'text-accent',
};
