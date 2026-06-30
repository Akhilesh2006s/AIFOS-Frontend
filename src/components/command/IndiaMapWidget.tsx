import { motion } from 'framer-motion';

export interface SitePin {
  id: string;
  city: string;
  status: 'on_track' | 'at_risk' | 'delayed';
  x: number;
  y: number;
}

const statusColors = {
  on_track: '#22c55e',
  at_risk: '#f97316',
  delayed: '#ef4444',
};

interface IndiaMapWidgetProps {
  sites: SitePin[];
}

export function IndiaMapWidget({ sites }: IndiaMapWidgetProps) {
  return (
    <div className="command-card h-full p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Live Site Overview</h3>
        <p className="text-[11px] text-slate-500">Active project locations across India</p>
      </div>

      <div className="relative mx-auto aspect-[4/3] max-h-[220px] w-full">
        {/* Simplified India silhouette */}
        <svg viewBox="0 0 400 480" className="h-full w-full" aria-hidden>
          <defs>
            <linearGradient id="mapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="100%" stopColor="#0f2744" />
            </linearGradient>
          </defs>
          <path
            d="M180,40 C200,35 220,50 230,70 C245,60 260,75 255,95 C270,100 285,120 280,140 C295,155 310,170 305,195 C320,210 330,235 325,260 C340,280 350,310 340,340 C330,370 310,390 285,400 C270,420 250,430 230,440 C210,450 190,460 170,455 C150,450 130,440 120,420 C100,410 85,390 80,365 C70,340 75,310 85,285 C75,260 80,235 95,215 C85,195 90,170 105,155 C95,130 110,110 130,95 C140,75 155,50 180,40 Z"
            fill="url(#mapGrad)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.5"
          />
          {/* Grid overlay */}
          {[...Array(6)].map((_, i) => (
            <line
              key={`h-${i}`}
              x1="60"
              y1={80 + i * 60}
              x2="340"
              y2={80 + i * 60}
              stroke="rgba(255,255,255,0.03)"
            />
          ))}
        </svg>

        {sites.map((site, i) => (
          <motion.div
            key={site.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="absolute group"
            style={{ left: `${site.x}%`, top: `${site.y}%` }}
          >
            <span
              className="relative flex h-3 w-3 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full ring-2 ring-command-bg"
              style={{ backgroundColor: statusColors[site.status] }}
            >
              <span
                className="absolute inset-0 animate-ping rounded-full opacity-40"
                style={{ backgroundColor: statusColors[site.status] }}
              />
            </span>
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-command-sidebar px-2 py-1 text-[10px] text-slate-300 opacity-0 ring-1 ring-white/10 transition-opacity group-hover:opacity-100">
              {site.city}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-slate-500">
        {Object.entries(statusColors).map(([key, color]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {key.replace('_', ' ')}
          </span>
        ))}
      </div>
    </div>
  );
}
