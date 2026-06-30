import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { WorkspaceLauncher } from '@/components/workspace/WorkspaceLauncher';
import { moduleApi } from '@/api/client';

export function DashboardPage() {
  const { user } = useAuthStore();
  const [projectCount, setProjectCount] = useState(0);

  useEffect(() => {
    moduleApi.projects.stats().then((r) => setProjectCount(r.data?.active ?? 0)).catch(() => {});
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">AFIOS</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
          {greeting()}, {user?.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Infrastructure Operating System — {projectCount} active projects across your organization
        </p>
      </motion.div>

      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Choose Workspace</p>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <WorkspaceLauncher />
      </div>

      <p className="text-center text-[10px] text-slate-600">
        Press <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono">⌘ K</kbd> to search projects, equipment, POs, vendors…
      </p>
    </div>
  );
}
