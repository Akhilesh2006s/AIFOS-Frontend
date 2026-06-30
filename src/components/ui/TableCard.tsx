import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableCardProps {
  children: ReactNode;
  className?: string;
}

export function TableCard({ children, className }: TableCardProps) {
  return (
    <div className={cn('command-card min-w-0 overflow-x-auto p-0 scrollbar-thin', className)}>
      {children}
    </div>
  );
}

interface TableEmptyProps {
  colSpan: number;
  message?: string;
}

export function TableEmpty({ colSpan, message = 'No records found' }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="table-empty-cell">
        <div className="mx-auto flex max-w-sm flex-col items-center text-center">
          <div className="empty-state-icon">
            <Inbox size={26} className="text-slate-500" aria-hidden />
          </div>
          <p className="text-sm text-slate-500">{message}</p>
        </div>
      </td>
    </tr>
  );
}
