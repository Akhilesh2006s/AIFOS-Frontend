import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionPath?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({ title, description, actionLabel, actionPath, onAction, icon }: EmptyStateProps) {
  return (
    <div className="command-card flex flex-col items-center justify-center px-6 py-16 text-center" role="status">
      <div className="empty-state-icon">
        {icon || <Inbox size={28} className="text-slate-500" aria-hidden />}
      </div>
      <h3 className="font-display text-base font-semibold text-white">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>}
      {actionLabel && actionPath && (
        <Link to={actionPath} className="btn-accent btn-sm mt-5">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionPath && (
        <button type="button" onClick={onAction} className="btn-accent btn-sm mt-5">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
