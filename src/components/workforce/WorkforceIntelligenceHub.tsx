import { useCallback, useEffect, useState } from 'react';
import { BarChart3, Brain, Award, GraduationCap, TrendingUp, Users, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField, FormActions } from '@/components/ui/FormField';
import { moduleApi } from '@/api/client';
import { cn, formatDate } from '@/lib/utils';

export type W5Section = 'productivity' | 'training' | 'skills' | 'certifications' | 'performance' | 'intelligence' | 'reports';

const PROD_TYPES = ['crew', 'individual', 'equipment', 'labour', 'boq'];
const TRAINING_TYPES = ['safety', 'technical', 'quality', 'equipment', 'refresher', 'general'];
const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const CERT_TYPES = ['driving_license', 'operator_license', 'welding', 'electrical', 'safety', 'oem', 'other'];
const TRADES = ['civil', 'electrical', 'mechanical', 'plumbing', 'welding', 'operator', 'supervisor', 'quality', 'safety', 'general'];

export function WorkforceIntelligenceHub({ projectId, section }: { projectId?: string; section: W5Section }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<string | null>(null);

  const [prodDash, setProdDash] = useState<Record<string, unknown> | null>(null);
  const [productivity, setProductivity] = useState<Array<Record<string, unknown>>>([]);
  const [training, setTraining] = useState<Array<Record<string, unknown>>>([]);
  const [skills, setSkills] = useState<Array<Record<string, unknown>>>([]);
  const [certifications, setCertifications] = useState<Array<Record<string, unknown>>>([]);
  const [performance, setPerformance] = useState<Record<string, unknown> | null>(null);
  const [intelligence, setIntelligence] = useState<Record<string, unknown> | null>(null);

  const [prodForm, setProdForm] = useState({
    projectId: projectId || '', entryDate: new Date().toISOString().slice(0, 10),
    productivityType: 'crew', teamName: '', plannedQuantity: 100, actualQuantity: 0, unit: 'cum', workDescription: '',
  });
  const [trainForm, setTrainForm] = useState({
    title: '', trainingType: 'safety', scheduledDate: new Date().toISOString().slice(0, 10), trainer: '', projectId: projectId || '',
  });
  const [skillForm, setSkillForm] = useState({
    employeeId: '', employeeName: '', skillName: '', skillLevel: 'intermediate', trade: 'civil', projectId: projectId || '',
  });
  const [certForm, setCertForm] = useState({
    employeeId: '', employeeName: '', certType: 'safety', title: '', expiryDate: '', projectId: projectId || '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pd, pr, tr, sk, ce, perf, intel] = await Promise.all([
        moduleApi.workforce.productivity.dashboard(projectId),
        moduleApi.workforce.productivity.list(projectId),
        moduleApi.workforce.training.list(projectId),
        moduleApi.workforce.skills.list(projectId),
        moduleApi.workforce.certifications.list(projectId),
        moduleApi.workforce.performance.get(projectId),
        moduleApi.workforce.intelligence.get(projectId),
      ]);
      setProdDash(pd.data);
      setProductivity(pr.data);
      setTraining(tr.data);
      setSkills(sk.data);
      setCertifications(ce.data);
      setPerformance(perf.data);
      setIntelligence(intel.data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

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

  const kpiCard = (label: string, value: string | number, color?: string) => (
    <div key={label} className="command-card p-3">
      <p className="text-[10px] text-slate-500 uppercase">{label}</p>
      <p className={cn('text-xl font-semibold', color || 'text-white')}>{value}</p>
    </div>
  );

  if (loading) {
    return <p className="text-sm text-slate-500 py-8 text-center">Loading…</p>;
  }

  const pk = (prodDash?.kpis || {}) as Record<string, number>;
  const perfK = (performance?.kpis || {}) as Record<string, number>;
  const intelK = (intelligence?.kpis || {}) as Record<string, number>;

  // ─── Productivity ──────────────────────────────────────────────────────────
  if (section === 'productivity') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Productivity</h3>
          <button type="button" onClick={() => setModal('prod')} className="flex items-center gap-1 text-xs bg-sky-600 text-white px-3 py-1.5 rounded">
            <Plus className="w-3 h-3" /> Log Output
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-4">
          {kpiCard('Daily Output', pk.dailyOutput ?? 0, 'text-emerald-400')}
          {kpiCard('Weekly Output', pk.weeklyOutput ?? 0, 'text-sky-400')}
          {kpiCard('Monthly Output', pk.monthlyOutput ?? 0, 'text-violet-400')}
          {kpiCard('Target %', `${pk.targetAchievementPercent ?? 0}%`, (pk.targetAchievementPercent ?? 0) < 70 ? 'text-red-400' : 'text-emerald-400')}
          {kpiCard('Idle Labour (h)', pk.idleLabour ?? 0, 'text-amber-400')}
          {kpiCard('Idle Equip (h)', pk.idleEquipment ?? 0, 'text-amber-400')}
          {kpiCard('Productivity Score', pk.productivityScore ?? 0, 'text-white')}
        </div>
        <div className="space-y-2">
          {productivity.map((p) => (
            <div key={String(p.id)} className="command-card p-3">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{String(p.entryNumber)}</p>
                  <p className="text-xs text-slate-500">{String(p.workDescription || p.teamName || '—')} · {formatDate(String(p.entryDate))}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-emerald-400">{String(p.actualQuantity)} / {String(p.plannedQuantity)} {String(p.unit || '')}</p>
                  <p className="text-xs text-slate-500">{String(p.targetAchievementPercent)}% target</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Modal open={modal === 'prod'} onClose={() => setModal(null)} title="Log Productivity">
          <form onSubmit={(e) => { e.preventDefault(); submit(() => moduleApi.workforce.productivity.create({ ...prodForm, projectId: prodForm.projectId || projectId, dailyOutput: prodForm.actualQuantity })); }} className="space-y-3">
            <SelectField label="Type" value={prodForm.productivityType} onChange={(e) => setProdForm({ ...prodForm, productivityType: e.target.value })}>
              {PROD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </SelectField>
            <TextField label="Date" type="date" value={prodForm.entryDate} onChange={(e) => setProdForm({ ...prodForm, entryDate: e.target.value })} />
            <TextField label="Team / Crew" value={prodForm.teamName} onChange={(e) => setProdForm({ ...prodForm, teamName: e.target.value })} />
            <TextField label="Work description" value={prodForm.workDescription} onChange={(e) => setProdForm({ ...prodForm, workDescription: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <TextField label="Planned" type="number" value={String(prodForm.plannedQuantity)} onChange={(e) => setProdForm({ ...prodForm, plannedQuantity: Number(e.target.value) })} />
              <TextField label="Actual" type="number" value={String(prodForm.actualQuantity)} onChange={(e) => setProdForm({ ...prodForm, actualQuantity: Number(e.target.value) })} />
            </div>
            <TextField label="Unit" value={prodForm.unit} onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })} />
            <FormActions onCancel={() => setModal(null)} loading={saving} submitLabel="Save" />
          </form>
        </Modal>
      </div>
    );
  }

  // ─── Training ──────────────────────────────────────────────────────────────
  if (section === 'training') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Training</h3>
          <button type="button" onClick={() => setModal('train')} className="flex items-center gap-1 text-xs bg-sky-600 text-white px-3 py-1.5 rounded"><Plus className="w-3 h-3" /> Schedule</button>
        </div>
        {training.map((t) => (
          <div key={String(t.id)} className="command-card p-3">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-white">{String(t.title)}</p>
                <p className="text-xs text-slate-500 capitalize">{String(t.trainingType)} · {formatDate(String(t.scheduledDate))}</p>
              </div>
              <span className={cn('text-[10px] uppercase px-2 py-0.5 rounded', t.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300')}>{String(t.status)}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Trainer: {String(t.trainer || '—')} · {(t.attendees as unknown[])?.length ?? 0} attendees</p>
          </div>
        ))}
        <Modal open={modal === 'train'} onClose={() => setModal(null)} title="Schedule Training">
          <form onSubmit={(e) => { e.preventDefault(); submit(() => moduleApi.workforce.training.create({ ...trainForm, projectId: trainForm.projectId || projectId })); }} className="space-y-3">
            <TextField label="Title" required value={trainForm.title} onChange={(e) => setTrainForm({ ...trainForm, title: e.target.value })} />
            <SelectField label="Type" value={trainForm.trainingType} onChange={(e) => setTrainForm({ ...trainForm, trainingType: e.target.value })}>
              {TRAINING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </SelectField>
            <TextField label="Date" type="date" value={trainForm.scheduledDate} onChange={(e) => setTrainForm({ ...trainForm, scheduledDate: e.target.value })} />
            <TextField label="Trainer" value={trainForm.trainer} onChange={(e) => setTrainForm({ ...trainForm, trainer: e.target.value })} />
            <FormActions onCancel={() => setModal(null)} loading={saving} />
          </form>
        </Modal>
      </div>
    );
  }

  // ─── Skills ────────────────────────────────────────────────────────────────
  if (section === 'skills') {
    const gaps = (intelligence?.skillGaps || []) as Array<Record<string, unknown>>;
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Users className="w-4 h-4" /> Skills Matrix</h3>
          <button type="button" onClick={() => setModal('skill')} className="flex items-center gap-1 text-xs bg-sky-600 text-white px-3 py-1.5 rounded"><Plus className="w-3 h-3" /> Add Skill</button>
        </div>
        {gaps.length > 0 && (
          <div className="command-card p-3 border-amber-500/20">
            <p className="text-xs font-semibold text-amber-300 mb-2">Skill Gaps ({gaps.length})</p>
            {gaps.slice(0, 5).map((g, i) => (
              <p key={i} className="text-xs text-slate-400">{String(g.employeeName)}: {(g.missingSkills as string[])?.join(', ')}</p>
            ))}
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {skills.map((s) => (
            <div key={String(s.id)} className="command-card p-3">
              <p className="text-sm font-medium text-white">{String(s.employeeName || s.employeeId)}</p>
              <p className="text-xs text-slate-400">{String(s.skillName)} · <span className="capitalize">{String(s.skillLevel)}</span></p>
              {s.trade ? <p className="text-[10px] text-slate-500 capitalize">{String(s.trade)}</p> : null}
            </div>
          ))}
        </div>
        <Modal open={modal === 'skill'} onClose={() => setModal(null)} title="Add Skill">
          <form onSubmit={(e) => { e.preventDefault(); submit(() => moduleApi.workforce.skills.create({ ...skillForm, projectId: skillForm.projectId || projectId })); }} className="space-y-3">
            <TextField label="Employee ID" required value={skillForm.employeeId} onChange={(e) => setSkillForm({ ...skillForm, employeeId: e.target.value })} />
            <TextField label="Name" value={skillForm.employeeName} onChange={(e) => setSkillForm({ ...skillForm, employeeName: e.target.value })} />
            <TextField label="Skill" required value={skillForm.skillName} onChange={(e) => setSkillForm({ ...skillForm, skillName: e.target.value })} />
            <SelectField label="Level" value={skillForm.skillLevel} onChange={(e) => setSkillForm({ ...skillForm, skillLevel: e.target.value })}>
              {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </SelectField>
            <SelectField label="Trade" value={skillForm.trade} onChange={(e) => setSkillForm({ ...skillForm, trade: e.target.value })}>
              {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
            </SelectField>
            <FormActions onCancel={() => setModal(null)} loading={saving} />
          </form>
        </Modal>
      </div>
    );
  }

  // ─── Certifications ────────────────────────────────────────────────────────
  if (section === 'certifications') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Award className="w-4 h-4" /> Certifications</h3>
          <button type="button" onClick={() => setModal('cert')} className="flex items-center gap-1 text-xs bg-sky-600 text-white px-3 py-1.5 rounded"><Plus className="w-3 h-3" /> Add Cert</button>
        </div>
        {certifications.map((c) => (
          <div key={String(c.id)} className="command-card p-3">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-white">{String(c.title)}</p>
                <p className="text-xs text-slate-500">{String(c.employeeName)} · {String(c.certNumber)}</p>
              </div>
              <span className={cn('text-[10px] uppercase px-2 py-0.5 rounded',
                c.status === 'expired' ? 'bg-red-500/20 text-red-300' : c.status === 'expiring_soon' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300')}>
                {String(c.status).replace(/_/g, ' ')}
              </span>
            </div>
            {c.expiryDate ? <p className="text-xs text-slate-400 mt-1">Expires: {formatDate(String(c.expiryDate))}</p> : null}
          </div>
        ))}
        <Modal open={modal === 'cert'} onClose={() => setModal(null)} title="Add Certification">
          <form onSubmit={(e) => { e.preventDefault(); submit(() => moduleApi.workforce.certifications.create({ ...certForm, projectId: certForm.projectId || projectId })); }} className="space-y-3">
            <TextField label="Employee ID" required value={certForm.employeeId} onChange={(e) => setCertForm({ ...certForm, employeeId: e.target.value })} />
            <TextField label="Name" value={certForm.employeeName} onChange={(e) => setCertForm({ ...certForm, employeeName: e.target.value })} />
            <SelectField label="Type" value={certForm.certType} onChange={(e) => setCertForm({ ...certForm, certType: e.target.value })}>
              {CERT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </SelectField>
            <TextField label="Title" required value={certForm.title} onChange={(e) => setCertForm({ ...certForm, title: e.target.value })} />
            <TextField label="Expiry" type="date" value={certForm.expiryDate} onChange={(e) => setCertForm({ ...certForm, expiryDate: e.target.value })} />
            <FormActions onCancel={() => setModal(null)} loading={saving} />
          </form>
        </Modal>
      </div>
    );
  }

  // ─── Performance ───────────────────────────────────────────────────────────
  if (section === 'performance') {
    const employees = (performance?.employees || []) as Array<Record<string, unknown>>;
    const crews = (performance?.crews || []) as Array<Record<string, unknown>>;
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Workforce Performance</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {kpiCard('Overall', perfK.avgEmployeeScore ?? 0, 'text-white')}
          {kpiCard('Attendance', `${perfK.attendancePercent ?? 0}%`, 'text-emerald-400')}
          {kpiCard('Safety', `${perfK.safetyPercent ?? 0}%`, 'text-sky-400')}
          {kpiCard('Quality', `${perfK.qualityPercent ?? 0}%`, 'text-violet-400')}
          {kpiCard('Productivity', `${perfK.productivityPercent ?? 0}%`, 'text-amber-400')}
          {kpiCard('Training', `${perfK.trainingPercent ?? 0}%`, 'text-slate-300')}
          {kpiCard('Crew Avg', perfK.avgCrewScore ?? 0)}
          {kpiCard('Site Avg', perfK.avgSiteScore ?? 0)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="command-card p-4">
            <h4 className="text-xs font-semibold text-white mb-3">Top Employees</h4>
            {employees.slice(0, 8).map((e, i) => (
              <div key={i} className="flex justify-between text-xs py-1 border-b border-white/5">
                <span className="text-slate-300">{String(e.name)}</span>
                <span className="text-emerald-400 font-mono">{String(e.overallScore)}</span>
              </div>
            ))}
          </div>
          <div className="command-card p-4">
            <h4 className="text-xs font-semibold text-white mb-3">Crew Comparison</h4>
            {crews.slice(0, 8).map((c, i) => (
              <div key={i} className="flex justify-between text-xs py-1 border-b border-white/5">
                <span className="text-slate-300">{String(c.teamName)}</span>
                <span className="text-sky-400 font-mono">{String(c.crewScore)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Intelligence ──────────────────────────────────────────────────────────
  if (section === 'intelligence') {
    const recs = (intelligence?.trainingRecommendations || []) as Array<Record<string, unknown>>;
    const risks = (intelligence?.certificationRisks || []) as Array<Record<string, unknown>>;
    const idle = (intelligence?.idleResources || []) as Array<Record<string, unknown>>;
    const lowProd = (intelligence?.lowProductivityAlerts || []) as Array<Record<string, unknown>>;
    const bestCrew = intelligence?.bestPerformingCrew as Record<string, unknown> | null;
    const bestSup = intelligence?.bestSupervisor as Record<string, unknown> | null;

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Brain className="w-4 h-4" /> Workforce Intelligence</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {kpiCard('Productivity', intelK.productivity ?? 0)}
          {kpiCard('Training Due', intelK.trainingDue ?? 0, 'text-amber-400')}
          {kpiCard('Skill Gaps', intelK.skillGaps ?? 0, 'text-red-400')}
          {kpiCard('Cert Risks', intelK.certificationExpiry ?? 0, 'text-red-400')}
          {kpiCard('Top Team', intelK.topTeamScore ?? 0, 'text-emerald-400')}
          {kpiCard('Low Site', intelK.lowestSiteScore ?? 0, 'text-amber-400')}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {bestCrew && (
            <div className="command-card p-4">
              <p className="text-[10px] text-slate-500 uppercase">Best Performing Crew</p>
              <p className="text-lg font-semibold text-emerald-400">{String(bestCrew.teamName)}</p>
              <p className="text-xs text-slate-400">Score: {String(bestCrew.crewScore)}</p>
            </div>
          )}
          {bestSup && (
            <div className="command-card p-4">
              <p className="text-[10px] text-slate-500 uppercase">Best Supervisor</p>
              <p className="text-lg font-semibold text-sky-400">{String(bestSup.supervisorName)}</p>
              <p className="text-xs text-slate-400">{String(bestSup.teamName)} · Score {String(bestSup.supervisorScore)}</p>
            </div>
          )}
        </div>
        {recs.length > 0 && (
          <div className="command-card p-4">
            <h4 className="text-xs font-semibold text-white mb-2">Training Recommendations</h4>
            {recs.map((r, i) => (
              <p key={i} className="text-xs text-slate-400 py-1">{String(r.employeeName)}: {(r.recommendedTraining as string[])?.join(', ')}</p>
            ))}
          </div>
        )}
        {risks.length > 0 && (
          <div className="command-card p-4 border-red-500/20">
            <h4 className="text-xs font-semibold text-red-300 mb-2">Certification Risks</h4>
            {risks.map((r, i) => (
              <p key={i} className="text-xs text-slate-400 py-1">{String(r.employeeName)} — {String(r.title)} ({String(r.status)})</p>
            ))}
          </div>
        )}
        {lowProd.length > 0 && (
          <div className="command-card p-4">
            <h4 className="text-xs font-semibold text-amber-300 mb-2">Low Productivity Alerts</h4>
            {lowProd.map((a, i) => (
              <p key={i} className="text-xs text-slate-400 py-1">{String(a.entryNumber)}: {String(a.achievement)}% — {String(a.teamName)}</p>
            ))}
          </div>
        )}
        {idle.length > 0 && (
          <div className="command-card p-4">
            <h4 className="text-xs font-semibold text-white mb-2">Idle Resources</h4>
            {idle.map((r, i) => (
              <p key={i} className="text-xs text-slate-400 py-1">{String(r.teamName)}: labour {String(r.idleLabourHours)}h · equip {String(r.idleEquipmentHours)}h</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Reports ───────────────────────────────────────────────────────────────
  return (
    <div className="command-card p-6 text-center">
      <BarChart3 className="w-8 h-8 text-slate-500 mx-auto mb-2" />
      <p className="text-sm text-slate-400">Workforce reports and analytics via Insights</p>
      <a href="/insights?tab=workforce" className="text-xs text-sky-400 hover:underline mt-2 inline-block">Open Workforce Analytics</a>
    </div>
  );
}
