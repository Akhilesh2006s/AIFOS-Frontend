import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, RefreshCw, Trash2, Webhook } from 'lucide-react';
import { integrationsApi } from '@/api/client';

export function IntegrationsWebhooksTab() {
  const [loading, setLoading] = useState(true);
  const [webhooks, setWebhooks] = useState<Array<Record<string, unknown>>>([]);
  const [form, setForm] = useState({ name: '', url: '', eventTypes: '*' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await integrationsApi.webhooks.list();
      setWebhooks(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    await integrationsApi.webhooks.create({
      name: form.name,
      url: form.url,
      eventTypes: form.eventTypes === '*' ? ['*'] : form.eventTypes.split(',').map((s) => s.trim()),
      direction: 'outbound',
    });
    setForm({ name: '', url: '', eventTypes: '*' });
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading webhooks…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium text-white">
          <Webhook size={16} className="text-violet-400" /> Webhook Engine
        </h3>
        <button onClick={load} className="flex items-center gap-1 text-xs text-slate-500 hover:text-white">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="command-card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input placeholder="Webhook name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
        <input placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
        <input placeholder="Event types (* or comma-separated)" value={form.eventTypes} onChange={(e) => setForm({ ...form, eventTypes: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white" />
        <button onClick={handleCreate} disabled={!form.name || !form.url} className="flex items-center justify-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-sm text-white hover:bg-teal-500 disabled:opacity-40">
          <Plus size={14} /> Add Webhook
        </button>
      </div>

      <div className="space-y-2">
        {webhooks.map((w) => (
          <div key={String(w.id)} className="command-card flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div>
              <div className="font-medium text-white">{String(w.name)}</div>
              <div className="text-xs text-slate-500">{String(w.url)}</div>
              <div className="text-xs text-slate-600">
                {(w.eventTypes as string[])?.join(', ')} · {Number(w.deliveryCount ?? 0)} delivered · {Number(w.failureCount ?? 0)} failed
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => integrationsApi.webhooks.test(String(w.id)).then(load)} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-400 hover:text-white">Test</button>
              <button onClick={() => integrationsApi.webhooks.delete(String(w.id)).then(load)} className="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-400">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
        {!webhooks.length && <p className="text-sm text-slate-500">No webhooks configured. Add one to deliver events to external systems.</p>}
      </div>

      <div className="command-card p-4 text-xs text-slate-500">
        <strong className="text-slate-400">Inbound:</strong> POST /integrations/webhooks/receive with <code className="text-teal-400">X-API-Key</code> header to publish external events into AFIOS.
      </div>
    </div>
  );
}
