export type ExplorerEntityType =
  | 'project'
  | 'site'
  | 'boq'
  | 'material-requirement'
  | 'purchase-request'
  | 'rfq'
  | 'quotation'
  | 'purchase-order'
  | 'grn'
  | 'warehouse-material'
  | 'material-issue'
  | 'consumption'
  | 'vendor'
  | 'vendor-bill'
  | 'payment'
  | 'equipment'
  | 'fleet-vehicle'
  | 'maintenance'
  | 'fuel-entry'
  | 'operator'
  | 'employee'
  | 'team'
  | 'attendance'
  | 'permit'
  | 'safety-incident'
  | 'inspection'
  | 'ncr'
  | 'capa'
  | 'document'
  | 'compliance-record'
  | 'milestone';

const KIND_TO_EXPLORER: Record<string, ExplorerEntityType> = {
  project: 'project',
  site: 'site',
  boq: 'boq',
  material_requirement: 'material-requirement',
  mr: 'material-requirement',
  pr: 'purchase-request',
  purchase_request: 'purchase-request',
  rfq: 'rfq',
  quotation: 'quotation',
  po: 'purchase-order',
  purchase_order: 'purchase-order',
  grn: 'grn',
  material: 'warehouse-material',
  warehouse_material: 'warehouse-material',
  material_issue: 'material-issue',
  consumption: 'consumption',
  vendor: 'vendor',
  vendor_bill: 'vendor-bill',
  bill: 'vendor-bill',
  payment: 'payment',
  equipment: 'equipment',
  fleet_vehicle: 'fleet-vehicle',
  vehicle: 'fleet-vehicle',
  maintenance: 'maintenance',
  work_order: 'maintenance',
  fuel_entry: 'fuel-entry',
  operator: 'operator',
  employee: 'employee',
  team: 'team',
  attendance: 'attendance',
  permit: 'permit',
  safety_incident: 'safety-incident',
  inspection: 'inspection',
  ncr: 'ncr',
  capa: 'capa',
  document: 'document',
  compliance: 'compliance-record',
  compliance_record: 'compliance-record',
  milestone: 'milestone',
  issue: 'project',
};

export function explorerPath(type: ExplorerEntityType | string, id: string): string {
  return `/explore/${type}/${id}`;
}

export function explorerPrByNumber(prNumber: string): string {
  return `/explore/purchase-request/by-number/${encodeURIComponent(prNumber)}`;
}

export function resolveExplorerKind(kind: string, id: string): string {
  const normalized = KIND_TO_EXPLORER[kind] ?? kind.replace(/_/g, '-') as ExplorerEntityType;
  if (kind === 'pr' && id === 'PR-1024') return explorerPrByNumber('PR-1024');
  return explorerPath(normalized, id);
}

export function resolveEntityLink(entityType?: string, entityId?: string, fallback = '/mission-control'): string {
  if (!entityType || !entityId) return fallback;
  const key = entityType.toLowerCase().replace(/\s+/g, '_');
  const mapped = KIND_TO_EXPLORER[key] ?? entityType.replace(/_/g, '-');
  return explorerPath(mapped, entityId);
}
