import type { ExplorerEntityType } from '@/lib/explorerLinks';

export interface ExplorerView {
  entityType: ExplorerEntityType;
  entityId: string;
  title: string;
  subtitle: string;
  status: string;
  owner?: string;
  projectId?: string;
  projectName?: string;
  chain: ExplorerChainNode[];
  upstream: ExplorerChainNode[];
  downstream: ExplorerChainNode[];
  relationships: ExplorerRelationship[];
  breadcrumbs: ExplorerBreadcrumb[];
  workflow?: ExplorerWorkflow;
  kpis: Array<{ label: string; value: string | number; accent?: string }>;
  financial?: { label: string; amount?: number; detail?: string };
  intelligence?: {
    recommendation: string;
    severity: 'critical' | 'high' | 'medium' | 'info';
    actionLabel?: string;
    blockers?: string[];
  };
  timeline: Array<{ at: string; title: string; detail?: string; actor?: string }>;
  activities: Array<{ at: string; title: string; message: string; type: string }>;
  audit: Array<{ at: string; title: string; detail?: string; actor?: string }>;
  documents: Array<{ id: string; title: string; category: string }>;
  nextAction?: { label: string; detail: string; urgency: string };
}

export interface ExplorerChainNode {
  key: string;
  label: string;
  status: 'complete' | 'active' | 'waiting' | 'blocked' | 'delayed' | 'not_started';
  detail?: string;
  entityType?: ExplorerEntityType;
  entityId?: string;
}

export interface ExplorerRelationship {
  role: string;
  label: string;
  entityType: ExplorerEntityType;
  entityId: string;
  meta?: string;
  direction?: 'upstream' | 'downstream' | 'peer';
}

export interface ExplorerBreadcrumb {
  label: string;
  entityType?: ExplorerEntityType;
  entityId?: string;
}

export interface ExplorerWorkflow {
  stage: string;
  position: string;
  pendingWith?: string;
  steps: Array<{
    label: string;
    status: ExplorerChainNode['status'];
    detail?: string;
    actor?: string;
  }>;
}
