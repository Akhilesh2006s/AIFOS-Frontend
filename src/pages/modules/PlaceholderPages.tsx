import { Link } from 'react-router-dom';
import { IndianRupee, ArrowLeft } from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';

export function FinancePage() {
  return (
    <ModulePageLayout
      title="Budget, Cost & Billing"
      subtitle="Phase 2 — GST-compliant finance OS for Indian infrastructure enterprises"
      heroActions={
        <Link to="/" className="btn-ghost flex items-center gap-2 text-sm">
          <ArrowLeft size={14} /> Command Center
        </Link>
      }
    >
      <div className="command-card flex flex-col items-center justify-center p-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
          <IndianRupee size={32} className="text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Finance Cloud — Coming in Phase 2</h3>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Budget tracking, cost codes, vendor billing, TDS/GST workflows, and multi-currency support
          for India and global subsidiaries.
        </p>
      </div>
    </ModulePageLayout>
  );
}

export function WorkforcePage() {
  return (
    <ModulePageLayout
      title="People & Attendance"
      subtitle="Phase 2 — Workforce management for site labour, staff & contractors"
      heroActions={
        <Link to="/" className="btn-ghost flex items-center gap-2 text-sm">
          <ArrowLeft size={14} /> Command Center
        </Link>
      }
    >
      <div className="command-card flex flex-col items-center justify-center p-16 text-center">
        <h3 className="text-lg font-semibold text-white">Workforce Cloud — Coming in Phase 2</h3>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Attendance, payroll integration, PF/ESI compliance, and contractor management across
          multiple project sites.
        </p>
      </div>
    </ModulePageLayout>
  );
}
