import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

interface DataTableProps {
  title: string;
  subtitle?: string;
  columns: Column[];
  data: Record<string, unknown>[];
  actions?: ReactNode;
  delay?: number;
  emptyMessage?: string;
}

export function DataTable({
  title,
  subtitle,
  columns,
  data,
  actions,
  delay = 0,
  emptyMessage = 'No records found',
}: DataTableProps) {
  return (
    <GlassCard delay={delay} noPadding className="overflow-hidden">
      <div
        className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        style={{ borderColor: 'var(--command-border)' }}
      >
        <div>
          <h3 className="text-heading-section">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="data-table" role="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-empty-cell">
                  <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                    <div className="empty-state-icon">
                      <Inbox size={26} className="text-slate-500" aria-hidden />
                    </div>
                    <p className="text-sm text-slate-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className="data-table-row">
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
