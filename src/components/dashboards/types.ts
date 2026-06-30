import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface DashboardKpi {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
  color?: string;
}

export interface DashboardWorkItem {
  id: string;
  label: string;
  detail?: string;
  status?: string;
  href?: string;
}

export interface DashboardAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message?: string;
  href?: string;
}

export interface DashboardQuickAction {
  label: string;
  href: string;
  icon?: LucideIcon;
  desc?: string;
}

export interface DashboardActivity {
  id: string;
  type: string;
  label: string;
  status?: string;
  at?: string;
}

export interface DashboardTableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => ReactNode;
}
