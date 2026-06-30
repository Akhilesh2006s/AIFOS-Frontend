import { useEffect, useState } from 'react';

import { moduleApi, missionControlApi } from '@/api/client';

import { COMMAND_PALETTE_ITEMS } from '@/config/workspaces';
import { canAccessRoute } from '@/config/rbac';
import { useAuthStore } from '@/store/auth';

import { useContextStore } from '@/store/context';
import { explorerPath, explorerPrByNumber, resolveExplorerKind } from '@/lib/explorerLinks';



export interface SearchResult {

  id: string;

  label: string;

  sublabel?: string;

  path: string;

  group: string;

  kind: 'project' | 'equipment' | 'vendor' | 'pr' | 'po' | 'page' | 'workspace' | 'material' | 'issue' | 'document';

}



export function useGlobalSearch(query: string) {

  const [index, setIndex] = useState<SearchResult[]>([]);

  const [apiResults, setApiResults] = useState<SearchResult[]>([]);

  const [loaded, setLoaded] = useState(false);

  const [apiLoading, setApiLoading] = useState(false);

  const activeProject = useContextStore((s) => s.activeProject);
  const role = useAuthStore((s) => s.user?.role ?? 'user');



  useEffect(() => {
    if (loaded) return;

    Promise.all([

      moduleApi.projects.list(),

      moduleApi.equipment.list(),

      moduleApi.procurement.vendors(),

      moduleApi.procurement.prs(),

      moduleApi.procurement.pos().catch(() => ({ data: [] })),

    ])

      .then(([projects, equipment, vendors, prs, pos]) => {

        const results: SearchResult[] = [];



        for (const p of projects.data) {

          results.push({

            id: `proj-${p._id}`,

            label: p.name,

            sublabel: `${p.code} · Project`,

            path: explorerPath('project', p._id),

            group: 'Projects',

            kind: 'project',

          });

        }

        for (const e of equipment.data) {

          results.push({

            id: `eq-${e._id}`,

            label: e.name,

            sublabel: `${e.code} · Equipment`,

            path: explorerPath('equipment', e._id),

            group: 'Assets',

            kind: 'equipment',

          });

        }

        for (const v of vendors.data) {

          results.push({

            id: `vnd-${v._id}`,

            label: v.name,

            sublabel: `${v.code} · Vendor`,

            path: explorerPath('vendor', v._id),

            group: 'Supply Chain',

            kind: 'vendor',

          });

        }

        for (const pr of prs.data) {

          results.push({

            id: `pr-${pr._id}`,

            label: pr.title || pr.prNumber,

            sublabel: `${pr.prNumber} · Purchase Request`,

            path: pr.prNumber === 'PR-1024' ? explorerPrByNumber('PR-1024') : explorerPath('purchase-request', pr._id),

            group: 'Supply Chain',

            kind: 'pr',

          });

        }

        for (const po of pos.data) {

          results.push({

            id: `po-${po._id}`,

            label: po.poNumber || 'Purchase Order',

            sublabel: 'Purchase Order',

            path: explorerPath('purchase-order', po._id),

            group: 'Supply Chain',

            kind: 'po',

          });

        }



        for (const g of COMMAND_PALETTE_ITEMS) {
          for (const item of g.items) {
            if (!canAccessRoute(role, item.path.split('?')[0])) continue;
            results.push({

              id: `nav-${item.path}-${item.label}`,

              label: item.label,

              sublabel: g.group,

              path: item.path,

              group: g.group,

              kind: (item as { type?: string }).type === 'workspace' ? 'workspace' : 'page',

            });

          }

        }



        setIndex(results);

        setLoaded(true);

      })

      .catch(() => setLoaded(true));
  }, [loaded, role]);



  useEffect(() => {

    const q = query.trim();

    if (q.length < 2) {

      setApiResults([]);

      return;

    }

    const t = setTimeout(() => {

      setApiLoading(true);

      missionControlApi

        .search(q)

        .then((res) => {

          const d = res.data;

          const merged: SearchResult[] = [];

          for (const p of d.projects || []) {

            merged.push({

              id: `api-proj-${p._id}`,

              label: p.name,

              sublabel: `${p.code} · Project`,

              path: explorerPath('project', p._id),

              group: 'Projects',

              kind: 'project',

            });

          }

          for (const e of d.equipment || []) {

            merged.push({

              id: `api-eq-${e._id}`,

              label: e.name,

              sublabel: `${e.code} · Equipment`,

              path: explorerPath('equipment', e._id),

              group: 'Assets',

              kind: 'equipment',

            });

          }

          for (const po of d.purchaseOrders || []) {

            merged.push({

              id: `api-po-${po._id}`,

              label: po.poNumber || 'PO',

              sublabel: 'Purchase Order',

              path: explorerPath('purchase-order', po._id),

              group: 'Supply Chain',

              kind: 'po',

            });

          }

          for (const m of d.materials || []) {

            merged.push({

              id: `api-mat-${m._id}`,

              label: m.name,

              sublabel: `${m.code} · Material`,

              path: explorerPath('warehouse-material', m._id),

              group: 'Supply Chain',

              kind: 'material',

            });

          }

          for (const v of d.vendors || []) {

            merged.push({

              id: `api-vnd-${v._id}`,

              label: v.name,

              sublabel: 'Vendor',

              path: explorerPath('vendor', v._id),

              group: 'Supply Chain',

              kind: 'vendor',

            });

          }

          for (const i of d.issues || []) {

            merged.push({

              id: `api-issue-${i.id}`,

              label: i.label,

              sublabel: 'Issue',

              path: i.path,

              group: 'Projects',

              kind: 'issue',

            });

          }

          for (const r of d.dailyReports || []) {

            merged.push({

              id: `api-dr-${r.id}`,

              label: r.label,

              sublabel: 'Daily Report',

              path: r.path,

              group: 'Projects',

              kind: 'document',

            });

          }

          for (const doc of d.documents || []) {

            merged.push({

              id: `api-doc-${doc.id}`,

              label: doc.label,

              sublabel: `${doc.category || 'Document'} · Document Center`,

              path: doc.path?.startsWith('/explore') ? doc.path : explorerPath('document', doc.id),

              group: 'Documents',

              kind: 'document',

            });

          }

          for (const comp of d.compliance || []) {

            merged.push({

              id: `api-comp-${comp.id}`,

              label: comp.label,

              sublabel: `${comp.category || 'Compliance'} · Compliance+`,

              path: comp.path?.startsWith('/explore') ? comp.path : explorerPath('compliance-record', comp.id),

              group: 'Compliance',

              kind: 'document',

            });

          }

          for (const permit of d.permits || []) {

            merged.push({

              id: `api-ptw-${permit.id}`,

              label: permit.label,

              sublabel: `Permit · ${permit.status || 'PTW'}`,

              path: permit.path?.startsWith('/explore') ? permit.path : explorerPath('permit', permit.id),

              group: 'Workforce',

              kind: 'page',

            });

          }

          for (const item of d.quality || []) {

            merged.push({

              id: `api-quality-${item.id}`,

              label: item.label,

              sublabel: `Quality · ${item.type || 'inspection'} · ${item.status || ''}`,

              path: item.path?.startsWith('/explore') ? item.path : resolveExplorerKind(item.type === 'ncr' ? 'ncr' : 'inspection', item.id),

              group: 'Workforce',

              kind: 'page',

            });

          }

          for (const item of d.workforceIntel || []) {

            merged.push({

              id: `api-wfintel-${item.id}`,

              label: item.label,

              sublabel: `Workforce · ${item.type || ''} · ${item.status || ''}`,

              path: item.path,

              group: 'Workforce',

              kind: 'page',

            });

          }

          setApiResults(merged);

        })

        .catch(() => setApiResults([]))

        .finally(() => setApiLoading(false));

    }, 250);

    return () => clearTimeout(t);

  }, [query]);



  const filtered = (() => {

    const q = query.toLowerCase().trim();

    let pool = q.length >= 2 && apiResults.length > 0 ? [...apiResults, ...index] : index;

    const seen = new Set<string>();

    pool = pool.filter((r) => {
      const key = `${r.kind}-${r.path}-${r.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return canAccessRoute(role, r.path.split('?')[0]);
    });

    if (activeProject) {

      const scoped = pool.filter(

        (r) =>

          (r.kind === 'project' && r.id === `proj-${activeProject.id}`) ||

          r.sublabel?.toLowerCase().includes(activeProject.code.toLowerCase()) ||

          r.sublabel?.toLowerCase().includes(activeProject.name.toLowerCase()) ||

          r.path.includes(activeProject.id),

      );

      if (scoped.length > 0) pool = scoped;

    }

    if (!q) return pool.slice(0, 12);

    return pool.filter(

      (r) =>

        r.label.toLowerCase().includes(q) ||

        r.sublabel?.toLowerCase().includes(q) ||

        r.group.toLowerCase().includes(q),

    ).slice(0, 20);

  })();



  const grouped = (() => {

    const map = new Map<string, SearchResult[]>();

    for (const r of filtered) {

      const list = map.get(r.group) ?? [];

      list.push(r);

      map.set(r.group, list);

    }

    return Array.from(map.entries());

  })();



  return { grouped, loading: !loaded || apiLoading };

}

