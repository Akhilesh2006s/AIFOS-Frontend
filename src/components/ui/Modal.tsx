import { useEffect, useId, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  wide?: boolean;
}

export function Modal({ open, onClose, title, subtitle, children, wide }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="presentation">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.2 }}
            className={`relative z-10 w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} command-card shadow-glassxl`}
          >
            <div className="relative z-10 border-b px-6 py-4" style={{ borderColor: 'var(--command-border)' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 id={titleId} className="text-heading-section">{title}</h3>
                  {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="command-icon-btn -mr-1"
                  aria-label="Close dialog"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="relative z-10 max-h-[min(70vh,640px)] overflow-y-auto px-6 py-5 scrollbar-thin">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
