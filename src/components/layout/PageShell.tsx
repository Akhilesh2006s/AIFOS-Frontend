import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function PageLoader({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          className="mx-auto mb-5 h-11 w-11 rounded-full border-2 border-white/10 border-t-accent"
          aria-hidden
        />
        <p className="text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}

interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return <div className="page-canvas page-enter">{children}</div>;
}
