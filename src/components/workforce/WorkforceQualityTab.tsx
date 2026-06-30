import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardCheck, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField, TextAreaField, FormActions } from '@/components/ui/FormField';
import { moduleApi } from '@/api/client';
import { cn, formatDate } from '@/lib/utils';

const SUBS = ['dashboard', 'inspections', 'tests', 'checklists', 'ncr', 'capa', 'reports'] as const;

const INSPECTION_TYPES = ['incoming_material', 'work_inspection', 'final_inspection', 'site_inspection', 'equipment_inspection'];
const TEST_TYPES = ['concrete_cube', 'slump', 'steel', 'soil', 'aggregate', 'water', 'asphalt'];
const CHECKLIST_CATS = ['foundation', 'concrete_pour', 'steel_reinforcement', 'road_layer', 'asphalt', 'electrical', 'plumbing'];
const NCR_SEVERITIES = ['low', 'medium', 'high', 'critical'];
const CAPA_TYPES = ['corrective', 'preventive'];

type QualityDashboard = {
  kpis: Record<string, number>;
  openNcrs: Array<Record<string, unknown>>;
  pendingCapas: Array<Record<string, unknown>>;
};

export function WorkforceQualityTab({ projectId }: { projectId?: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const sub = (searchParams.get('sub') as (typeof SUBS)[number]) || 'dashboard';
  const selectedId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<QualityDashboard | null>(null);
  const [inspections, setInspections] = useState<Array<Record<string, unknown>>>([]);
  const [tests, setTests] = useState<Array<Record<string, unknown>>>([]);
  const [checklists, setChecklists] = useState<Array<Record<string, unknown>>>([]);
  const [ncrs, setNcrs] = useState<Array<Record<string, unknown>>>([]);
  const [capas, setCapas] = useState<Array<Record<string, unknown>>>([]);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [modal, setModal] = useState<'inspection' | 'test' | 'checklist' | 'ncr' | 'capa' | null>(null);
  const [saving, setSaving] = useState(false);

  const [inspForm, setInspForm] = useState({
    inspectionType: 'work_inspection',
    projectId: projectId || '',
    siteId: '',
    inspectorName: '',
    checklistTemplateId: '',
    remarks: '',
  });
  const [testForm, setTestForm] = useState({
    testType: 'concrete_cube',
    projectId: projectId || '',
    siteId: '',
    testDate: new Date().toISOString().slice(0, 10),
    laboratory: '',
    result: 'pending',
    resultDetails: '',
  });
  const [checklistForm, setChecklistForm] = useState({ name: '', category: 'foundation', description: '', itemLabels: '' });
  const [ncrForm, setNcrForm] = useState({
    projectId: projectId || '',
    siteId: '',
    title: '',
    description: '',
    severity: 'medium',
    assignedTo: '',
  });
  const [capaForm, setCapaForm] = useState({
    capaType: 'corrective',
    projectId: projectId || '',
    title: '',
    description: '',
    owner: '',
    dueDate: '',
    ncrId: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, insp, tst, chk, ncrList, capaList] = await Promise.all([
        moduleApi.workforce.quality.dashboard(projectId),
        moduleApi.workforce.quality.inspections(projectId),
        moduleApi.workforce.quality.tests(projectId),
        moduleApi.workforce.quality.checklists(projectId),
        moduleApi.workforce.quality.ncr(projectId),
        moduleApi.workforce.quality.capa(projectId),
      ]);
      setDashboard(dash.data);
      setInspections(insp.data);
      setTests(tst.data);
      setChecklists(chk.data);
      setNcrs(ncrList.data);
      setCapas(capaList.data);

      if (selectedId) {
        if (sub === 'inspections') {
          const d = await moduleApi.workforce.quality.getInspection(selectedId);
          setDetail(d.data);
        } else if (sub === 'tests') {
          const d = await moduleApi.workforce.quality.getTest(selectedId);
          setDetail(d.data);
        } else if (sub === 'ncr') {
          const d = await moduleApi.workforce.quality.getNcr(selectedId);
          setDetail(d.data);
        } else if (sub === 'capa') {
          const d = await moduleApi.workforce.quality.getCapa(selectedId);
          setDetail(d.data);
        } else {
          setDetail(null);
        }
      } else {
        setDetail(null);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedId, sub]);

  useEffect(() => { load(); }, [load]);

  const setSub = (s: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'quality');
    next.set('sub', s);
    next.delete('id');
    setSearchParams(next);
  };

  const openDetail = (s: string, id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'quality');
    next.set('sub', s);
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

  const k = dashboard?.kpis;

  const statusBadge = (status: string) => {
    const s = status.replace(/_/g, ' ');
    const cls = status === 'passed' || status === 'pass' || status === 'closed'
      ? 'bg-emerald-500/20 text-emerald-300'
      : status === 'failed' || status === 'fail' || status === 'critical'
        ? 'bg-red-500/20 text-red-300'
        : 'bg-amber-500/20 text-amber-300';
    return <span className={cn('rounded px-2 py-0.5 text-[10px] uppercase font-semibold', cls)}>{s}</span>;
  };

  if (loading && !dashboard) {
    return <p className="text-sm text-slate-500 py-8 text-center">Loading quality…</p>;
  }

  // ─── Detail views ──────────────────────────────────────────────────────────

  if (detail && sub === 'inspections') {
    const checklist = (detail.checklist as Array<Record<string, unknown>>) || [];
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setSub(sub)} className="text-xs text-sky-400 hover:underline">← Back</button>
        <div className="command-card p-4">
          <div className="flex justify-between gap-2 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{String(detail.inspectionNumber)}</h3>
              <p className="text-xs text-slate-500 capitalize">{String(detail.inspectionType).replace(/_/g, ' ')}</p>
            </div>
            {statusBadge(String(detail.status))}
          </div>
          <p className="text-sm text-slate-400 mb-4">Inspector: {String(detail.inspectorName || '—')}</p>
          {checklist.length > 0 && (
            <div className="border-t border-white/5 pt-4 space-y-2">
              <h4 className="text-xs font-semibold text-white mb-2">Checklist</h4>
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                  <span className="text-slate-300">{String(item.label)}</span>
                  <div className="flex gap-2">
                    {(['pass', 'fail', 'na'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          const updated = checklist.map((c, j) => j === i ? { ...c, result: r } : c);
                          moduleApi.workforce.quality.updateInspection(String(detail.id), { checklist: updated }).then(load);
                        }}
                        className={cn('px-2 py-0.5 rounded text-[10px] uppercase',
                          item.result === r ? (r === 'pass' ? 'bg-emerald-600 text-white' : r === 'fail' ? 'bg-red-600 text-white' : 'bg-slate-600 text-white') : 'bg-white/5 text-slate-400')}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {String(detail.status) === 'failed' && (
            <button
              type="button"
              className="mt-4 text-xs bg-red-600/20 text-red-300 px-3 py-1.5 rounded"
              onClick={() => setModal('ncr')}
            >
              Raise NCR
            </button>
          )}
        </div>
      </div>
    );
  }

  if (detail && sub === 'ncr') {
    const timeline = (detail.timeline as Array<Record<string, unknown>>) || [];
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setSub(sub)} className="text-xs text-sky-400 hover:underline">← Back</button>
        <div className="command-card p-4">
          <div className="flex justify-between gap-2 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">{String(detail.ncrNumber)}</h3>
              <p className="text-sm text-slate-300">{String(detail.title)}</p>
            </div>
            {statusBadge(String(detail.severity))}
          </div>
          <p className="text-sm text-slate-400 mb-4">{String(detail.description)}</p>
          <dl className="grid gap-2 sm:grid-cols-2 text-xs text-slate-400 mb-4">
            <div><dt className="text-slate-500">Status</dt><dd className="text-slate-200 capitalize">{String(detail.status).replace(/_/g, ' ')}</dd></div>
            <div><dt className="text-slate-500">Assigned</dt><dd className="text-slate-200">{String(detail.assignedTo || '—')}</dd></div>
            <div><dt className="text-slate-500">Root cause</dt><dd className="text-slate-200">{String(detail.rootCause || '—')}</dd></div>
            <div><dt className="text-slate-500">Corrective action</dt><dd className="text-slate-200">{String(detail.correctiveAction || '—')}</dd></div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="text-xs bg-sky-600/20 text-sky-300 px-3 py-1.5 rounded"
              onClick={() => moduleApi.workforce.quality.updateNcr(String(detail.id), { verified: true, verificationNotes: 'Verified on site' }).then(load)}>
              Verify
            </button>
            <button type="button" className="text-xs bg-emerald-600/20 text-emerald-300 px-3 py-1.5 rounded"
              onClick={() => moduleApi.workforce.quality.closeNcr(String(detail.id)).then(load)}>
              Close NCR
            </button>
            <button type="button" className="text-xs bg-violet-600/20 text-violet-300 px-3 py-1.5 rounded"
              onClick={() => { setCapaForm((f) => ({ ...f, ncrId: String(detail.id), title: `CAPA for ${detail.ncrNumber}` })); setModal('capa'); }}>
              Assign CAPA
            </button>
          </div>
          {timeline.length > 0 && (
            <div className="mt-4 border-t border-white/5 pt-4">
              <h4 className="text-xs font-semibold text-white mb-2">Timeline</h4>
              {timeline.map((t, i) => (
                <p key={i} className="text-xs text-slate-500">{formatDate(String(t.at))} — {String(t.action)}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (detail && (sub === 'tests' || sub === 'capa')) {
    const title = sub === 'tests' ? String(detail.testNumber) : String(detail.capaNumber);
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setSub(sub)} className="text-xs text-sky-400 hover:underline">← Back</button>
        <div className="command-card p-4">
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <pre className="text-xs text-slate-400 whitespace-pre-wrap">{JSON.stringify(detail, null, 2)}</pre>
        </div>
      </div>
    );
  }

  // ─── Main layout ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-white/5 pb-2">
        {SUBS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSub(s)}
            className={cn('px-3 py-1.5 text-xs rounded capitalize', sub === s ? 'bg-sky-600/30 text-sky-200' : 'text-slate-400 hover:text-white')}
          >
            {s === 'ncr' ? 'NCR' : s === 'capa' ? 'CAPA' : s.replace(/-/g, ' ')}
          </button>
        ))}
      </div>

      {sub === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {[
              { label: 'Open NCR', value: k?.openNcr ?? 0, color: 'text-red-400' },
              { label: 'Pass %', value: `${k?.inspectionPassPercent ?? 0}%`, color: 'text-emerald-400' },
              { label: 'Pending Tests', value: k?.pendingTests ?? 0, color: 'text-amber-400' },
              { label: 'Material Score', value: k?.materialQualityScore ?? 0, color: 'text-sky-400' },
              { label: 'Project Score', value: k?.projectQualityScore ?? 0, color: (k?.projectQualityScore ?? 100) < 70 ? 'text-red-400' : 'text-emerald-400' },
              { label: 'CAPA Pending', value: k?.capaPending ?? 0, color: 'text-violet-400' },
              { label: 'Fail %', value: `${k?.inspectionFailPercent ?? 0}%`, color: 'text-red-300' },
              { label: 'Closed NCR', value: k?.closedNcr ?? 0, color: 'text-slate-300' },
            ].map((item) => (
              <div key={item.label} className="command-card p-3">
                <p className="text-[10px] text-slate-500 uppercase">{item.label}</p>
                <p className={cn('text-xl font-semibold', item.color)}>{item.value}</p>
              </div>
            ))}
          </div>
          {(dashboard?.openNcrs?.length ?? 0) > 0 && (
            <div className="command-card p-4">
              <h4 className="text-xs font-semibold text-white mb-2">Open NCRs</h4>
              {dashboard!.openNcrs.map((n) => (
                <button key={String(n.id)} type="button" onClick={() => openDetail('ncr', String(n.id))}
                  className="block w-full text-left text-xs py-2 border-b border-white/5 text-slate-300 hover:text-white">
                  {String(n.ncrNumber)} — {String(n.title)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {sub === 'inspections' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button type="button" onClick={() => setModal('inspection')} className="flex items-center gap-1 text-xs bg-sky-600 text-white px-3 py-1.5 rounded">
              <Plus className="w-3 h-3" /> New Inspection
            </button>
          </div>
          {inspections.map((i) => (
            <button key={String(i.id)} type="button" onClick={() => openDetail('inspections', String(i.id))}
              className="command-card p-3 w-full text-left hover:border-sky-500/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-white">{String(i.inspectionNumber)}</p>
                  <p className="text-xs text-slate-500 capitalize">{String(i.inspectionType).replace(/_/g, ' ')}</p>
                </div>
                {statusBadge(String(i.status))}
              </div>
            </button>
          ))}
        </div>
      )}

      {sub === 'tests' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button type="button" onClick={() => setModal('test')} className="flex items-center gap-1 text-xs bg-sky-600 text-white px-3 py-1.5 rounded">
              <Plus className="w-3 h-3" /> New Test
            </button>
          </div>
          {tests.map((t) => (
            <button key={String(t.id)} type="button" onClick={() => openDetail('tests', String(t.id))}
              className="command-card p-3 w-full text-left">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{String(t.testNumber)}</p>
                  <p className="text-xs text-slate-500 capitalize">{String(t.testType).replace(/_/g, ' ')} · {formatDate(String(t.testDate))}</p>
                </div>
                {statusBadge(String(t.result))}
              </div>
            </button>
          ))}
        </div>
      )}

      {sub === 'checklists' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button type="button" onClick={() => setModal('checklist')} className="flex items-center gap-1 text-xs bg-sky-600 text-white px-3 py-1.5 rounded">
              <Plus className="w-3 h-3" /> New Template
            </button>
          </div>
          {checklists.map((c) => (
            <div key={String(c.id)} className="command-card p-3">
              <p className="text-sm font-medium text-white">{String(c.name)}</p>
              <p className="text-xs text-slate-500 capitalize">{String(c.category).replace(/_/g, ' ')} · {(c.items as unknown[])?.length ?? 0} items</p>
            </div>
          ))}
        </div>
      )}

      {sub === 'ncr' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button type="button" onClick={() => setModal('ncr')} className="flex items-center gap-1 text-xs bg-red-600/80 text-white px-3 py-1.5 rounded">
              <Plus className="w-3 h-3" /> Raise NCR
            </button>
          </div>
          {ncrs.map((n) => (
            <button key={String(n.id)} type="button" onClick={() => openDetail('ncr', String(n.id))}
              className="command-card p-3 w-full text-left">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{String(n.ncrNumber)}</p>
                  <p className="text-xs text-slate-400">{String(n.title)}</p>
                </div>
                {statusBadge(String(n.status))}
              </div>
            </button>
          ))}
        </div>
      )}

      {sub === 'capa' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button type="button" onClick={() => setModal('capa')} className="flex items-center gap-1 text-xs bg-violet-600 text-white px-3 py-1.5 rounded">
              <Plus className="w-3 h-3" /> New CAPA
            </button>
          </div>
          {capas.map((c) => (
            <button key={String(c.id)} type="button" onClick={() => openDetail('capa', String(c.id))}
              className="command-card p-3 w-full text-left">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{String(c.capaNumber)}</p>
                  <p className="text-xs text-slate-400">{String(c.title)}</p>
                </div>
                {statusBadge(String(c.status))}
              </div>
            </button>
          ))}
        </div>
      )}

      {sub === 'reports' && (
        <div className="command-card p-6 text-center">
          <ClipboardCheck className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">Quality reports export via Insights → Quality Analytics</p>
          <a href="/insights?tab=quality" className="text-xs text-sky-400 hover:underline mt-2 inline-block">Open Quality Analytics</a>
        </div>
      )}

      <Modal open={modal === 'inspection'} onClose={() => setModal(null)} title="New Inspection">
        <form onSubmit={(e) => {
          e.preventDefault();
          submit(() => moduleApi.workforce.quality.createInspection({ ...inspForm, projectId: inspForm.projectId || projectId }));
        }} className="space-y-3">
          <SelectField label="Type" value={inspForm.inspectionType} onChange={(e) => setInspForm({ ...inspForm, inspectionType: e.target.value })}>
            {INSPECTION_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </SelectField>
          <SelectField label="Checklist template" value={inspForm.checklistTemplateId} onChange={(e) => setInspForm({ ...inspForm, checklistTemplateId: e.target.value })}>
            <option value="">— None —</option>
            {checklists.map((c) => <option key={String(c.id)} value={String(c.id)}>{String(c.name)}</option>)}
          </SelectField>
          <TextField label="Inspector" value={inspForm.inspectorName} onChange={(e) => setInspForm({ ...inspForm, inspectorName: e.target.value })} />
          <TextField label="Remarks" value={inspForm.remarks} onChange={(e) => setInspForm({ ...inspForm, remarks: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Create" />
        </form>
      </Modal>

      <Modal open={modal === 'test'} onClose={() => setModal(null)} title="Material Test">
        <form onSubmit={(e) => {
          e.preventDefault();
          submit(() => moduleApi.workforce.quality.createTest({ ...testForm, projectId: testForm.projectId || projectId }));
        }} className="space-y-3">
          <SelectField label="Test type" value={testForm.testType} onChange={(e) => setTestForm({ ...testForm, testType: e.target.value })}>
            {TEST_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </SelectField>
          <TextField label="Test date" type="date" value={testForm.testDate} onChange={(e) => setTestForm({ ...testForm, testDate: e.target.value })} />
          <TextField label="Laboratory" value={testForm.laboratory} onChange={(e) => setTestForm({ ...testForm, laboratory: e.target.value })} />
          <SelectField label="Result" value={testForm.result} onChange={(e) => setTestForm({ ...testForm, result: e.target.value })}>
            <option value="pending">Pending</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </SelectField>
          <TextField label="Details" value={testForm.resultDetails} onChange={(e) => setTestForm({ ...testForm, resultDetails: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Save test" />
        </form>
      </Modal>

      <Modal open={modal === 'checklist'} onClose={() => setModal(null)} title="Checklist Template">
        <form onSubmit={(e) => {
          e.preventDefault();
          submit(() => moduleApi.workforce.quality.createChecklist({
            name: checklistForm.name,
            category: checklistForm.category,
            description: checklistForm.description,
            projectId,
            items: checklistForm.itemLabels.split('\n').filter(Boolean).map((label) => ({ label, required: true })),
          }));
        }} className="space-y-3">
          <TextField label="Name" required value={checklistForm.name} onChange={(e) => setChecklistForm({ ...checklistForm, name: e.target.value })} />
          <SelectField label="Category" value={checklistForm.category} onChange={(e) => setChecklistForm({ ...checklistForm, category: e.target.value })}>
            {CHECKLIST_CATS.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </SelectField>
          <TextAreaField label="Items (one per line)" value={checklistForm.itemLabels} onChange={(e) => setChecklistForm({ ...checklistForm, itemLabels: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Create template" />
        </form>
      </Modal>

      <Modal open={modal === 'ncr'} onClose={() => setModal(null)} title="Raise NCR">
        <form onSubmit={(e) => {
          e.preventDefault();
          submit(() => moduleApi.workforce.quality.createNcr({ ...ncrForm, projectId: ncrForm.projectId || projectId }));
        }} className="space-y-3">
          <TextField label="Title" required value={ncrForm.title} onChange={(e) => setNcrForm({ ...ncrForm, title: e.target.value })} />
          <TextAreaField label="Description" required value={ncrForm.description} onChange={(e) => setNcrForm({ ...ncrForm, description: e.target.value })} />
          <SelectField label="Severity" value={ncrForm.severity} onChange={(e) => setNcrForm({ ...ncrForm, severity: e.target.value })}>
            {NCR_SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </SelectField>
          <TextField label="Assign to" value={ncrForm.assignedTo} onChange={(e) => setNcrForm({ ...ncrForm, assignedTo: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Raise NCR" />
        </form>
      </Modal>

      <Modal open={modal === 'capa'} onClose={() => setModal(null)} title="CAPA">
        <form onSubmit={(e) => {
          e.preventDefault();
          submit(() => moduleApi.workforce.quality.createCapa({ ...capaForm, projectId: capaForm.projectId || projectId }));
        }} className="space-y-3">
          <SelectField label="Type" value={capaForm.capaType} onChange={(e) => setCapaForm({ ...capaForm, capaType: e.target.value })}>
            {CAPA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </SelectField>
          <TextField label="Title" required value={capaForm.title} onChange={(e) => setCapaForm({ ...capaForm, title: e.target.value })} />
          <TextAreaField label="Description" required value={capaForm.description} onChange={(e) => setCapaForm({ ...capaForm, description: e.target.value })} />
          <TextField label="Owner" value={capaForm.owner} onChange={(e) => setCapaForm({ ...capaForm, owner: e.target.value })} />
          <TextField label="Due date" type="date" value={capaForm.dueDate} onChange={(e) => setCapaForm({ ...capaForm, dueDate: e.target.value })} />
          <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Create CAPA" />
        </form>
      </Modal>
    </div>
  );
}
