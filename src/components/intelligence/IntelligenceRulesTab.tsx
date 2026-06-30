import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, History, LayoutDashboard, List,
  Loader2, Play, Plus, TestTube, Wrench,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { TextField, SelectField } from '@/components/ui/FormField';
import { FilterChipBar } from '@/components/layout/FilterChipBar';
import { intelligenceApi } from '@/api/client';
import { cn, formatDate } from '@/lib/utils';

const RULE_SUBS = ['dashboard', 'list', 'builder', 'history', 'test'] as const;
type RuleSub = (typeof RULE_SUBS)[number];

const ACTION_TYPES = [
  'create_notification', 'send_alert', 'create_task', 'escalate',
  'recommend_action', 'update_score', 'trigger_workflow', 'add_dashboard_card',
];

const severityColor = (s: string) => {
  if (s === 'critical' || s === 'high') return 'text-red-400 bg-red-500/10';
  if (s === 'warning' || s === 'medium') return 'text-amber-400 bg-amber-500/10';
  return 'text-sky-400 bg-sky-500/10';
};

type Catalog = {
  domains?: string[];
  metrics?: string[];
  conditionPresets?: Array<{
    id: string; label: string; metric: string; operator: string;
    threshold: number; domain: string; category: string;
  }>;
  actionTypes?: string[];
};

interface Props {
  projectId?: string;
  sub: RuleSub;
  onSubChange: (sub: RuleSub) => void;
}

export function IntelligenceRulesTab({ projectId, sub, onSubChange }: Props) {
  const [rules, setRules] = useState<Array<Record<string, unknown>>>([]);
  const [ruleDash, setRuleDash] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [testRuleId, setTestRuleId] = useState('');

  const emptyForm = {
    name: '', description: '', domain: 'projects', category: 'budget_threshold',
    metric: 'budget_utilization', operator: 'gt', threshold: 90,
    severity: 'warning', priority: 'medium', status: 'active', owner: '',
    tags: '', scheduleFrequency: 'continuous',
    actions: ['send_alert', 'create_notification'] as string[],
  };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rList, rDash, hist, cat] = await Promise.all([
        intelligenceApi.rules.list(projectId),
        intelligenceApi.rules.dashboard(projectId),
        intelligenceApi.rules.history(50),
        intelligenceApi.rules.catalog(),
      ]);
      setRules(rList.data);
      setRuleDash(rDash.data);
      setHistory(hist.data);
      setCatalog(cat.data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const applyPreset = (presetId: string) => {
    const p = catalog?.conditionPresets?.find((x) => x.id === presetId);
    if (!p) return;
    setForm((f) => ({
      ...f, domain: p.domain, category: p.category,
      metric: p.metric, operator: p.operator, threshold: p.threshold,
      name: f.name || p.label,
    }));
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await intelligenceApi.rules.create({
        name: form.name,
        description: form.description,
        domain: form.domain,
        category: form.category,
        metric: form.metric,
        operator: form.operator,
        threshold: form.threshold,
        conditions: [{ metric: form.metric, operator: form.operator, threshold: form.threshold }],
        actions: form.actions.map((type) => ({ type })),
        schedule: { frequency: form.scheduleFrequency, enabled: true },
        severity: form.severity,
        priority: form.priority,
        status: form.status,
        owner: form.owner || undefined,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        projectId,
      });
      setShowModal(false);
      setForm(emptyForm);
      onSubChange('list');
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      await intelligenceApi.rules.execute(projectId);
      await load();
    } finally {
      setExecuting(false);
    }
  };

  const handleTest = async (ruleId?: string) => {
    const id = ruleId || testRuleId;
    const res = id
      ? await intelligenceApi.rules.test(id, projectId)
      : await intelligenceApi.rules.testInline({
          projectId, metric: form.metric, operator: form.operator, threshold: form.threshold,
          conditions: [{ metric: form.metric, operator: form.operator, threshold: form.threshold }],
        });
    setTestResult(res.data);
  };

  const subNav = (
    <FilterChipBar
      items={[
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'list', label: 'Rule List', icon: List },
        { id: 'builder', label: 'Rule Builder', icon: Wrench },
        { id: 'history', label: 'Execution History', icon: History },
        { id: 'test', label: 'Test Rule', icon: TestTube },
      ]}
      active={sub}
      onChange={(id) => onSubChange(id as RuleSub)}
    />
  );

  if (loading && !rules.length) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-violet-400" size={28} />
      </div>
    );
  }

  const kpis = (ruleDash?.kpis || {}) as Record<string, number>;

  const renderDashboard = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total Rules', value: kpis.totalRules ?? 0 },
          { label: 'Active', value: kpis.activeRules ?? 0 },
          { label: 'Triggered (24h)', value: kpis.triggered24h ?? 0 },
          { label: 'Alerts (24h)', value: kpis.alertsGenerated24h ?? kpis.triggered24h ?? 0 },
        ].map((k) => (
          <div key={k.label} className="command-card p-4">
            <p className="text-[10px] uppercase text-slate-500">{k.label}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-white">{k.value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {((ruleDash?.byDomain as Array<{ domain: string; count: number }>) || []).map((d) => (
          <span key={d.domain} className="rounded-full bg-white/5 px-3 py-1 text-xs capitalize text-slate-400">
            {d.domain.replace('_', ' ')}: <span className="text-white">{d.count}</span>
          </span>
        ))}
      </div>
      <div className="command-card p-5">
        <h3 className="font-semibold text-white">Recent Triggers</h3>
        <ul className="mt-3 space-y-2">
          {((ruleDash?.recentTriggered as Array<Record<string, unknown>>) || []).map((t) => (
            <li key={String(t.id)} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
              <span className="text-slate-300">{String(t.ruleName)}</span>
              <span className="text-xs text-slate-500">{t.at ? formatDate(String(t.at)) : ''}</span>
            </li>
          ))}
          {!((ruleDash?.recentTriggered as unknown[])?.length) && (
            <p className="text-sm text-slate-500">No recent triggers</p>
          )}
        </ul>
      </div>
      <div className="flex gap-2">
        <button onClick={handleExecute} disabled={executing} className="flex items-center gap-1 rounded-lg bg-accent/20 px-4 py-2 text-xs text-accent disabled:opacity-50">
          {executing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Run All Rules
        </button>
        <Link to="/mission-control" className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-400 hover:text-white">
          View Mission Control →
        </Link>
      </div>
    </div>
  );

  const renderList = () => (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <button onClick={() => { setShowModal(true); onSubChange('builder'); }} className="flex items-center gap-1 rounded-lg bg-violet-500/20 px-3 py-1.5 text-xs text-violet-300">
          <Plus size={14} /> New Rule
        </button>
        <button onClick={handleExecute} disabled={executing} className="flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300">
          <Play size={14} /> Execute
        </button>
      </div>
      <div className="command-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Rule</th>
              <th className="px-4 py-3">Domain</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Condition</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rules.map((r) => (
              <tr key={String(r.id)} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{String(r.name)}</p>
                  <p className="text-[10px] text-slate-500">{String(r.ruleCode)} {r.owner ? `· ${String(r.owner)}` : ''}</p>
                </td>
                <td className="px-4 py-3 capitalize text-slate-400">{String(r.domain).replace('_', ' ')}</td>
                <td className="px-4 py-3"><span className={cn('rounded px-1.5 py-0.5 text-[10px] uppercase', severityColor(String(r.priority || 'medium')))}>{String(r.priority || 'medium')}</span></td>
                <td className="px-4 py-3 capitalize text-slate-400">{String(r.status || (r.isActive ? 'active' : 'paused'))}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{String(r.metric)} {String(r.operator)} {String(r.threshold)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => { setTestRuleId(String(r.id)); onSubChange('test'); handleTest(String(r.id)); }} className="text-xs text-violet-400 hover:underline">Test</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBuilder = () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="command-card space-y-3 p-5">
        <h3 className="font-semibold text-white">Rule Builder</h3>
        <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <TextField label="Owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
        <TextField label="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        <SelectField label="Domain" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })}>
          {(catalog?.domains || []).map((d) => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
        </SelectField>
        <SelectField label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
          {['low', 'medium', 'high', 'critical'].map((p) => <option key={p} value={p}>{p}</option>)}
        </SelectField>
        <SelectField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {['draft', 'active', 'paused', 'disabled'].map((s) => <option key={s} value={s}>{s}</option>)}
        </SelectField>
        <SelectField label="Schedule" value={form.scheduleFrequency} onChange={(e) => setForm({ ...form, scheduleFrequency: e.target.value })}>
          {['continuous', 'hourly', 'daily', 'weekly'].map((s) => <option key={s} value={s}>{s}</option>)}
        </SelectField>
      </div>
      <div className="command-card space-y-3 p-5">
        <h3 className="font-semibold text-white">Conditions & Actions</h3>
        <SelectField label="Condition preset" value="" onChange={(e) => applyPreset(e.target.value)}>
          <option value="">— Select preset —</option>
          {(catalog?.conditionPresets || []).map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </SelectField>
        <TextField label="Metric" value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} />
        <SelectField label="Operator" value={form.operator} onChange={(e) => setForm({ ...form, operator: e.target.value })}>
          {['gt', 'gte', 'lt', 'lte', 'eq', 'neq'].map((o) => <option key={o} value={o}>{o}</option>)}
        </SelectField>
        <TextField label="Threshold" type="number" value={String(form.threshold)} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })} />
        <SelectField label="Severity" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
          {['info', 'warning', 'critical'].map((s) => <option key={s} value={s}>{s}</option>)}
        </SelectField>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Actions</p>
          <div className="flex flex-wrap gap-2">
            {ACTION_TYPES.map((a) => (
              <label key={a} className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={form.actions.includes(a)}
                  onChange={(e) => setForm({
                    ...form,
                    actions: e.target.checked ? [...form.actions, a] : form.actions.filter((x) => x !== a),
                  })}
                />
                {a.replace(/_/g, ' ')}
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={() => handleTest()} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-300 hover:text-white">Test</button>
          <button type="button" onClick={handleCreate} disabled={saving || !form.name} className="rounded-lg bg-violet-500/20 px-4 py-2 text-xs text-violet-300 disabled:opacity-50">
            {saving ? 'Saving…' : 'Create Rule'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="command-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 text-left text-[10px] uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Rule</th>
            <th className="px-4 py-3">Result</th>
            <th className="px-4 py-3">Entity</th>
            <th className="px-4 py-3">Actions</th>
            <th className="px-4 py-3">Duration</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {history.map((h) => (
            <tr key={String(h.id)}>
              <td className="px-4 py-3 text-xs text-slate-500">{h.at ? formatDate(String(h.at)) : '—'}</td>
              <td className="px-4 py-3 text-white">{String(h.ruleName)}</td>
              <td className="px-4 py-3">
                <span className={h.triggered ? 'text-red-400' : 'text-emerald-400'}>
                  {h.triggered ? 'TRIGGERED' : 'OK'}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-400">
                {(h.matchedEntity as { type?: string; name?: string })?.type || '—'}
              </td>
              <td className="px-4 py-3 text-xs text-slate-400">
                {((h.triggeredActions as Array<{ type: string }>) || []).map((a) => a.type).join(', ') || '—'}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-500">
                {h.executionTimeMs != null ? `${h.executionTimeMs}ms` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!history.length && <p className="p-6 text-center text-sm text-slate-500">No execution history yet</p>}
    </div>
  );

  const renderTest = () => (
    <div className="mx-auto max-w-xl space-y-4">
      <SelectField label="Select rule" value={testRuleId} onChange={(e) => setTestRuleId(e.target.value)}>
        <option value="">— Or use builder conditions —</option>
        {rules.map((r) => <option key={String(r.id)} value={String(r.id)}>{String(r.name)}</option>)}
      </SelectField>
      <button onClick={() => handleTest()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-500/20 py-3 text-sm text-violet-300">
        <TestTube size={16} /> Run Test
      </button>
      {testResult && (
        <div className={cn('command-card p-4', testResult.triggered ? 'border border-red-500/30' : 'border border-emerald-500/30')}>
          <div className="flex items-center gap-2">
            {testResult.triggered ? <AlertTriangle className="text-red-400" size={18} /> : <CheckCircle2 className="text-emerald-400" size={18} />}
            <p className="text-sm text-white">{String(testResult.message)}</p>
          </div>
          <p className="mt-2 font-mono text-xs text-slate-500">metric value: {String(testResult.metricValue)}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {subNav}
      {sub === 'dashboard' && renderDashboard()}
      {sub === 'list' && renderList()}
      {sub === 'builder' && renderBuilder()}
      {sub === 'history' && renderHistory()}
      {sub === 'test' && renderTest()}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Rule">
        <p className="text-sm text-slate-500">Use the Rule Builder tab for the full form.</p>
        <button onClick={() => { setShowModal(false); onSubChange('builder'); }} className="mt-3 text-sm text-violet-400 hover:underline">
          Open Rule Builder →
        </button>
      </Modal>
    </div>
  );
}

export { RULE_SUBS, type RuleSub };
