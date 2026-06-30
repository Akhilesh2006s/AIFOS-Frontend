import { useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { ModulePageLayout } from '@/components/layout/ModulePageLayout';
import { IntegrationsConnectorTab, type ConnSub } from '@/components/integrations/IntegrationsConnectorTab';
import { IntegrationsGatewayTab, type GatewaySub } from '@/components/integrations/IntegrationsGatewayTab';
import { IntegrationsEventsTab } from '@/components/integrations/IntegrationsEventsTab';
import { IntegrationsWebhooksTab } from '@/components/integrations/IntegrationsWebhooksTab';
import { IntegrationsErpTab, type ErpSub } from '@/components/integrations/IntegrationsErpTab';
import { IntegrationsFieldTab, type FieldSub } from '@/components/integrations/IntegrationsFieldTab';
import { IntegrationsCommTab, type CommSub } from '@/components/integrations/IntegrationsCommTab';
import { ModuleTabs } from '@/components/layout/ModuleTabs';

const TABS = ['connectors', 'comm', 'field', 'erp', 'gateway', 'events', 'webhooks'] as const;
type TabId = (typeof TABS)[number];

const TAB_LABELS: Record<TabId, string> = {
  connectors: 'Connector Manager',
  comm: 'Communication',
  field: 'Field Integration',
  erp: 'ERP Sync',
  gateway: 'REST Gateway',
  events: 'Event Bus',
  webhooks: 'Webhooks',
};

export function IntegrationsWorkspacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as TabId) || 'connectors';
  const connSub = (searchParams.get('sub') as ConnSub) || 'dashboard';
  const gatewaySub = (searchParams.get('sub') as GatewaySub) || 'dashboard';
  const erpSub = (searchParams.get('sub') as ErpSub) || 'dashboard';
  const fieldSub = (searchParams.get('sub') as FieldSub) || 'dashboard';
  const commSub = (searchParams.get('sub') as CommSub) || 'dashboard';

  const setTab = (t: TabId) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', t);
    if (['connectors', 'gateway', 'erp', 'field', 'comm'].includes(t)) next.set('sub', 'dashboard');
    else next.delete('sub');
    setSearchParams(next);
  };

  const setConnSub = (sub: ConnSub) => { const next = new URLSearchParams(searchParams); next.set('tab', 'connectors'); next.set('sub', sub); setSearchParams(next); };
  const setGatewaySub = (sub: GatewaySub) => { const next = new URLSearchParams(searchParams); next.set('tab', 'gateway'); next.set('sub', sub); setSearchParams(next); };
  const setErpSub = (sub: ErpSub) => { const next = new URLSearchParams(searchParams); next.set('tab', 'erp'); next.set('sub', sub); setSearchParams(next); };
  const setFieldSub = (sub: FieldSub) => { const next = new URLSearchParams(searchParams); next.set('tab', 'field'); next.set('sub', sub); setSearchParams(next); };
  const setCommSub = (sub: CommSub) => { const next = new URLSearchParams(searchParams); next.set('tab', 'comm'); next.set('sub', sub); setSearchParams(next); };

  const tabs = (
    <ModuleTabs
      tabs={TABS.map((t) => ({ id: t, label: TAB_LABELS[t] }))}
      active={tab}
      onChange={(id) => setTab(id as TabId)}
    />
  );

  const subtitles: Record<TabId, string> = {
    connectors: 'Connector registry · install · configure · monitor · logs',
    comm: 'Email · SMS · WhatsApp · Teams · Slack · templates · campaigns · workflow notify',
    field: 'GPS · RFID · biometric · fuel · IoT · OEM · telemetry · health',
    erp: 'ERP adapters · field mapping · sync jobs · history · errors',
    gateway: 'REST gateway · routes · retries · API keys · rate limiting',
    events: 'Event bus · publish · history · financial event bridge',
    webhooks: 'Webhook engine · outbound delivery · inbound receive',
  };

  return (
    <ModulePageLayout title="Integration Platform" subtitle={subtitles[tab]} loading={false} tabs={tabs}
      heroActions={
        <button type="button" onClick={() => window.location.reload()} className="btn-ghost btn-sm flex items-center gap-1">
          <RefreshCw size={14} /> Refresh
        </button>
      }
    >
      {tab === 'connectors' && <IntegrationsConnectorTab sub={connSub} onSubChange={setConnSub} />}
      {tab === 'comm' && <IntegrationsCommTab sub={commSub} onSubChange={setCommSub} />}
      {tab === 'field' && <IntegrationsFieldTab sub={fieldSub} onSubChange={setFieldSub} />}
      {tab === 'erp' && <IntegrationsErpTab sub={erpSub} onSubChange={setErpSub} />}
      {tab === 'gateway' && <IntegrationsGatewayTab sub={gatewaySub} onSubChange={setGatewaySub} />}
      {tab === 'events' && <IntegrationsEventsTab />}
      {tab === 'webhooks' && <IntegrationsWebhooksTab />}
    </ModulePageLayout>
  );
}
