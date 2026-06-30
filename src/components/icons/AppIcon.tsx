import type { ReactNode } from 'react';
import type { WorkspaceId } from '@/config/workspaces';
import { cn } from '@/lib/utils';

interface AppIconProps {
  id: WorkspaceId;
  size?: number;
  className?: string;
}

/** Realistic isometric-style app icons for Mission Control workspaces */
export function AppIcon({ id, size = 40, className }: AppIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      aria-hidden
    >
      {icons[id]}
    </svg>
  );
}

const icons: Record<WorkspaceId, ReactNode> = {
  command: (
    <>
      <defs>
        <linearGradient id="cmd-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a2f4d" />
          <stop offset="100%" stopColor="#0d1829" />
        </linearGradient>
        <radialGradient id="cmd-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F97316" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#cmd-bg)" />
      <circle cx="24" cy="24" r="18" fill="url(#cmd-glow)" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="#F97316" strokeWidth="1" opacity="0.4" />
      <circle cx="24" cy="24" r="9" fill="none" stroke="#F97316" strokeWidth="1.5" opacity="0.7" />
      <line x1="24" y1="24" x2="24" y2="10" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="24" r="2.5" fill="#F97316" />
      <circle cx="32" cy="18" r="2" fill="#38BDF8" opacity="0.9" />
      <circle cx="16" cy="28" r="1.5" fill="#22C55E" opacity="0.8" />
    </>
  ),
  projects: (
    <>
      <defs>
        <linearGradient id="prj-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0f1d32" />
        </linearGradient>
        <linearGradient id="prj-bldg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5eb3e8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="prj-crane" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#prj-sky)" />
      <rect x="8" y="22" width="22" height="18" rx="2" fill="url(#prj-bldg)" />
      <rect x="12" y="26" width="4" height="4" rx="0.5" fill="#93c5fd" opacity="0.8" />
      <rect x="18" y="26" width="4" height="4" rx="0.5" fill="#93c5fd" opacity="0.8" />
      <rect x="12" y="32" width="4" height="4" rx="0.5" fill="#93c5fd" opacity="0.6" />
      <rect x="18" y="32" width="4" height="4" rx="0.5" fill="#93c5fd" opacity="0.6" />
      <line x1="34" y1="38" x2="34" y2="10" stroke="url(#prj-crane)" strokeWidth="3" strokeLinecap="round" />
      <line x1="34" y1="12" x2="42" y2="16" stroke="url(#prj-crane)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="38" y1="14" x2="38" y2="22" stroke="#94a3b8" strokeWidth="1" />
      <rect x="36" y="22" width="4" height="3" rx="0.5" fill="#64748b" />
      <ellipse cx="24" cy="42" rx="16" ry="2" fill="#000" opacity="0.2" />
    </>
  ),
  supply_chain: (
    <>
      <defs>
        <linearGradient id="sc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#052e16" />
          <stop offset="100%" stopColor="#1a1208" />
        </linearGradient>
        <linearGradient id="sc-box" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#sc-bg)" />
      <rect x="10" y="18" width="14" height="12" rx="2" fill="url(#sc-box)" />
      <rect x="24" y="14" width="14" height="12" rx="2" fill="url(#sc-box)" opacity="0.85" />
      <path d="M14 34 L18 34 L20 40 L32 40 L34 30 L22 30" fill="none" stroke="#EAB308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="22" cy="41" r="2" fill="#78716c" stroke="#EAB308" strokeWidth="1" />
      <circle cx="30" cy="41" r="2" fill="#78716c" stroke="#EAB308" strokeWidth="1" />
      <rect x="6" y="28" width="36" height="4" rx="1" fill="#22C55E" opacity="0.3" />
    </>
  ),
  assets: (
    <>
      <defs>
        <linearGradient id="ast-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0c1929" />
          <stop offset="100%" stopColor="#060d18" />
        </linearGradient>
        <linearGradient id="ast-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1F4E79" />
        </linearGradient>
        <linearGradient id="ast-arm" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ast-bg)" />
      <ellipse cx="24" cy="40" rx="18" ry="3" fill="#000" opacity="0.25" />
      <rect x="10" y="28" width="22" height="10" rx="3" fill="url(#ast-body)" />
      <rect x="8" y="24" width="12" height="8" rx="2" fill="#2563eb" />
      <circle cx="14" cy="38" r="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
      <circle cx="28" cy="38" r="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
      <line x1="30" y1="26" x2="38" y2="10" stroke="url(#ast-arm)" strokeWidth="3" strokeLinecap="round" />
      <line x1="38" y1="10" x2="42" y2="8" stroke="url(#ast-arm)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M40 8 L44 14 L38 14 Z" fill="#64748b" />
      <rect x="32" y="22" width="6" height="4" rx="1" fill="#475569" />
    </>
  ),
  business: (
    <>
      <defs>
        <linearGradient id="biz-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="100%" stopColor="#0a1628" />
        </linearGradient>
        <linearGradient id="biz-coin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#biz-bg)" />
      <ellipse cx="20" cy="30" rx="10" ry="3" fill="#000" opacity="0.2" />
      <ellipse cx="28" cy="26" rx="10" ry="3" fill="#000" opacity="0.15" />
      <ellipse cx="24" cy="22" rx="11" ry="4" fill="url(#biz-coin)" />
      <ellipse cx="24" cy="20" rx="11" ry="4" fill="#34d399" opacity="0.6" />
      <text x="24" y="25" textAnchor="middle" fill="#064e3b" fontSize="14" fontWeight="bold">₹</text>
      <rect x="30" y="12" width="12" height="16" rx="2" fill="#fef3c7" opacity="0.2" stroke="#10B981" strokeWidth="0.8" />
      <line x1="33" y1="17" x2="39" y2="17" stroke="#10B981" strokeWidth="1" opacity="0.5" />
      <line x1="33" y1="21" x2="37" y2="21" stroke="#10B981" strokeWidth="1" opacity="0.4" />
    </>
  ),
  workforce: (
    <>
      <defs>
        <linearGradient id="wf-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a5f" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="wf-helmet" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#wf-bg)" />
      <ellipse cx="24" cy="40" rx="14" ry="2.5" fill="#000" opacity="0.2" />
      <path d="M14 28 Q24 16 34 28 L32 34 Q24 30 16 34 Z" fill="url(#wf-helmet)" />
      <rect x="12" y="28" width="24" height="4" rx="2" fill="#B45309" />
      <circle cx="18" cy="38" r="3" fill="#38BDF8" />
      <circle cx="30" cy="38" r="3" fill="#38BDF8" />
      <circle cx="24" cy="36" r="3" fill="#38BDF8" />
    </>
  ),
  insights: (
    <>
      <defs>
        <linearGradient id="ins-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2e1065" />
          <stop offset="100%" stopColor="#0a1628" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#ins-bg)" />
      <rect x="10" y="32" width="6" height="8" rx="1" fill="#7c3aed" opacity="0.7" />
      <rect x="18" y="24" width="6" height="16" rx="1" fill="#8b5cf6" />
      <rect x="26" y="18" width="6" height="22" rx="1" fill="#a78bfa" />
      <rect x="34" y="12" width="6" height="28" rx="1" fill="#c4b5fd" />
      <polyline points="13,28 21,20 29,22 37,14" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="37" cy="14" r="2.5" fill="#F97316" />
    </>
  ),
  integrations: (
    <>
      <defs>
        <linearGradient id="int-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#042f2e" />
          <stop offset="100%" stopColor="#0a1628" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#int-bg)" />
      <rect x="8" y="20" width="12" height="8" rx="2" fill="#14b8a6" />
      <rect x="28" y="20" width="12" height="8" rx="2" fill="#2dd4bf" />
      <path d="M20 24 L28 24" stroke="#5eead4" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="24" r="3" fill="#0d9488" stroke="#99f6e4" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="2" fill="#38bdf8" opacity="0.8" />
      <circle cx="34" cy="34" r="2" fill="#22c55e" opacity="0.8" />
    </>
  ),
  admin: (
    <>
      <defs>
        <linearGradient id="adm-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#adm-bg)" />
      <circle cx="24" cy="24" r="12" fill="none" stroke="#64748b" strokeWidth="3" strokeDasharray="4 2" />
      <circle cx="24" cy="24" r="6" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="2" fill="#cbd5e1" />
      <rect x="22" y="6" width="4" height="8" rx="1" fill="#94a3b8" />
      <rect x="22" y="34" width="4" height="8" rx="1" fill="#94a3b8" />
      <rect x="6" y="22" width="8" height="4" rx="1" fill="#94a3b8" />
      <rect x="34" y="22" width="8" height="4" rx="1" fill="#94a3b8" />
    </>
  ),
};
