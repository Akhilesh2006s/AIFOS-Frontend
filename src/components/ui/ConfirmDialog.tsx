import { useEffect, useId } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (open) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="presentation">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="command-card w-full max-w-md p-6 shadow-glassxl"
      >
        <h3 id={titleId} className="text-heading-section">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-ghost btn-sm">{cancelLabel}</button>
          <button
            type="button"
            onClick={onConfirm}
            className={`btn-sm rounded-xl px-4 py-2 text-sm font-medium ${
              danger ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-accent/20 text-accent hover:bg-accent/30'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
