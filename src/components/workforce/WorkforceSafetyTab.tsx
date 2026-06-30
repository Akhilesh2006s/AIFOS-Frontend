import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, HardHat, Plus, Shield, Wrench } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField, FormActions } from '@/components/ui/FormField';
import { moduleApi } from '@/api/client';
import { cn, formatDate } from '@/lib/utils';

const SUBS = ['overview', 'ppe', 'toolbox', 'incidents', 'near-miss', 'observations', 'emergency'] as const;
const PPE_TYPES = ['helmet', 'safety_shoes', 'reflective_jacket', 'gloves', 'goggles', 'harness', 'ear_protection', 'respirator'];

type SafetyDashboard = {
  kpis: Record<string, number>;
  criticalIncidents: Array<Record<string, unknown>>;
  todaysToolboxTalks: Array<Record<string, unknown>>;
  openObservations: Array<Record<string, unknown>>;
};

export function WorkforceSafetyTab({ projectId }: { projectId?: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sub = (searchParams.get('sub') as (typeof SUBS)[number]) || 'overview';

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<SafetyDashboard | null>(null);
  const [ppe, setPpe] = useState<Array<Record<string, unknown>>>([]);
  const [toolbox, setToolbox] = useState<Array<Record<string, unknown>>>([]);
  const [incidents, setIncidents] = useState<Array<Record<string, unknown>>>([]);
  const [nearMiss, setNearMiss] = useState<Array<Record<string, unknown>>>([]);
  const [observations, setObservations] = useState<Array<Record<string, unknown>>>([]);
  const [emergency, setEmergency] = useState<Record<string, unknown> | null>(null);

  const [modal, setModal] = useState<'ppe' | 'toolbox' | 'incident' | 'nearmiss' | 'observation' | null>(null);
  const [saving, setSaving] = useState(false);

  const [ppeForm, setPpeForm] = useState({ ppeType: 'helmet', employeeId: '', projectId: projectId || '', siteId: '' });
  const [toolboxForm, setToolboxForm] = useState({
    topic: '', instructor: '', projectId: projectId || '', talkDate: new Date().toISOString().slice(0, 10), status: 'scheduled',
  });
  const [incidentForm, setIncidentForm] = useState({
    category: '', severity: 'medium', projectId: projectId || '', description: '', employeeId: '',
  });
  const [nearMissForm, setNearMissForm] = useState({ projectId: projectId || '', description: '', riskLevel: 'medium' });
  const [obsForm, setObsForm] = useState({ observationType: 'unsafe_condition', projectId: projectId || '', description: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, p, tb, inc, nm, obs] = await Promise.all([
        moduleApi.workforce.safety.dashboard(projectId),
        moduleApi.workforce.safety.ppe(projectId),
        moduleApi.workforce.safety.toolboxTalks(projectId),
        moduleApi.workforce.safety.incidents(projectId),
        moduleApi.workforce.safety.nearMiss(projectId),
        moduleApi.workforce.safety.observations(projectId),
      ]);
      setDashboard(dash.data);
      setPpe(p.data);
      setToolbox(tb.data);
      setIncidents(inc.data);
      setNearMiss(nm.data);
      setObservations(obs.data);
      if (projectId) {
        const em = await moduleApi.workforce.safety.emergency(projectId);
        setEmergency(em.data);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const setSub = (s: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'safety');
    next.set('sub', s);
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

  const k = dashboard?.kpis;

  if (loading && !dashboard) {
    return <p className="text-sm text-slate-500 py-8 text-center">Loading safety data…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SUBS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSub(s)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs capitalize',
              sub === s ? 'bg-red-500/20 text-red-300' : 'bg-white/5 text-slate-400 hover:text-white',
            )}
          >
            {s.replace('-', ' ')}
          </button>
        ))}
      </div>

      {sub === 'overview' && dashboard && (
        <>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: 'Active Incidents', value: k?.activeIncidents ?? 0, color: 'text-red-400' },
              { label: 'Near Miss', value: k?.openNearMiss ?? 0, color: 'text-amber-400' },
              { label: 'Observations', value: k?.openObservations ?? 0, color: 'text-sky-400' },
              { label: 'PPE Compliance', value: `${k?.ppeCompliance ?? 0}%`, color: 'text-emerald-400' },
              { label: 'Safety Score', value: k?.safetyScore ?? 0, color: (k?.safetyScore ?? 100) < 70 ? 'text-red-400' : 'text-emerald-400' },
              { label: 'Toolbox Today', value: k?.toolboxTalksToday ?? 0, color: 'text-violet-400' },
              { label: 'Days Safe', value: k?.daysWithoutIncident ?? 0, color: 'text-emerald-400' },
              { label: 'Expired PPE', value: k?.expiredPpe ?? 0, color: 'text-red-400' },
            ].map((item) => (
              <div key={item.label} className="command-card px-4 py-3">
                <p className="text-[9px] uppercase tracking-wider text-slate-500">{item.label}</p>
                <p className={cn('mt-1 font-mono text-xl font-bold', item.color)}>{item.value}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="command-card p-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-red-400" /> Critical incidents
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {dashboard.criticalIncidents.map((i) => (
                  <li key={String(i.id)}>{String(i.incidentId)} — {String(i.description).slice(0, 60)}</li>
                ))}
              </ul>
            </div>
            <div className="command-card p-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <Shield size={14} /> Today&apos;s toolbox talks
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {dashboard.todaysToolboxTalks.map((t) => (
                  <li key={String(t.id)}>{String(t.topic)} — {String(t.instructor)}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => setModal('ppe')} className="command-card p-4 text-left hover:border-white/20">
              <HardHat size={18} className="text-amber-400 mb-2" /><p className="text-sm font-medium text-white">Issue PPE</p>
            </button>
            <button type="button" onClick={() => setModal('toolbox')} className="command-card p-4 text-left hover:border-white/20">
              <Shield size={18} className="text-sky-400 mb-2" /><p className="text-sm font-medium text-white">Toolbox talk</p>
            </button>
            <button type="button" onClick={() => setModal('incident')} className="command-card p-4 text-left hover:border-white/20">
              <AlertTriangle size={18} className="text-red-400 mb-2" /><p className="text-sm font-medium text-white">Report incident</p>
            </button>
          </div>
        </>
      )}

      {sub === 'ppe' && (
        <div className="space-y-4">
          <button type="button" onClick={() => setModal('ppe')} className="btn-accent text-xs flex items-center gap-1"><Plus size={12} /> Issue PPE</button>
          <SafetyTable
            columns={['Type', 'Employee', 'Status', 'Issued', 'Expiry']}
            rows={ppe.map((p) => [
              String(p.ppeType), String(p.employeeName || '—'), String(p.status),
              p.issuedAt ? formatDate(String(p.issuedAt)) : '—',
              p.expiryDate ? formatDate(String(p.expiryDate)) : '—',
            ])}
            actions={ppe.filter((p) => p.status === 'issued').map((p) => ({
              label: 'Return',
              onClick: () => moduleApi.workforce.safety.returnPpe(String(p.id), {}).then(load),
            }))}
          />
        </div>
      )}

      {sub === 'toolbox' && (
        <div className="space-y-4">
          <button type="button" onClick={() => setModal('toolbox')} className="btn-accent text-xs flex items-center gap-1"><Plus size={12} /> Schedule talk</button>
          <SafetyTable
            columns={['Topic', 'Instructor', 'Date', 'Status', 'Attendees']}
            rows={toolbox.map((t) => [
              String(t.topic), String(t.instructor), formatDate(String(t.talkDate)), String(t.status),
              String((t.attendees as unknown[])?.length ?? 0),
            ])}
          />
        </div>
      )}

      {sub === 'incidents' && (
        <div className="space-y-4">
          <button type="button" onClick={() => setModal('incident')} className="btn-accent text-xs flex items-center gap-1"><Plus size={12} /> Report incident</button>
          <SafetyTable
            columns={['ID', 'Category', 'Severity', 'Status', 'Description']}
            rows={incidents.map((i) => [
              String(i.incidentId), String(i.category), String(i.severity), String(i.status),
              String(i.description).slice(0, 50),
            ])}
          />
        </div>
      )}

      {sub === 'near-miss' && (
        <div className="space-y-4">
          <button type="button" onClick={() => setModal('nearmiss')} className="btn-accent text-xs flex items-center gap-1"><Plus size={12} /> Report near miss</button>
          <SafetyTable
            columns={['ID', 'Risk', 'Status', 'Description']}
            rows={nearMiss.map((n) => [
              String(n.nearMissId), String(n.riskLevel), String(n.status), String(n.description).slice(0, 60),
            ])}
          />
        </div>
      )}

      {sub === 'observations' && (
        <div className="space-y-4">
          <button type="button" onClick={() => setModal('observation')} className="btn-accent text-xs flex items-center gap-1"><Plus size={12} /> New observation</button>
          <SafetyTable
            columns={['Type', 'Description', 'Status', 'Verified']}
            rows={observations.map((o) => [
              String(o.observationType), String(o.description).slice(0, 50), String(o.status), o.verified ? 'Yes' : 'No',
            ])}
          />
        </div>
      )}

      {sub === 'emergency' && emergency && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="command-card p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Wrench size={14} /> Emergency contacts</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              {((emergency.contacts as Array<{ name: string; phone: string; role?: string }>) || []).map((c, i) => (
                <li key={i}>{c.name} {c.role ? `(${c.role})` : ''} — {c.phone}</li>
              ))}
            </ul>
          </div>
          <div className="command-card p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Assembly points</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              {((emergency.assemblyPoints as Array<{ name: string; location?: string }>) || []).map((a, i) => (
                <li key={i}>{a.name} — {a.location || '—'}</li>
              ))}
            </ul>
          </div>
          <div className="command-card p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-3">Emergency equipment</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              {((emergency.emergencyEquipment as Array<{ type: string; location?: string; status: string }>) || []).map((e, i) => (
                <li key={i} className="capitalize">{e.type.replace(/_/g, ' ')} @ {e.location} — {e.status}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!projectId && sub === 'emergency' && (
        <p className="text-sm text-slate-500 text-center py-8">Select a project to view emergency plans.</p>
      )}

      <Modal open={modal === 'ppe'} onClose={() => setModal(null)} title="Issue PPE">
        <form onSubmit={(e) => { e.preventDefault(); submit(() => moduleApi.workforce.safety.issuePpe(ppeForm)); }} className="space-y-3">
          <SelectField label="PPE type" value={ppeForm.ppeType} onChange={(e) => setPpeForm({ ...ppeForm, ppeType: e.target.value })}>
            {PPE_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </SelectField>
          <TextField label="Employee ID" required value={ppeForm.employeeId} onChange={(e) => setPpeForm({ ...ppeForm, employeeId: e.target.value })} />
          <TextField label="Project ID" required value={ppeForm.projectId} onChange={(e) => setPpeForm({ ...ppeForm, projectId: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Issue" />
        </form>
      </Modal>

      <Modal open={modal === 'toolbox'} onClose={() => setModal(null)} title="Toolbox talk">
        <form onSubmit={(e) => { e.preventDefault(); submit(() => moduleApi.workforce.safety.createToolboxTalk(toolboxForm)); }} className="space-y-3">
          <TextField label="Topic" required value={toolboxForm.topic} onChange={(e) => setToolboxForm({ ...toolboxForm, topic: e.target.value })} />
          <TextField label="Instructor" required value={toolboxForm.instructor} onChange={(e) => setToolboxForm({ ...toolboxForm, instructor: e.target.value })} />
          <TextField label="Date" type="date" required value={toolboxForm.talkDate} onChange={(e) => setToolboxForm({ ...toolboxForm, talkDate: e.target.value })} />
          <TextField label="Project ID" required value={toolboxForm.projectId} onChange={(e) => setToolboxForm({ ...toolboxForm, projectId: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Create" />
        </form>
      </Modal>

      <Modal open={modal === 'incident'} onClose={() => setModal(null)} title="Safety incident">
        <form onSubmit={(e) => { e.preventDefault(); submit(() => moduleApi.workforce.safety.createIncident(incidentForm)); }} className="space-y-3">
          <TextField label="Category" required value={incidentForm.category} onChange={(e) => setIncidentForm({ ...incidentForm, category: e.target.value })} />
          <SelectField label="Severity" value={incidentForm.severity} onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}>
            {['low', 'medium', 'high', 'critical'].map((s) => <option key={s} value={s}>{s}</option>)}
          </SelectField>
          <TextField label="Description" required value={incidentForm.description} onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })} />
          <TextField label="Project ID" required value={incidentForm.projectId} onChange={(e) => setIncidentForm({ ...incidentForm, projectId: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Report" />
        </form>
      </Modal>

      <Modal open={modal === 'nearmiss'} onClose={() => setModal(null)} title="Near miss">
        <form onSubmit={(e) => { e.preventDefault(); submit(() => moduleApi.workforce.safety.createNearMiss(nearMissForm)); }} className="space-y-3">
          <TextField label="Description" required value={nearMissForm.description} onChange={(e) => setNearMissForm({ ...nearMissForm, description: e.target.value })} />
          <TextField label="Project ID" required value={nearMissForm.projectId} onChange={(e) => setNearMissForm({ ...nearMissForm, projectId: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Submit" />
        </form>
      </Modal>

      <Modal open={modal === 'observation'} onClose={() => setModal(null)} title="Safety observation">
        <form onSubmit={(e) => { e.preventDefault(); submit(() => moduleApi.workforce.safety.createObservation(obsForm)); }} className="space-y-3">
          <SelectField label="Type" value={obsForm.observationType} onChange={(e) => setObsForm({ ...obsForm, observationType: e.target.value })}>
            <option value="unsafe_act">Unsafe act</option>
            <option value="unsafe_condition">Unsafe condition</option>
            <option value="positive">Positive</option>
          </SelectField>
          <TextField label="Description" required value={obsForm.description} onChange={(e) => setObsForm({ ...obsForm, description: e.target.value })} />
          <TextField label="Project ID" required value={obsForm.projectId} onChange={(e) => setObsForm({ ...obsForm, projectId: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Submit" />
        </form>
      </Modal>
    </div>
  );
}

function SafetyTable({
  columns, rows, actions,
}: {
  columns: string[];
  rows: string[][];
  actions?: Array<{ label: string; onClick: () => void }>;
}) {
  return (
    <div className="command-card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
            {columns.map((c) => <th key={c} className="px-4 py-3">{c}</th>)}
            {actions?.length ? <th className="px-4 py-3" /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-500">No records</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
              {row.map((cell, j) => <td key={j} className="px-4 py-3 text-slate-300">{cell}</td>)}
              {actions?.[i] && (
                <td className="px-4 py-3">
                  <button type="button" onClick={actions[i].onClick} className="text-xs text-sky-400 hover:underline">{actions[i].label}</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
