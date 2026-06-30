import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField, FormActions } from '@/components/ui/FormField';
import { moduleApi } from '@/api/client';
import { cn, formatDate } from '@/lib/utils';

const SUBS = ['dashboard', 'active', 'pending', 'high-risk', 'history', 'approvals'] as const;
const PERMIT_TYPES = [
  'hot_work', 'work_at_height', 'confined_space', 'excavation', 'electrical_loto',
  'crane_lift', 'heavy_equipment', 'road_closure', 'chemical_handling', 'pressure_testing', 'general',
];

type PermitDashboard = {
  kpis: Record<string, number>;
  pendingApprovals: Array<Record<string, unknown>>;
  activePermits: Array<Record<string, unknown>>;
};

export function WorkforcePermitsTab({ projectId }: { projectId?: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sub = (searchParams.get('sub') as (typeof SUBS)[number]) || 'dashboard';
  const selectedId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<PermitDashboard | null>(null);
  const [permits, setPermits] = useState<Array<Record<string, unknown>>>([]);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [modal, setModal] = useState<'create' | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    permitType: 'general',
    projectId: projectId || '',
    siteId: '',
    workArea: '',
    description: '',
    startAt: new Date().toISOString().slice(0, 16),
    endAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    riskLevel: 'medium',
    requiresPmApproval: false,
    hazardDesc: '',
    hazardMitigation: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, list] = await Promise.all([
        moduleApi.workforce.permits.dashboard(projectId),
        moduleApi.workforce.permits.list(projectId),
      ]);
      setDashboard(dash.data);
      setPermits(list.data);
      if (selectedId) {
        const d = await moduleApi.workforce.permits.get(selectedId);
        setDetail(d.data);
      } else {
        setDetail(null);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedId]);

  useEffect(() => { load(); }, [load]);

  const setSub = (s: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'permits');
    next.set('sub', s);
    next.delete('id');
    setSearchParams(next);
  };

  const openDetail = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'permits');
    next.set('id', id);
    setSearchParams(next);
  };

  const submit = async (fn: () => Promise<unknown>) => {
    setSaving(true);
    try {
      await fn();
      setModal(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const act = (id: string, action: 'submit' | 'review' | 'approve' | 'reject' | 'start' | 'suspend' | 'complete' | 'close', comment?: string) =>
    moduleApi.workforce.permits[action](id, comment ? { comment } : {}).then(load);

  const filtered = () => {
    if (sub === 'active') return permits.filter((p) => p.status === 'active' || p.status === 'suspended');
    if (sub === 'pending') return permits.filter((p) =>
      ['submitted', 'safety_review', 'supervisor_approval', 'pm_approval'].includes(String(p.status)));
    if (sub === 'high-risk') return permits.filter((p) => p.riskLevel === 'high');
    if (sub === 'history') return permits.filter((p) => ['closed', 'archived', 'completed'].includes(String(p.status)));
    if (sub === 'approvals') return permits.filter((p) =>
      ['submitted', 'safety_review', 'supervisor_approval', 'pm_approval'].includes(String(p.status)));
    return permits;
  };

  const k = dashboard?.kpis;

  if (loading && !dashboard) {
    return <p className="text-sm text-slate-500 py-8 text-center">Loading permits…</p>;
  }

  if (detail) {
    const timeline = (detail.timeline as Array<Record<string, unknown>>) || [];
    const hazards = (detail.hazards as Array<Record<string, unknown>>) || [];
    const status = String(detail.status);
    const id = String(detail.id);

    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setSub(sub)} className="text-xs text-sky-400 hover:underline">← Back to list</button>
        <div className="command-card p-4">
          <div className="flex flex-wrap justify-between gap-2 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{String(detail.permitNumber)}</h3>
              <p className="text-xs text-slate-500 capitalize">{String(detail.permitType).replace(/_/g, ' ')} · {status.replace(/_/g, ' ')}</p>
            </div>
            <span className={cn('rounded px-2 py-1 text-[10px] uppercase font-semibold',
              detail.riskLevel === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-slate-500/20 text-slate-300')}>
              {String(detail.riskLevel)} risk
            </span>
          </div>
          <p className="text-sm text-slate-300 mb-4">{String(detail.description)}</p>
          <dl className="grid gap-2 sm:grid-cols-2 text-xs text-slate-400">
            <div><dt className="text-slate-500">Work area</dt><dd className="text-slate-200">{String(detail.workArea || '—')}</dd></div>
            <div><dt className="text-slate-500">Applicant</dt><dd className="text-slate-200">{String(detail.applicantName || '—')}</dd></div>
            <div><dt className="text-slate-500">Start</dt><dd className="text-slate-200">{formatDate(String(detail.startAt))}</dd></div>
            <div><dt className="text-slate-500">End</dt><dd className="text-slate-200">{formatDate(String(detail.endAt))}</dd></div>
          </dl>

          {hazards.length > 0 && (
            <div className="mt-4 border-t border-white/5 pt-4">
              <h4 className="text-xs font-semibold text-white mb-2">Risk assessment</h4>
              {hazards.map((h, i) => (
                <div key={i} className="text-xs text-slate-400 mb-2">
                  <p className="text-slate-300">{String(h.description)}</p>
                  {h.mitigation ? <p className="text-slate-500">Mitigation: {String(h.mitigation)}</p> : null}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {status === 'draft' && <button type="button" onClick={() => act(id, 'submit')} className="btn-accent text-xs">Submit</button>}
            {status === 'submitted' && <button type="button" onClick={() => act(id, 'review')} className="btn-accent text-xs">Safety review</button>}
            {['supervisor_approval', 'pm_approval', 'safety_review'].includes(status) && (
              <>
                <button type="button" onClick={() => act(id, 'approve')} className="btn-accent text-xs">Approve</button>
                <button type="button" onClick={() => act(id, 'reject')} className="btn-ghost text-xs text-red-400">Reject</button>
              </>
            )}
            {status === 'active' && !detail.workStarted && (
              <button type="button" onClick={() => act(id, 'start')} className="btn-accent text-xs">Start work</button>
            )}
            {status === 'active' && <button type="button" onClick={() => act(id, 'suspend')} className="btn-ghost text-xs">Suspend</button>}
            {(status === 'active' || status === 'suspended') && (
              <button type="button" onClick={() => act(id, 'complete')} className="btn-accent text-xs">Complete</button>
            )}
            {status === 'completed' && <button type="button" onClick={() => act(id, 'close')} className="btn-accent text-xs">Close</button>}
          </div>
        </div>

        <div className="command-card p-4">
          <h4 className="text-xs font-semibold text-white mb-3 flex items-center gap-2"><FileText size={12} /> Approval & audit timeline</h4>
          <ul className="space-y-2 text-xs text-slate-400">
            {timeline.map((t, i) => (
              <li key={i} className="flex justify-between">
                <span>{String(t.action)} {t.fromStatus ? `(${String(t.fromStatus)} → ${String(t.toStatus)})` : ''}</span>
                <span>{t.at ? formatDate(String(t.at)) : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SUBS.map((s) => (
          <button key={s} type="button" onClick={() => setSub(s)} className={cn(
            'rounded-lg px-3 py-1.5 text-xs capitalize',
            sub === s ? 'bg-violet-500/20 text-violet-300' : 'bg-white/5 text-slate-400 hover:text-white',
          )}>{s.replace('-', ' ')}</button>
        ))}
        <button type="button" onClick={() => setModal('create')} className="btn-accent ml-auto text-xs flex items-center gap-1">
          <Plus size={12} /> Create permit
        </button>
      </div>

      {sub === 'dashboard' && dashboard && (
        <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-4">
          {[
            { label: 'Active', value: k?.activePermits ?? 0, color: 'text-emerald-400' },
            { label: 'Pending', value: k?.pendingApproval ?? 0, color: 'text-amber-400' },
            { label: 'High Risk', value: k?.highRiskPermits ?? 0, color: 'text-red-400' },
            { label: 'Expired', value: k?.expiredPermits ?? 0, color: 'text-red-400' },
            { label: 'Hot Work', value: k?.hotWork ?? 0, color: 'text-orange-400' },
            { label: 'Height Work', value: k?.heightWork ?? 0, color: 'text-sky-400' },
            { label: 'Excavation', value: k?.excavation ?? 0, color: 'text-amber-400' },
            { label: 'Closed Today', value: k?.closedToday ?? 0, color: 'text-slate-300' },
          ].map((item) => (
            <div key={item.label} className="command-card px-4 py-3">
              <p className="text-[9px] uppercase tracking-wider text-slate-500">{item.label}</p>
              <p className={cn('mt-1 font-mono text-xl font-bold', item.color)}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <PermitTable
        rows={filtered().map((p) => [
          String(p.permitNumber),
          String(p.permitType).replace(/_/g, ' '),
          String(p.riskLevel),
          String(p.status).replace(/_/g, ' '),
          formatDate(String(p.startAt)),
        ])}
        onRowClick={(i) => openDetail(String(filtered()[i].id))}
      />

      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Create permit">
        <form onSubmit={(e) => {
          e.preventDefault();
          submit(() => moduleApi.workforce.permits.create({
            permitType: form.permitType,
            projectId: form.projectId,
            siteId: form.siteId || undefined,
            workArea: form.workArea,
            description: form.description,
            startAt: form.startAt,
            endAt: form.endAt,
            riskLevel: form.riskLevel,
            requiresPmApproval: form.requiresPmApproval,
            hazards: form.hazardDesc ? [{ description: form.hazardDesc, mitigation: form.hazardMitigation }] : [],
          }));
        }} className="space-y-3">
          <SelectField label="Permit type" value={form.permitType} onChange={(e) => setForm({ ...form, permitType: e.target.value })}>
            {PERMIT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </SelectField>
          <TextField label="Project ID" required value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} />
          <TextField label="Work area" value={form.workArea} onChange={(e) => setForm({ ...form, workArea: e.target.value })} />
          <TextField label="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <TextField label="Start" type="datetime-local" required value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
          <TextField label="End" type="datetime-local" required value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
          <TextField label="Hazard" value={form.hazardDesc} onChange={(e) => setForm({ ...form, hazardDesc: e.target.value })} />
          <TextField label="Mitigation" value={form.hazardMitigation} onChange={(e) => setForm({ ...form, hazardMitigation: e.target.value })} />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.requiresPmApproval} onChange={(e) => setForm({ ...form, requiresPmApproval: e.target.checked })} />
            Requires PM approval
          </label>
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Create draft" />
        </form>
      </Modal>
    </div>
  );
}

function PermitTable({ rows, onRowClick }: { rows: string[][]; onRowClick: (index: number) => void }) {
  const cols = ['Permit #', 'Type', 'Risk', 'Status', 'Start'];
  return (
    <div className="command-card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
            {cols.map((c) => <th key={c} className="px-4 py-3">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No permits</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} onClick={() => onRowClick(i)} className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer">
              {row.map((cell, j) => <td key={j} className="px-4 py-3 text-slate-300">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
