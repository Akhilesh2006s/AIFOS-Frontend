import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  dark?: boolean;
  delay?: number;
  noPadding?: boolean;
}

export function GlassCard({
  children,
  className,
  dark = false,
  delay = 0,
  noPadding = false,
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: delay * 0.1 }}
      className={cn(
        dark ? 'glass-card-dark' : 'glass-card',
        !noPadding && 'p-6',
        className,
      )}
    >
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
