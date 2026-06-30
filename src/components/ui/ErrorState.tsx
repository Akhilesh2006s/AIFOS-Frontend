import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="command-card flex flex-col items-center justify-center border-red-500/25 bg-red-500/5 px-6 py-14 text-center"
      role="alert"
    >
      <div className="mb-4 rounded-2xl bg-red-500/10 p-4 ring-1 ring-red-500/20">
        <AlertTriangle size={28} className="text-red-400" aria-hidden />
      </div>
      <h3 className="font-display text-base font-semibold text-white">{title}</h3>
      {message && <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">{message}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-ghost btn-sm mt-5">
          <RefreshCw size={14} aria-hidden />
          Try again
        </button>
      )}
    </div>
  );
}
