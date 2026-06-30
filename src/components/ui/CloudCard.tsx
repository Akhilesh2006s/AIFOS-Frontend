import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CloudCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  stat?: string | number;
  accent: string;
  delay?: number;
}

export function CloudCard({
  title,
  description,
  icon: Icon,
  path,
  stat,
  accent,
  delay = 0,
}: CloudCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay: delay * 0.06 }}
      whileHover={{ y: -6 }}
    >
      <Link
        to={path}
        className="glass-card group block p-5 transition-all duration-300 hover:shadow-glassxl"
      >
        <div className="relative z-10">
          <div className="mb-4 flex items-start justify-between">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
                accent,
              )}
            >
              <Icon size={22} strokeWidth={1.75} />
            </div>
            {stat !== undefined && (
              <span className="font-mono text-lg font-semibold tabular-nums text-white">{stat}</span>
            )}
          </div>
          <h4 className="text-heading-section text-sm">{title}</h4>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{description}</p>
          <div className="mt-4 flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
            Open module <ArrowRight size={12} aria-hidden />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
