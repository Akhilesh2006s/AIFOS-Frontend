import { useCallback, useEffect, useState } from 'react';
import { History, Loader2, RefreshCw, Send } from 'lucide-react';
import { integrationsApi } from '@/api/client';

export function IntegrationsEventsTab() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [types, setTypes] = useState<Array<{ type: string; label: string }>>([]);
  const [form, setForm] = useState({ eventType: 'integration.custom', payload: '{"message":"test event"}' });
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, s, t] = await Promise.all([
        integrationsApi.events.history(50),
        integrationsApi.events.stats(),
        integrationsApi.events.types(),
      ]);
      setHistory(h.data);
      setStats(s.data);
      setTypes((t.data as { types: Array<{ type: string; label: string }> }).types || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(form.payload);
      } catch {
        payload = { message: form.payload };
      }
      await integrationsApi.events.publish({ eventType: form.eventType, payload, source: 'manual' });
      await load();
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading events…
      </div>
    );
  }

  const byType = (stats?.byType || []) as Array<{ eventType: string; count: number }>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium text-white">
          <History size={16} className="text-sky-400" /> Event Bus
        </h3>
        <button onClick={load} className="flex items-center gap-1 text-xs text-slate-500 hover:text-white">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="command-card px-4 py-3">
          <div className="text-xs text-slate-500">Total Events</div>
          <div className="text-xl font-semibold text-white">{String(stats?.total ?? 0)}</div>
        </div>
        <div className="command-card px-4 py-3">
          <div className="text-xs text-slate-500">Last 24h</div>
          <div className="text-xl font-semibold text-white">{String(stats?.last24h ?? 0)}</div>
        </div>
        <div className="command-card px-4 py-3">
          <div className="text-xs text-slate-500">Event Types</div>
          <div className="text-xl font-semibold text-white">{types.length}</div>
        </div>
        <div className="command-card px-4 py-3">
          <div className="text-xs text-slate-500">Top Type</div>
          <div className="truncate text-sm font-semibold text-teal-300">{byType[0]?.eventType || '—'}</div>
        </div>
      </div>

      <div className="command-card p-4">
        <h4 className="mb-3 text-sm font-medium text-white">Publish Event</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <select value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
            {types.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
          </select>
          <button onClick={handlePublish} disabled={publishing} className="flex items-center justify-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-sm text-white hover:bg-teal-500 disabled:opacity-40">
            <Send size={14} /> {publishing ? 'Publishing…' : 'Publish'}
          </button>
        </div>
        <textarea
          value={form.payload}
          onChange={(e) => setForm({ ...form, payload: e.target.value })}
          rows={3}
          className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white"
          placeholder='{"projectId":"..."}'
        />
      </div>

      <div className="command-card p-4">
        <h4 className="mb-3 text-sm font-medium text-white">Event History</h4>
        <div className="space-y-2">
          {history.map((e) => (
            <div key={String(e.id)} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs">
              <div>
                <span className="font-medium text-white">{String(e.eventType)}</span>
                <span className="ml-2 text-slate-500">via {String(e.source)}</span>
              </div>
              <div className="text-slate-500">
                {e.deliveryCount ? `${e.deliveryCount} deliveries` : 'no deliveries'}
                {e.publishedAt ? ` · ${new Date(String(e.publishedAt)).toLocaleString()}` : ''}
              </div>
            </div>
          ))}
          {!history.length && <p className="text-xs text-slate-500">No events published yet.</p>}
        </div>
      </div>
    </div>
  );
}
