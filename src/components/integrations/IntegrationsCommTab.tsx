import { useCallback, useEffect, useState } from 'react';
import {
  Bell, LayoutDashboard, ListOrdered, Loader2, Mail, Megaphone, Play, Plus, RefreshCw, Send, Trash2, Workflow,
} from 'lucide-react';
import { integrationsApi } from '@/api/client';
import { cn } from '@/lib/utils';

const COMM_SUBS = ['dashboard', 'templates', 'queue', 'campaigns', 'rules', 'send'] as const;
export type CommSub = (typeof COMM_SUBS)[number];

interface Props {
  sub: CommSub;
  onSubChange: (sub: CommSub) => void;
}

export function IntegrationsCommTab({ sub, onSubChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<Record<string, unknown> | null>(null);
  const [connectors, setConnectors] = useState<Array<Record<string, unknown>>>([]);
  const [templates, setTemplates] = useState<Array<Record<string, unknown>>>([]);
  const [queue, setQueue] = useState<Array<Record<string, unknown>>>([]);
  const [campaigns, setCampaigns] = useState<Array<Record<string, unknown>>>([]);
  const [rules, setRules] = useState<Array<Record<string, unknown>>>([]);
  const [tplForm, setTplForm] = useState({ name: '', channel: 'email', subject: '', body: 'Hello {{name}}' });
  const [sendForm, setSendForm] = useState({ connectorId: '', channel: 'email', recipient: '', subject: '', body: '' });
  const [ruleForm, setRuleForm] = useState({ name: '', channel: 'email', eventTypes: '*', defaultRecipient: 'ops@bekem.com' });
  const [campForm, setCampForm] = useState({ name: '', channels: 'email', recipients: '', body: 'Broadcast message' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, c, t, q, camp, r] = await Promise.all([
        integrationsApi.comm.dashboard(),
        integrationsApi.comm.connectors(),
        integrationsApi.comm.templates(),
        integrationsApi.comm.queue(50),
        integrationsApi.comm.campaigns(),
        integrationsApi.comm.rules(),
      ]);
      setDash(d.data);
      setConnectors(c.data);
      setTemplates(t.data);
      setQueue(q.data);
      setCampaigns(camp.data);
      setRules(r.data);
      if (!sendForm.connectorId && (c.data as unknown[]).length) {
        setSendForm((f) => ({ ...f, connectorId: String((c.data as Array<Record<string, unknown>>)[0].id) }));
      }
    } finally {
      setLoading(false);
    }
  }, [sendForm.connectorId]);

  useEffect(() => { load(); }, [load]);

  const kpis = (dash?.kpis || {}) as Record<string, number>;

  const subNav = (
    <div className="flex flex-wrap gap-1 border-b border-white/5 pb-2">
      {([
        { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'templates' as const, label: 'Templates', icon: Mail },
        { id: 'queue' as const, label: 'Queue', icon: ListOrdered },
        { id: 'campaigns' as const, label: 'Campaigns', icon: Megaphone },
        { id: 'rules' as const, label: 'Workflow Rules', icon: Workflow },
        { id: 'send' as const, label: 'Send', icon: Send },
      ]).map((s) => (
        <button key={s.id} onClick={() => onSubChange(s.id)} className={cn('flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition', sub === s.id ? 'bg-teal-500/20 text-teal-300' : 'text-slate-500 hover:bg-white/5 hover:text-white')}>
          <s.icon size={14} /> {s.label}
        </button>
      ))}
      <button onClick={load} className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:text-white"><RefreshCw size={12} /> Refresh</button>
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-slate-500"><Loader2 className="mr-2 animate-spin" size={18} /> Loading communication platform…</div>;
  }

  return (
    <div className="space-y-4">
      {subNav}
      <p className="text-xs text-slate-500">Communication Platform — Email · SMS · WhatsApp · Teams · Slack with templates, queues, retry, and workflow auto-notify.</p>

      {sub === 'dashboard' && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Connectors', value: kpis.commConnectors ?? 0 },
              { label: 'Templates', value: kpis.templates ?? 0 },
              { label: 'Queue', value: kpis.queuePending ?? 0 },
              { label: 'Delivered (24h)', value: kpis.deliveredLast24h ?? 0 },
              { label: 'Failed', value: kpis.failed ?? 0 },
              { label: 'Success %', value: `${kpis.successRate ?? 100}%` },
            ].map((k) => (
              <div key={k.label} className="command-card px-4 py-3">
                <div className="text-xs text-slate-500">{k.label}</div>
                <div className="mt-1 text-xl font-semibold text-white">{k.value}</div>
              </div>
            ))}
          </div>
          <div className="command-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-white"><Bell size={14} /> Recent Deliveries</h3>
            {((dash?.recentMessages || []) as Array<Record<string, unknown>>).map((m) => (
              <div key={String(m.id)} className="mb-2 flex justify-between rounded-lg bg-white/5 px-3 py-2 text-xs">
                <span className="text-slate-300">{String(m.channel)} → {String(m.recipient)}</span>
                <span className={m.status === 'delivered' ? 'text-emerald-400' : m.status === 'failed' ? 'text-red-400' : 'text-amber-400'}>{String(m.status)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {sub === 'templates' && (
        <div className="space-y-4">
          <button onClick={() => integrationsApi.comm.seedTemplates().then(load)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white">Seed Default Templates</button>
          <div className="command-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <input placeholder="Name" value={tplForm.name} onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <select value={tplForm.channel} onChange={(e) => setTplForm({ ...tplForm, channel: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              {['email', 'sms', 'whatsapp', 'teams', 'slack'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Subject" value={tplForm.subject} onChange={(e) => setTplForm({ ...tplForm, subject: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <input placeholder="Body with {{vars}}" value={tplForm.body} onChange={(e) => setTplForm({ ...tplForm, body: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <button onClick={() => integrationsApi.comm.createTemplate(tplForm).then(load)} disabled={!tplForm.name} className="rounded-lg bg-teal-600 px-3 py-2 text-sm text-white disabled:opacity-40"><Plus size={14} className="inline" /> Add</button>
          </div>
          {templates.map((t) => (
            <div key={String(t.id)} className="command-card flex justify-between px-4 py-3 text-sm">
              <div><span className="text-white">{String(t.name)}</span> <span className="text-slate-500">· {String(t.channel)}</span></div>
              <button onClick={() => integrationsApi.comm.deleteTemplate(String(t.id)).then(load)} className="text-red-400"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}

      {sub === 'queue' && (
        <div className="space-y-2">
          {queue.map((m) => (
            <div key={String(m.id)} className="command-card flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs">
              <div>
                <span className="font-medium text-white">{String(m.channel)}</span> → {String(m.recipient)}
                {m.eventType ? <span className="ml-2 text-slate-500">({String(m.eventType)})</span> : null}
              </div>
              <div className="flex items-center gap-2">
                <span className={m.status === 'delivered' ? 'text-emerald-400' : m.status === 'failed' ? 'text-red-400' : 'text-amber-400'}>{String(m.status)}</span>
                {m.status === 'failed' && <button onClick={() => integrationsApi.comm.retryMessage(String(m.id)).then(load)} className="text-teal-400 hover:underline">Retry</button>}
              </div>
            </div>
          ))}
          {!queue.length && <p className="text-sm text-slate-500">Queue empty. Send a message or publish an event with workflow rules.</p>}
        </div>
      )}

      {sub === 'campaigns' && (
        <div className="space-y-4">
          <div className="command-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <input placeholder="Campaign name" value={campForm.name} onChange={(e) => setCampForm({ ...campForm, name: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <input placeholder="Channels (comma)" value={campForm.channels} onChange={(e) => setCampForm({ ...campForm, channels: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <input placeholder="Recipients (comma)" value={campForm.recipients} onChange={(e) => setCampForm({ ...campForm, recipients: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <button onClick={() => integrationsApi.comm.createCampaign({ name: campForm.name, channels: campForm.channels.split(',').map((s) => s.trim()), recipients: campForm.recipients.split(',').map((s) => s.trim()), body: campForm.body }).then(load)} disabled={!campForm.name} className="rounded-lg bg-teal-600 px-3 py-2 text-sm text-white disabled:opacity-40">Create</button>
          </div>
          {campaigns.map((c) => (
            <div key={String(c.id)} className="command-card flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm text-white">{String(c.name)}</div>
                <div className="text-xs text-slate-500">{String(c.status)} · {Number(c.deliveredCount)}/{Number(c.sentCount)} delivered</div>
              </div>
              <button onClick={() => integrationsApi.comm.runCampaign(String(c.id)).then(load)} className="flex items-center gap-1 rounded-lg bg-teal-600/20 px-3 py-1.5 text-xs text-teal-300"><Play size={12} /> Run</button>
            </div>
          ))}
        </div>
      )}

      {sub === 'rules' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Workflow rules auto-notify when AFIOS events are published to the event bus.</p>
          <div className="command-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <input placeholder="Rule name" value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <select value={ruleForm.channel} onChange={(e) => setRuleForm({ ...ruleForm, channel: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              {['email', 'sms', 'whatsapp', 'teams', 'slack'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Event types (* or comma)" value={ruleForm.eventTypes} onChange={(e) => setRuleForm({ ...ruleForm, eventTypes: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <input placeholder="Recipient" value={ruleForm.defaultRecipient} onChange={(e) => setRuleForm({ ...ruleForm, defaultRecipient: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <button onClick={() => integrationsApi.comm.createRule({ ...ruleForm, eventTypes: ruleForm.eventTypes === '*' ? ['*'] : ruleForm.eventTypes.split(',').map((s) => s.trim()) }).then(load)} disabled={!ruleForm.name} className="rounded-lg bg-teal-600 px-3 py-2 text-sm text-white disabled:opacity-40">Add Rule</button>
          </div>
          {rules.map((r) => (
            <div key={String(r.id)} className="command-card flex justify-between px-4 py-3 text-sm">
              <span className="text-white">{String(r.name)} · {String(r.channel)} · {(r.eventTypes as string[])?.join(', ')}</span>
              <button onClick={() => integrationsApi.comm.deleteRule(String(r.id)).then(load)} className="text-red-400"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}

      {sub === 'send' && (
        <div className="command-card space-y-3 p-4">
          <h3 className="text-sm font-medium text-white">Send Notification</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={sendForm.connectorId} onChange={(e) => setSendForm({ ...sendForm, connectorId: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              {connectors.map((c) => <option key={String(c.id)} value={String(c.id)}>{String(c.name)}</option>)}
            </select>
            <select value={sendForm.channel} onChange={(e) => setSendForm({ ...sendForm, channel: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
              {['email', 'sms', 'whatsapp', 'teams', 'slack'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Recipient" value={sendForm.recipient} onChange={(e) => setSendForm({ ...sendForm, recipient: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
            <input placeholder="Subject" value={sendForm.subject} onChange={(e) => setSendForm({ ...sendForm, subject: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
          </div>
          <textarea value={sendForm.body} onChange={(e) => setSendForm({ ...sendForm, body: e.target.value })} rows={4} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" placeholder="Message body" />
          <button onClick={() => integrationsApi.comm.send(sendForm).then(load)} disabled={!sendForm.connectorId || !sendForm.recipient || !sendForm.body} className="flex items-center gap-1 rounded-lg bg-teal-600 px-4 py-2 text-sm text-white disabled:opacity-40"><Send size={14} /> Send Now</button>
        </div>
      )}
    </div>
  );
}
