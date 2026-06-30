import { motion } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard } from './GlassCard';

interface AiInsight {
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
}

const config = {
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  info: { icon: Info, color: 'text-sky-300', bg: 'bg-sky-400/10' },
  success: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
};

export function AiInsightsPanel({ insights, delay = 0 }: { insights: AiInsight[]; delay?: number }) {
  return (
    <GlassCard dark delay={delay} className="border-t-2 border-t-accent">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
          <Sparkles className="text-accent" size={18} />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold">AI Insights</h3>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">
            AFIOS Intelligence Engine
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight, i) => {
          const { icon: Icon, color, bg } = config[insight.type];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10"
            >
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', bg)}>
                <Icon size={16} className={color} />
              </div>
              <div>
                <p className="text-sm font-semibold">{insight.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{insight.message}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassCard>
  );
}
