import { useToastStore } from '@/store/toast';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={cn(
            'flex cursor-pointer items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur',
            t.type === 'success' && 'border-emerald-500/30 bg-emerald-500/15 text-emerald-100',
            t.type === 'error' && 'border-red-500/30 bg-red-500/15 text-red-100',
            t.type === 'info' && 'border-sky-500/30 bg-sky-500/15 text-sky-100',
          )}
        >
          {t.type === 'success' && <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
          {t.type === 'error' && <AlertCircle size={16} className="mt-0.5 shrink-0" />}
          {t.type === 'info' && <Info size={16} className="mt-0.5 shrink-0" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
