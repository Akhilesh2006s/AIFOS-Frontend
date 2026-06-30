import axios from 'axios';
import { getActiveOrgHeader } from '@/store/org';
import { getStoredToken } from '@/store/auth';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const orgHeaders = getActiveOrgHeader();
  Object.assign(config.headers, orgHeaders);
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config as { _retry?: number; url?: string } | undefined;
    const status = err.response?.status;
    const isRetryable = !status || status >= 502 || status === 429;
    const retries = config?._retry ?? 0;

    if (config && isRetryable && retries < 2 && !config.url?.includes('/auth/login')) {
      config._retry = retries + 1;
      await new Promise((r) => setTimeout(r, 400 * (retries + 1)));
      return api.request(config);
    }

    if (status === 401) {
      sessionStorage.removeItem('afios_token');
      sessionStorage.removeItem('afios_user');
      localStorage.removeItem('afios_token');
      localStorage.removeItem('afios_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const analyticsApi = {
  executive: () => api.get('/analytics/executive'),
};

export const workflowApi = {
  pipeline: (projectId: string) => api.get(`/workflow/pipeline/${projectId}`),
  sendMrToProcurement: (mrId: string) => api.post(`/workflow/mr/${mrId}/to-procurement`),
  approveAndRfq: (prId: string, data: { approvedBy: string; level: number; vendorIds: string[] }) =>
    api.post(`/workflow/pr/${prId}/approve-rfq`, data),
  awardPO: (rfqId: string, quotationId: string) =>
    api.post(`/workflow/rfq/${rfqId}/award`, { quotationId }),
  receiveGoods: (poId: string, data: object) => api.post(`/workflow/po/${poId}/grn`, data),
  issueToSite: (data: object) => api.post('/workflow/issue-to-site', data),
};

export const dashboardsApi = {
  me: () => api.get('/dashboards/me'),
  byRole: (role: string) => api.get(`/dashboards/${role}`),
  layout: (role: string) => api.get(`/dashboards/${role}/layout`),
  roles: () => api.get('/dashboards/roles'),
};

export const moduleApi = {
  procurement: {
    stats: () => api.get('/procurement/stats'),
    prs: (projectId?: string) => api.get('/procurement/purchase-requests', { params: projectId ? { projectId } : {} }),
    getPR: (id: string) => api.get(`/procurement/purchase-requests/${id}`),
    createPR: (data: object) => api.post('/procurement/purchase-requests', data),
    updatePR: (id: string, data: object) => api.patch(`/procurement/purchase-requests/${id}`, data),
    deletePR: (id: string) => api.delete(`/procurement/purchase-requests/${id}`),
    submitPR: (id: string, by?: string) => api.post(`/procurement/purchase-requests/${id}/submit`, { by }),
    approvePR: (id: string, data: { approvedBy: string; level: number; remarks?: string }) =>
      api.post(`/procurement/purchase-requests/${id}/approve`, data),
    rejectPR: (id: string, data: { rejectedBy: string; reason: string }) =>
      api.post(`/procurement/purchase-requests/${id}/reject`, data),
    revisePR: (id: string, by?: string) => api.post(`/procurement/purchase-requests/${id}/revise`, { by }),
    rfqs: (projectId?: string) => api.get('/procurement/rfqs', { params: projectId ? { projectId } : {} }),
    getRfq: (id: string) => api.get(`/procurement/rfqs/${id}`),
    createRfq: (prId: string, data: { vendorIds: string[]; closingDate?: string }) =>
      api.post(`/procurement/purchase-requests/${prId}/rfq`, data),
    publishRfq: (id: string) => api.post(`/procurement/rfqs/${id}/publish`),
    quotations: (rfqId: string) => api.get(`/procurement/rfqs/${rfqId}/quotations`),
    compareQuotations: (rfqId: string, strategy?: string, winnerId?: string) =>
      api.get(`/procurement/rfqs/${rfqId}/compare`, { params: { strategy, winnerId } }),
    submitQuotation: (rfqId: string, data: object) =>
      api.post(`/procurement/rfqs/${rfqId}/quotations`, data),
    awardQuotation: (rfqId: string, quotationId: string, awardedBy?: string) =>
      api.post(`/procurement/rfqs/${rfqId}/award`, { quotationId, awardedBy }),
    pos: (projectId?: string) => api.get('/procurement/purchase-orders', { params: projectId ? { projectId } : {} }),
    updatePOStatus: (id: string, status: string, by?: string) =>
      api.patch(`/procurement/purchase-orders/${id}/status`, { status, by }),
    approvePO: (id: string, approvedBy: string) => api.post(`/procurement/purchase-orders/${id}/approve`, { approvedBy }),
    issuePO: (id: string, issuedBy: string) => api.post(`/procurement/purchase-orders/${id}/issue`, { issuedBy }),
    vendors: () => api.get('/procurement/vendors'),
    createVendor: (data: object) => api.post('/procurement/vendors', data),
    updateVendor: (id: string, data: object) => api.patch(`/procurement/vendors/${id}`, data),
    deleteVendor: (id: string) => api.delete(`/procurement/vendors/${id}`),
  },
  supplyChain: {
    dashboard: (projectId?: string) => api.get('/supply-chain/dashboard', { params: projectId ? { projectId } : {} }),
    search: (q: string, projectId?: string) => api.get('/supply-chain/search', { params: { q, projectId } }),
    pipeline: (projectId: string) => api.get(`/supply-chain/pipeline/${projectId}`),
  },
  vendors: {
    stats: () => api.get('/vendors/stats'),
    list: () => api.get('/vendors'),
    create: (data: object) => api.post('/vendors', data),
    update: (id: string, data: object) => api.patch(`/vendors/${id}`, data),
    approve: (id: string) => api.post(`/vendors/${id}/approve`),
    remove: (id: string) => api.delete(`/vendors/${id}`),
  },
  inventory: {
    stats: () => api.get('/inventory/stats'),
    materials: () => api.get('/inventory/materials'),
    createMaterial: (data: object) => api.post('/inventory/materials', data),
    updateMaterial: (id: string, data: object) => api.patch(`/inventory/materials/${id}`, data),
    deleteMaterial: (id: string) => api.delete(`/inventory/materials/${id}`),
    movements: () => api.get('/inventory/movements'),
    createMovement: (data: object) => api.post('/inventory/movements', data),
    warehouses: () => api.get('/inventory/warehouses'),
    grns: () => api.get('/inventory/grns'),
    createGrn: (poId: string, data: object) => api.post(`/inventory/purchase-orders/${poId}/grn`, data),
    issues: () => api.get('/inventory/issues'),
    issueToSite: (data: object) => api.post('/inventory/issues', data),
  },
  consumption: {
    stats: () => api.get('/consumption/stats'),
    stores: (projectId: string) => api.get(`/consumption/stores/${projectId}`),
    entries: () => api.get('/consumption/entries'),
    recordUsage: (data: object) => api.post('/consumption/usage', data),
    recordWastage: (data: object) => api.post('/consumption/wastage', data),
    syncFromIssue: (issueId: string) => api.post(`/consumption/from-issue/${issueId}`),
    reconcile: (projectId: string, siteId: string, materialId: string) =>
      api.get(`/consumption/reconciliation/${projectId}/${siteId}/${materialId}`),
  },
  equipment: {
    stats: () => api.get('/equipment/stats'),
    list: (includeArchived?: boolean) => api.get('/equipment', { params: includeArchived ? { includeArchived: 'true' } : {} }),
    get: (id: string) => api.get(`/equipment/${id}`),
    profile: (id: string) => api.get(`/equipment/${id}/profile`),
    timeline: (id: string) => api.get(`/equipment/${id}/timeline`),
    fuelStats: (id: string) => api.get(`/equipment/${id}/fuel-stats`),
    create: (data: object) => api.post('/equipment', data),
    update: (id: string, data: object) => api.patch(`/equipment/${id}`, data),
    remove: (id: string) => api.delete(`/equipment/${id}`),
    transfer: (id: string, data: object) => api.post(`/equipment/${id}/transfer`, data),
    archive: (id: string, by?: string) => api.post(`/equipment/${id}/archive`, { by }),
    assignOperator: (id: string, data: object) => api.post(`/equipment/${id}/assign-operator`, data),
    recordFuel: (id: string, data: object) => api.post(`/equipment/${id}/fuel`, data),
    recordHours: (id: string, data: object) => api.post(`/equipment/${id}/engine-hours`, data),
    fuel: (equipmentId?: string) => api.get('/equipment/fuel', { params: equipmentId ? { equipmentId } : {} }),
    engineHours: (equipmentId?: string) => api.get('/equipment/engine-hours', { params: equipmentId ? { equipmentId } : {} }),
    operators: () => api.get('/equipment/operators'),
    createOperator: (data: object) => api.post('/equipment/operators', data),
  },
  assets: {
    dashboard: (projectId?: string) => api.get('/assets/dashboard', { params: projectId ? { projectId } : {} }),
    search: (q: string, projectId?: string) => api.get('/assets/search', { params: { q, projectId } }),
    reports: (projectId?: string) => api.get('/assets/reports', { params: projectId ? { projectId } : {} }),
  },
  fleet: {
    stats: () => api.get('/fleet/stats'),
    vehicles: () => api.get('/fleet/vehicles'),
    get: (id: string) => api.get(`/fleet/vehicles/${id}`),
    create: (data: object) => api.post('/fleet/vehicles', data),
    update: (id: string, data: object) => api.patch(`/fleet/vehicles/${id}`, data),
    remove: (id: string) => api.delete(`/fleet/vehicles/${id}`),
    drivers: () => api.get('/fleet/drivers'),
    trips: (vehicleId?: string) => api.get('/fleet/trips', { params: vehicleId ? { vehicleId } : {} }),
    createTrip: (data: object) => api.post('/fleet/trips', data),
    fuel: (vehicleId?: string) => api.get('/fleet/fuel', { params: vehicleId ? { vehicleId } : {} }),
    recordFuel: (vehicleId: string, data: object) => api.post(`/fleet/vehicles/${vehicleId}/fuel`, data),
  },
  maintenance: {
    stats: () => api.get('/maintenance/stats'),
    workOrders: (equipmentId?: string) => api.get('/maintenance/work-orders', { params: equipmentId ? { equipmentId } : {} }),
    calendar: () => api.get('/maintenance/calendar'),
    breakdowns: (equipmentId?: string) => api.get('/maintenance/breakdowns', { params: equipmentId ? { equipmentId } : {} }),
    createBreakdown: (data: object) => api.post('/maintenance/breakdowns', data),
    create: (data: object) => api.post('/maintenance/work-orders', data),
    update: (id: string, data: object) => api.patch(`/maintenance/work-orders/${id}`, data),
    complete: (id: string, data: object) => api.post(`/maintenance/work-orders/${id}/complete`, data),
    remove: (id: string) => api.delete(`/maintenance/work-orders/${id}`),
  },
  projects: {
    stats: () => api.get('/projects/stats'),
    list: (filter?: string) => api.get('/projects', { params: filter ? { filter } : {} }),
    create: (data: object) => api.post('/projects', data),
    update: (id: string, data: object) => api.patch(`/projects/${id}`, data),
    remove: (id: string) => api.delete(`/projects/${id}`),
    flow: (id: string) => api.get(`/projects/${id}/flow`),
    operationalChain: (id: string) => api.get(`/projects/${id}/operational-chain`),
    analytics: (id: string) => api.get(`/projects/${id}/analytics`),
    sites: (id: string) => api.get(`/projects/${id}/sites`),
    createSite: (id: string, data: object) => api.post(`/projects/${id}/sites`, data),
    boq: (id: string) => api.get(`/projects/${id}/boq`),
    createBoqLine: (id: string, data: object) => api.post(`/projects/${id}/boq`, data),
    updateBoqLine: (id: string, lineId: string, data: object) => api.patch(`/projects/${id}/boq/${lineId}`, data),
    deleteBoqLine: (id: string, lineId: string) => api.delete(`/projects/${id}/boq/${lineId}`),
    deriveRequirements: (id: string, requestedBy?: string) =>
      api.post(`/projects/${id}/derive-requirements`, { requestedBy }),
    approveMr: (projectId: string, mrId: string) =>
      api.post(`/projects/${projectId}/material-requirements/${mrId}/approve`),
    materialRequirements: (id?: string) =>
      id ? api.get(`/projects/${id}/material-requirements`) : api.get('/projects/material-requirements/list'),
    issues: (id: string) => api.get(`/projects/${id}/issues`),
    createIssue: (id: string, data: object) => api.post(`/projects/${id}/issues`, data),
    updateIssue: (id: string, issueId: string, data: object) => api.patch(`/projects/${id}/issues/${issueId}`, data),
    dailyReports: (id: string) => api.get(`/projects/${id}/daily-reports`),
    createDailyReport: (id: string, data: object) => api.post(`/projects/${id}/daily-reports`, data),
    documents: (id: string) => api.get(`/projects/${id}/documents`),
    createDocument: (id: string, data: object) => api.post(`/projects/${id}/documents`, data),
    milestones: (id: string) => api.get(`/projects/${id}/milestones`),
    createMilestone: (id: string, data: object) => api.post(`/projects/${id}/milestones`, data),
    updateMilestone: (id: string, milestoneId: string, data: object) =>
      api.patch(`/projects/${id}/milestones/${milestoneId}`, data),
    health: (id: string) => api.get(`/projects/${id}/health`),
    dashboard: (id: string) => api.get(`/projects/${id}/dashboard`),
    search: (q: string, projectId?: string) => api.get('/projects/search', { params: { q, projectId } }),
    allocations: (id: string) => api.get(`/projects/${id}/allocations`),
    createAllocation: (id: string, data: object) => api.post(`/projects/${id}/allocations`, data),
    updateAllocation: (id: string, allocationId: string, data: object) =>
      api.patch(`/projects/${id}/allocations/${allocationId}`, data),
    updateDailyReport: (id: string, reportId: string, data: object) =>
      api.patch(`/projects/${id}/daily-reports/${reportId}`, data),
    submitDailyReport: (id: string, reportId: string) =>
      api.post(`/projects/${id}/daily-reports/${reportId}/submit`),
  },
  documents: {
    list: (projectId: string, category?: string) =>
      api.get('/documents', { params: { projectId, category } }),
    centerDashboard: (projectId?: string) =>
      api.get('/documents/center/dashboard', { params: projectId ? { projectId } : {} }),
    search: (params?: Record<string, string | boolean>) =>
      api.get('/documents/center/search', { params }),
    byEntity: (entityType: string, entityId: string) =>
      api.get('/documents/by-entity', { params: { entityType, entityId } }),
    get: (id: string) => api.get(`/documents/${id}`),
    versions: (id: string) => api.get(`/documents/${id}/versions`),
    upload: (formData: FormData) =>
      api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    uploadMultiple: (formData: FormData) =>
      api.post('/documents/upload-multiple', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    newVersion: (id: string, formData: FormData) =>
      api.post(`/documents/${id}/new-version`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    submitApproval: (id: string) => api.post(`/documents/${id}/submit-approval`),
    approve: (id: string, comment?: string) => api.post(`/documents/${id}/approve`, { comment }),
    reject: (id: string, reason?: string) => api.post(`/documents/${id}/reject`, { reason }),
    archive: (id: string) => api.post(`/documents/${id}/archive`),
    restore: (id: string) => api.post(`/documents/${id}/restore`),
    update: (id: string, data: object) => api.patch(`/documents/${id}`, data),
    remove: (id: string) => api.delete(`/documents/${id}`),
  },
  notifications: {
    list: (params?: { projectId?: string; read?: boolean; type?: string }) =>
      api.get('/notifications', { params }),
    unreadCount: (projectId?: string) => api.get('/notifications/unread-count', { params: projectId ? { projectId } : {} }),
    markRead: (id: string) => api.patch(`/notifications/${id}/read`),
    markAllRead: (projectId?: string) =>
      projectId
        ? api.patch(`/notifications/project/${projectId}/read-all`)
        : api.patch('/notifications/read-all'),
  },
  compliance: {
    stats: () => api.get('/compliance/stats'),
    alerts: () => api.get('/compliance/alerts'),
    centerDashboard: () => api.get('/compliance/center/dashboard'),
    categories: () => api.get('/compliance/categories'),
    renewals: (status?: string) => api.get('/compliance/renewals', { params: status ? { status } : {} }),
    timeline: (limit?: number) => api.get('/compliance/timeline', { params: limit ? { limit: String(limit) } : {} }),
    search: (q: string) => api.get('/compliance/search', { params: { q } }),
    contracts: (projectId?: string) => api.get('/compliance/contracts', { params: projectId ? { projectId } : {} }),
    records: (entityId?: string, category?: string) =>
      api.get('/compliance/records', { params: { ...(entityId ? { entityId } : {}), ...(category ? { category } : {}) } }),
    get: (id: string) => api.get(`/compliance/records/${id}`),
    create: (data: object) => api.post('/compliance/records', data),
    update: (id: string, data: object) => api.patch(`/compliance/records/${id}`, data),
    remove: (id: string) => api.delete(`/compliance/records/${id}`),
    startRenewal: (id: string) => api.post(`/compliance/records/${id}/start-renewal`),
    completeRenewal: (id: string, data: { newExpiry: string; documentId?: string; notes?: string }) =>
      api.post(`/compliance/records/${id}/complete-renewal`, data),
    submitApproval: (id: string) => api.post(`/compliance/records/${id}/submit-approval`),
    approve: (id: string, comment?: string) => api.post(`/compliance/records/${id}/approve`, { comment }),
    reject: (id: string, reason?: string) => api.post(`/compliance/records/${id}/reject`, { reason }),
    escalate: (id: string) => api.post(`/compliance/records/${id}/escalate`),
    linkDocument: (id: string, documentId: string) =>
      api.post(`/compliance/records/${id}/link-document`, { documentId }),
  },
  workforce: {
    dashboard: (projectId?: string) => api.get('/workforce/dashboard', { params: projectId ? { projectId } : {} }),
    employees: (projectId?: string) => api.get('/workforce/employees', { params: projectId ? { projectId } : {} }),
    getEmployee: (id: string) => api.get(`/workforce/employees/${id}`),
    createEmployee: (data: object) => api.post('/workforce/employees', data),
    updateEmployee: (id: string, data: object) => api.patch(`/workforce/employees/${id}`, data),
    contractors: (projectId?: string) => api.get('/workforce/contractors', { params: projectId ? { projectId } : {} }),
    createContractor: (data: object) => api.post('/workforce/contractors', data),
    teams: (projectId?: string) => api.get('/workforce/teams', { params: projectId ? { projectId } : {} }),
    createTeam: (data: object) => api.post('/workforce/teams', data),
    allocations: (projectId?: string) => api.get('/workforce/allocations', { params: projectId ? { projectId } : {} }),
    createAllocation: (data: object) => api.post('/workforce/allocations', data),
    attendance: (projectId?: string, employeeId?: string) =>
      api.get('/workforce/attendance', { params: { ...(projectId ? { projectId } : {}), ...(employeeId ? { employeeId } : {}) } }),
    checkIn: (data: object) => api.post('/workforce/attendance/checkin', data),
    checkOut: (id: string, data: object) => api.post(`/workforce/attendance/${id}/checkout`, data),
    safety: {
      dashboard: (projectId?: string) => api.get('/workforce/safety/dashboard', { params: projectId ? { projectId } : {} }),
      ppe: (projectId?: string) => api.get('/workforce/safety/ppe', { params: projectId ? { projectId } : {} }),
      issuePpe: (data: object) => api.post('/workforce/safety/ppe/issue', data),
      returnPpe: (id: string, data: object) => api.post(`/workforce/safety/ppe/${id}/return`, data),
      toolboxTalks: (projectId?: string) => api.get('/workforce/safety/toolbox-talks', { params: projectId ? { projectId } : {} }),
      createToolboxTalk: (data: object) => api.post('/workforce/safety/toolbox-talks', data),
      incidents: (projectId?: string) => api.get('/workforce/safety/incidents', { params: projectId ? { projectId } : {} }),
      createIncident: (data: object) => api.post('/workforce/safety/incidents', data),
      nearMiss: (projectId?: string) => api.get('/workforce/safety/near-miss', { params: projectId ? { projectId } : {} }),
      createNearMiss: (data: object) => api.post('/workforce/safety/near-miss', data),
      observations: (projectId?: string) => api.get('/workforce/safety/observations', { params: projectId ? { projectId } : {} }),
      createObservation: (data: object) => api.post('/workforce/safety/observations', data),
      emergency: (projectId: string) => api.get('/workforce/safety/emergency', { params: { projectId } }),
    },
    permits: {
      dashboard: (projectId?: string) => api.get('/workforce/permits/dashboard', { params: projectId ? { projectId } : {} }),
      list: (projectId?: string, status?: string) =>
        api.get('/workforce/permits', { params: { ...(projectId ? { projectId } : {}), ...(status ? { status } : {}) } }),
      get: (id: string) => api.get(`/workforce/permits/${id}`),
      search: (q: string, projectId?: string) =>
        api.get('/workforce/permits/search', { params: { q, ...(projectId ? { projectId } : {}) } }),
      create: (data: object) => api.post('/workforce/permits', data),
      update: (id: string, data: object) => api.patch(`/workforce/permits/${id}`, data),
      submit: (id: string, data?: object) => api.post(`/workforce/permits/${id}/submit`, data || {}),
      review: (id: string, data?: object) => api.post(`/workforce/permits/${id}/review`, data || {}),
      approve: (id: string, data?: object) => api.post(`/workforce/permits/${id}/approve`, data || {}),
      reject: (id: string, data?: object) => api.post(`/workforce/permits/${id}/reject`, data || {}),
      start: (id: string, data?: object) => api.post(`/workforce/permits/${id}/start`, data || {}),
      suspend: (id: string, data?: object) => api.post(`/workforce/permits/${id}/suspend`, data || {}),
      complete: (id: string, data?: object) => api.post(`/workforce/permits/${id}/complete`, data || {}),
      close: (id: string, data?: object) => api.post(`/workforce/permits/${id}/close`, data || {}),
    },
    quality: {
      dashboard: (projectId?: string) => api.get('/workforce/quality/dashboard', { params: projectId ? { projectId } : {} }),
      inspections: (projectId?: string, status?: string) =>
        api.get('/workforce/quality/inspections', { params: { ...(projectId ? { projectId } : {}), ...(status ? { status } : {}) } }),
      getInspection: (id: string) => api.get(`/workforce/quality/inspections/${id}`),
      createInspection: (data: object) => api.post('/workforce/quality/inspections', data),
      updateInspection: (id: string, data: object) => api.patch(`/workforce/quality/inspections/${id}`, data),
      tests: (projectId?: string) => api.get('/workforce/quality/tests', { params: projectId ? { projectId } : {} }),
      getTest: (id: string) => api.get(`/workforce/quality/tests/${id}`),
      createTest: (data: object) => api.post('/workforce/quality/tests', data),
      checklists: (projectId?: string) => api.get('/workforce/quality/checklists', { params: projectId ? { projectId } : {} }),
      createChecklist: (data: object) => api.post('/workforce/quality/checklists', data),
      ncr: (projectId?: string) => api.get('/workforce/quality/ncr', { params: projectId ? { projectId } : {} }),
      getNcr: (id: string) => api.get(`/workforce/quality/ncr/${id}`),
      createNcr: (data: object) => api.post('/workforce/quality/ncr', data),
      updateNcr: (id: string, data: object) => api.patch(`/workforce/quality/ncr/${id}`, data),
      closeNcr: (id: string, data?: object) => api.post(`/workforce/quality/ncr/${id}/close`, data || {}),
      capa: (projectId?: string) => api.get('/workforce/quality/capa', { params: projectId ? { projectId } : {} }),
      getCapa: (id: string) => api.get(`/workforce/quality/capa/${id}`),
      createCapa: (data: object) => api.post('/workforce/quality/capa', data),
      updateCapa: (id: string, data: object) => api.patch(`/workforce/quality/capa/${id}`, data),
      search: (q: string, projectId?: string) =>
        api.get('/workforce/quality/search', { params: { q, ...(projectId ? { projectId } : {}) } }),
    },
    productivity: {
      dashboard: (projectId?: string) => api.get('/workforce/productivity/dashboard', { params: projectId ? { projectId } : {} }),
      list: (projectId?: string) => api.get('/workforce/productivity', { params: projectId ? { projectId } : {} }),
      create: (data: object) => api.post('/workforce/productivity', data),
    },
    training: {
      list: (projectId?: string) => api.get('/workforce/training', { params: projectId ? { projectId } : {} }),
      create: (data: object) => api.post('/workforce/training', data),
    },
    skills: {
      list: (projectId?: string, employeeId?: string) =>
        api.get('/workforce/skills', { params: { ...(projectId ? { projectId } : {}), ...(employeeId ? { employeeId } : {}) } }),
      create: (data: object) => api.post('/workforce/skills', data),
    },
    certifications: {
      list: (projectId?: string, employeeId?: string) =>
        api.get('/workforce/certifications', { params: { ...(projectId ? { projectId } : {}), ...(employeeId ? { employeeId } : {}) } }),
      create: (data: object) => api.post('/workforce/certifications', data),
    },
    performance: {
      get: (projectId?: string) => api.get('/workforce/performance', { params: projectId ? { projectId } : {} }),
    },
    intelligence: {
      get: (projectId?: string) => api.get('/workforce/intelligence', { params: projectId ? { projectId } : {} }),
      dashboard: (projectId?: string) => api.get('/workforce/w5/dashboard', { params: projectId ? { projectId } : {} }),
    },
  },
  business: {
    dashboard: (projectId?: string) => api.get('/business/dashboard', { params: projectId ? { projectId } : {} }),
    project: (id: string) => api.get(`/business/project/${id}`),
    projectIntelligence: (id: string) => api.get(`/business/project/${id}/intelligence`),
    projectVariance: (id: string) => api.get(`/business/project/${id}/variance`),
    projectForecast: (id: string) => api.get(`/business/project/${id}/forecast`),
    projectHeatmap: (id: string) => api.get(`/business/project/${id}/heatmap`),
    projectBreakdown: (id: string, costCategory?: string) =>
      api.get(`/business/project/${id}/breakdown`, { params: costCategory ? { costCategory } : {} }),
    costDrivers: (params?: Record<string, string>) => api.get('/business/cost-drivers', { params }),
    costTimeline: (params?: Record<string, string>) => api.get('/business/cost-timeline', { params }),
    recommendations: (projectId?: string) => api.get('/business/recommendations', { params: projectId ? { projectId } : {} }),
    heatmap: (projectId?: string) => api.get('/business/heatmap', { params: projectId ? { projectId } : {} }),
    costCenters: (projectId?: string) => api.get('/business/cost-centers', { params: projectId ? { projectId } : {} }),
    budget: (projectId?: string) => api.get('/business/budget', { params: projectId ? { projectId } : {} }),
    budgetVsActual: (projectId?: string) => api.get('/business/budget-vs-actual', { params: projectId ? { projectId } : {} }),
    events: (projectId?: string, limit?: number) =>
      api.get('/business/events', { params: { ...(projectId ? { projectId } : {}), ...(limit ? { limit } : {}) } }),
    financialHealth: () => api.get('/business/financial-health'),
    vendorBills: {
      list: (params?: { projectId?: string; vendorId?: string; status?: string; purchaseOrderId?: string }) =>
        api.get('/business/vendor-bills', { params }),
      dashboard: (projectId?: string) => api.get('/business/vendor-bills/dashboard', { params: projectId ? { projectId } : {} }),
      get: (id: string) => api.get(`/business/vendor-bills/${id}`),
      create: (data: object) => api.post('/business/vendor-bills', data),
      update: (id: string, data: object) => api.patch(`/business/vendor-bills/${id}`, data),
      match: (id: string) => api.post(`/business/vendor-bills/${id}/match`),
      approve: (id: string, comment?: string) => api.post(`/business/vendor-bills/${id}/approve`, { comment }),
      reject: (id: string, reason?: string) => api.post(`/business/vendor-bills/${id}/reject`, { reason }),
      sendBack: (id: string, comment?: string) => api.post(`/business/vendor-bills/${id}/send-back`, { comment }),
      exceptions: (projectId?: string) => api.get('/business/vendor-bills/exceptions', { params: projectId ? { projectId } : {} }),
      aging: (projectId?: string) => api.get('/business/vendor-bills/aging', { params: projectId ? { projectId } : {} }),
      metrics: () => api.get('/business/vendor-bills/metrics'),
    },
    payments: {
      list: (params?: Record<string, string>) => api.get('/business/payments', { params }),
      dashboard: (projectId?: string) => api.get('/business/payments/dashboard', { params: projectId ? { projectId } : {} }),
      get: (id: string) => api.get(`/business/payments/${id}`),
      create: (data: object) => api.post('/business/payments', data),
      update: (id: string, data: object) => api.patch(`/business/payments/${id}`, data),
      approve: (id: string, comment?: string) => api.post(`/business/payments/${id}/approve`, { comment }),
      markPaid: (id: string, referenceNumber?: string) => api.post(`/business/payments/${id}/mark-paid`, { referenceNumber }),
      aging: (projectId?: string) => api.get('/business/payments/aging', { params: projectId ? { projectId } : {} }),
      cashFlow: (projectId?: string) => api.get('/business/payments/cash-flow', { params: projectId ? { projectId } : {} }),
      metrics: () => api.get('/business/payments/metrics'),
    },
  },
  admin: {
    dashboard: () => api.get('/admin/dashboard'),
    organizations: () => api.get('/admin/organizations'),
    createOrganization: (data: object) => api.post('/admin/organizations', data),
    updateOrganization: (id: string, data: object) => api.patch(`/admin/organizations/${id}`, data),
    suspendOrg: (id: string) => api.post(`/admin/organizations/${id}/suspend`),
    activateOrg: (id: string) => api.post(`/admin/organizations/${id}/activate`),
    deleteOrg: (id: string) => api.delete(`/admin/organizations/${id}`),
    users: (organizationId?: string) => api.get('/admin/users', { params: organizationId ? { organizationId } : {} }),
    getUser: (id: string) => api.get(`/admin/users/${id}`),
    createUser: (data: object) => api.post('/admin/users', data),
    updateUser: (id: string, data: object) => api.patch(`/admin/users/${id}`, data),
    resetPassword: (id: string, data: object) => api.post(`/admin/users/${id}/reset-password`, data),
    lockUser: (id: string) => api.post(`/admin/users/${id}/lock`),
    unlockUser: (id: string) => api.post(`/admin/users/${id}/unlock`),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
    roles: () => api.get('/admin/roles'),
    createRole: (data: object) => api.post('/admin/roles', data),
    updateRole: (id: string, data: object) => api.patch(`/admin/roles/${id}`, data),
    cloneRole: (id: string, data: object) => api.post(`/admin/roles/${id}/clone`, data),
    deleteRole: (id: string) => api.delete(`/admin/roles/${id}`),
    permissions: () => api.get('/admin/permissions'),
    patchPermissions: (data: object) => api.patch('/admin/permissions', data),
    invitations: (status?: string) => api.get('/admin/invitations', { params: status ? { status } : {} }),
    inviteUser: (data: object) => api.post('/admin/invitations', data),
    resendInvite: (id: string) => api.post(`/admin/invitations/${id}/resend`),
    audit: (params?: { entityType?: string; limit?: number }) => api.get('/admin/audit', { params }),
    settings: () => api.get('/admin/settings'),
    updateSettings: (data: object) => api.patch('/admin/settings', data),
  },
};

export const missionControlApi = {
  overview: () => api.get('/mission-control/overview'),
  todayWork: () => api.get('/mission-control/today-work'),
  search: (q: string) => api.get('/mission-control/search', { params: { q } }),
};

export const explorerApi = {
  get: (entityType: string, entityId: string) => api.get(`/explorer/${entityType}/${entityId}`),
  byPrNumber: (prNumber: string) => api.get(`/explorer/purchase-request/by-number/${encodeURIComponent(prNumber)}`),
};

export interface InsightsQueryParams {
  projectId?: string;
  siteId?: string;
  vendorId?: string;
  equipmentId?: string;
  materialId?: string;
  category?: string;
  status?: string;
  from?: string;
  to?: string;
}

export const insightsApi = {
  overview: (params?: InsightsQueryParams) => api.get('/insights/overview', { params }),
  projects: (params?: InsightsQueryParams) => api.get('/insights/projects', { params }),
  supplyChain: (params?: InsightsQueryParams) => api.get('/insights/supply-chain', { params }),
  assets: (params?: InsightsQueryParams) => api.get('/insights/assets', { params }),
  finance: (params?: InsightsQueryParams) => api.get('/insights/finance', { params }),
  compliance: (params?: InsightsQueryParams) => api.get('/insights/compliance', { params }),
  workforce: (params?: InsightsQueryParams) => api.get('/insights/workforce', { params }),
  safety: (params?: InsightsQueryParams) => api.get('/insights/safety', { params }),
  permits: (params?: InsightsQueryParams) => api.get('/insights/permits', { params }),
  quality: (params?: InsightsQueryParams) => api.get('/insights/quality', { params }),
  operational: (params?: InsightsQueryParams) => api.get('/insights/operational', { params }),
  recommendations: (params?: InsightsQueryParams) => api.get('/insights/recommendations', { params }),
  predictions: (params?: InsightsQueryParams) => api.get('/insights/predictions', { params }),
  risks: (params?: InsightsQueryParams) => api.get('/insights/risks', { params }),
  rules: (params?: InsightsQueryParams) => api.get('/insights/rules', { params }),
  platform: () => api.get('/insights/platform'),
  financeDrilldown: (params?: InsightsQueryParams) => api.get('/insights/finance/drilldown', { params }),
  forecasts: (params?: InsightsQueryParams) => api.get('/insights/forecasts', { params }),
  integrations: (params?: InsightsQueryParams) => api.get('/insights/integrations', { params }),
  apiAnalytics: (params?: InsightsQueryParams) => api.get('/insights/api-analytics', { params }),
  erpAnalytics: (params?: InsightsQueryParams) => api.get('/insights/erp-analytics', { params }),
  deviceAnalytics: (params?: InsightsQueryParams) => api.get('/insights/device-analytics', { params }),
  communication: (params?: InsightsQueryParams) => api.get('/insights/communication', { params }),
  organizationAnalytics: (params?: InsightsQueryParams) => api.get('/insights/organization-analytics', { params }),
  globalAnalytics: (params?: InsightsQueryParams) => api.get('/insights/global-analytics', { params }),
  brief: () => api.get('/insights/brief'),
  search: (q: string) => api.get('/insights/search', { params: { q } }),
  reports: {
    list: () => api.get('/insights/reports'),
    save: (data: { name: string; section: string; filters?: Record<string, string>; createdBy?: string }) =>
      api.post('/insights/reports', data),
    delete: (id: string) => api.delete(`/insights/reports/${id}`),
  },
  exportUrl: (section: string, format: string, params?: InsightsQueryParams) => {
    const qs = new URLSearchParams({ section, format, ...params as Record<string, string> });
    const base = API_URL.replace(/\/$/, '');
    return `${base}/insights/export?${qs}`;
  },
};

export const intelligenceApi = {
  dashboard: (projectId?: string) => api.get('/intelligence/dashboard', { params: projectId ? { projectId } : {} }),
  search: (q: string, projectId?: string) => api.get('/intelligence/search', { params: { q, ...(projectId ? { projectId } : {}) } }),
  rules: {
    catalog: () => api.get('/intelligence/rules/catalog'),
    list: (projectId?: string) => api.get('/intelligence/rules', { params: projectId ? { projectId } : {} }),
    get: (id: string) => api.get(`/intelligence/rules/${id}`),
    dashboard: (projectId?: string) => api.get('/intelligence/rules/dashboard', { params: projectId ? { projectId } : {} }),
    history: (limit?: number, ruleId?: string) => api.get('/intelligence/rules/history', { params: { ...(limit ? { limit } : {}), ...(ruleId ? { ruleId } : {}) } }),
    logs: (limit?: number) => api.get('/intelligence/rules/history', { params: limit ? { limit } : {} }),
    create: (data: object) => api.post('/intelligence/rules', data),
    update: (id: string, data: object) => api.patch(`/intelligence/rules/${id}`, data),
    delete: (id: string) => api.delete(`/intelligence/rules/${id}`),
    test: (id: string, projectId?: string) => api.post(`/intelligence/rules/${id}/test`, { projectId }),
    testInline: (data: object) => api.post('/intelligence/rules/test', data),
    execute: (projectId?: string) => api.post('/intelligence/rules/execute', null, { params: projectId ? { projectId } : {} }),
  },
  recommendations: {
    list: (projectId?: string) => api.get('/intelligence/recommendations', { params: projectId ? { projectId } : {} }),
    dashboard: (projectId?: string) => api.get('/intelligence/recommendations/dashboard', { params: projectId ? { projectId } : {} }),
    history: (limit?: number, type?: string) => api.get('/intelligence/recommendations/history', { params: { ...(limit ? { limit } : {}), ...(type ? { type } : {}) } }),
    generate: (projectId?: string) => api.post('/intelligence/recommendations/generate', null, { params: projectId ? { projectId } : {} }),
  },
  predictions: {
    get: (projectId?: string) => api.get('/intelligence/predictions', { params: projectId ? { projectId } : {} }),
    dashboard: (projectId?: string) => api.get('/intelligence/predictions/dashboard', { params: projectId ? { projectId } : {} }),
    history: (limit?: number, type?: string, projectId?: string) =>
      api.get('/intelligence/predictions/history', { params: { ...(limit ? { limit } : {}), ...(type ? { type } : {}), ...(projectId ? { projectId } : {}) } }),
    accuracy: (projectId?: string) => api.get('/intelligence/predictions/accuracy', { params: projectId ? { projectId } : {} }),
    generate: (projectId?: string) => api.post('/intelligence/predictions/generate', null, { params: projectId ? { projectId } : {} }),
  },
  risks: {
    get: (projectId?: string) => api.get('/intelligence/risks', { params: projectId ? { projectId } : {} }),
    dashboard: (projectId?: string) => api.get('/intelligence/risks/dashboard', { params: projectId ? { projectId } : {} }),
    history: (limit?: number, projectId?: string) =>
      api.get('/intelligence/risks/history', { params: { ...(limit ? { limit } : {}), ...(projectId ? { projectId } : {}) } }),
    generate: (projectId?: string) => api.post('/intelligence/risks/generate', null, { params: projectId ? { projectId } : {} }),
  },
  brief: {
    get: (projectId?: string) => api.get('/intelligence/brief', { params: projectId ? { projectId } : {} }),
    dashboard: (projectId?: string) => api.get('/intelligence/brief/dashboard', { params: projectId ? { projectId } : {} }),
    daily: (projectId?: string) => api.get('/intelligence/brief/daily', { params: projectId ? { projectId } : {} }),
    weekly: (projectId?: string) => api.get('/intelligence/brief/weekly', { params: projectId ? { projectId } : {} }),
    monthly: (projectId?: string) => api.get('/intelligence/brief/monthly', { params: projectId ? { projectId } : {} }),
    financial: (projectId?: string) => api.get('/intelligence/brief/financial', { params: projectId ? { projectId } : {} }),
    operational: (projectId?: string) => api.get('/intelligence/brief/operational', { params: projectId ? { projectId } : {} }),
    workforce: (projectId?: string) => api.get('/intelligence/brief/workforce', { params: projectId ? { projectId } : {} }),
    asset: (projectId?: string) => api.get('/intelligence/brief/asset', { params: projectId ? { projectId } : {} }),
    procurement: (projectId?: string) => api.get('/intelligence/brief/procurement', { params: projectId ? { projectId } : {} }),
    history: (limit?: number, type?: string) =>
      api.get('/intelligence/brief/history', { params: { ...(limit ? { limit } : {}), ...(type ? { type } : {}) } }),
    generate: () => api.post('/intelligence/brief/generate'),
    project: (projectId: string) => api.get(`/intelligence/brief/project/${projectId}`),
  },
};

export const integrationsApi = {
  dashboard: () => api.get('/integrations/dashboard'),
  connectors: {
    list: () => api.get('/integrations/connectors'),
    registry: () => api.get('/integrations/connectors/registry'),
    create: (data: { registryId: string; name?: string; authType?: string }) => api.post('/integrations/connectors', data),
    update: (id: string, data: object) => api.patch(`/integrations/connectors/${id}`, data),
    delete: (id: string) => api.delete(`/integrations/connectors/${id}`),
    health: (id: string) => api.get(`/integrations/connectors/${id}/health`),
    logs: (limit?: number, connectorId?: string) =>
      api.get('/integrations/connectors/logs', { params: { ...(limit ? { limit } : {}), ...(connectorId ? { connectorId } : {}) } }),
  },
  gateway: {
    dashboard: () => api.get('/integrations/gateway/dashboard'),
    routes: () => api.get('/integrations/gateway/routes'),
    createRoute: (data: object) => api.post('/integrations/gateway/routes', data),
    updateRoute: (id: string, data: object) => api.patch(`/integrations/gateway/routes/${id}`, data),
    deleteRoute: (id: string) => api.delete(`/integrations/gateway/routes/${id}`),
    testRoute: (id: string) => api.post(`/integrations/gateway/routes/${id}/test`),
    apiKeys: () => api.get('/integrations/gateway/api-keys'),
    createApiKey: (data: object) => api.post('/integrations/gateway/api-keys', data),
    deleteApiKey: (id: string) => api.delete(`/integrations/gateway/api-keys/${id}`),
    authConfig: () => api.get('/integrations/gateway/auth-config'),
    updateAuthConfig: (data: object) => api.patch('/integrations/gateway/auth-config', data),
    requests: (limit?: number) => api.get('/integrations/gateway/requests', { params: limit ? { limit } : {} }),
    failed: (limit?: number) => api.get('/integrations/gateway/failed', { params: limit ? { limit } : {} }),
    retries: (limit?: number) => api.get('/integrations/gateway/retries', { params: limit ? { limit } : {} }),
    retryJob: (id: string) => api.post(`/integrations/gateway/retries/${id}/retry`),
    publish: (data: object) => api.post('/integrations/gateway/publish', data),
  },
  events: {
    types: () => api.get('/integrations/events/types'),
    stats: () => api.get('/integrations/events/stats'),
    history: (limit?: number, eventType?: string) =>
      api.get('/integrations/events/history', { params: { ...(limit ? { limit } : {}), ...(eventType ? { eventType } : {}) } }),
    get: (id: string) => api.get(`/integrations/events/history/${id}`),
    publish: (data: { eventType: string; payload: object; source?: string; organizationId?: string }) =>
      api.post('/integrations/events/publish', data),
  },
  webhooks: {
    list: () => api.get('/integrations/webhooks'),
    create: (data: object) => api.post('/integrations/webhooks', data),
    update: (id: string, data: object) => api.patch(`/integrations/webhooks/${id}`, data),
    delete: (id: string) => api.delete(`/integrations/webhooks/${id}`),
    test: (id: string) => api.post(`/integrations/webhooks/${id}/test`),
  },
  erp: {
    dashboard: () => api.get('/integrations/erp/dashboard'),
    adapters: () => api.get('/integrations/erp/adapters'),
    connectors: () => api.get('/integrations/erp/connectors'),
    settings: (id: string) => api.get(`/integrations/erp/connectors/${id}/settings`),
    updateSettings: (id: string, data: object) => api.patch(`/integrations/erp/connectors/${id}/settings`, data),
    testConnection: (id: string) => api.post(`/integrations/erp/connectors/${id}/settings/test`),
    sync: (id: string) => api.post(`/integrations/erp/connectors/${id}/sync`),
    mappings: (id: string) => api.get(`/integrations/erp/connectors/${id}/mappings`),
    createMapping: (id: string, data: object) => api.post(`/integrations/erp/connectors/${id}/mappings`, data),
    seedMappings: (id: string) => api.post(`/integrations/erp/connectors/${id}/mappings/seed`),
    updateMapping: (id: string, data: object) => api.patch(`/integrations/erp/mappings/${id}`, data),
    deleteMapping: (id: string) => api.delete(`/integrations/erp/mappings/${id}`),
    jobs: (connectorId?: string) => api.get('/integrations/erp/jobs', { params: connectorId ? { connectorId } : {} }),
    createJob: (data: object) => api.post('/integrations/erp/jobs', data),
    updateJob: (id: string, data: object) => api.patch(`/integrations/erp/jobs/${id}`, data),
    deleteJob: (id: string) => api.delete(`/integrations/erp/jobs/${id}`),
    runJob: (id: string) => api.post(`/integrations/erp/jobs/${id}/run`),
    history: (limit?: number, connectorId?: string) =>
      api.get('/integrations/erp/history', { params: { ...(limit ? { limit } : {}), ...(connectorId ? { connectorId } : {}) } }),
    runDetail: (id: string) => api.get(`/integrations/erp/history/${id}`),
    errors: (limit?: number, connectorId?: string, status?: string) =>
      api.get('/integrations/erp/errors', { params: { ...(limit ? { limit } : {}), ...(connectorId ? { connectorId } : {}), ...(status ? { status } : {}) } }),
    retryError: (id: string) => api.post(`/integrations/erp/errors/${id}/retry`),
  },
  field: {
    dashboard: () => api.get('/integrations/field/dashboard'),
    adapters: () => api.get('/integrations/field/adapters'),
    connectors: () => api.get('/integrations/field/connectors'),
    settings: (id: string) => api.get(`/integrations/field/connectors/${id}/settings`),
    updateSettings: (id: string, data: object) => api.patch(`/integrations/field/connectors/${id}/settings`, data),
    testConnection: (id: string) => api.post(`/integrations/field/connectors/${id}/settings/test`),
    poll: (id: string) => api.post(`/integrations/field/connectors/${id}/poll`),
    devices: (connectorId?: string) => api.get('/integrations/field/devices', { params: connectorId ? { connectorId } : {} }),
    createDevice: (connectorId: string, data: object) => api.post(`/integrations/field/connectors/${connectorId}/devices`, data),
    updateDevice: (id: string, data: object) => api.patch(`/integrations/field/devices/${id}`, data),
    deleteDevice: (id: string) => api.delete(`/integrations/field/devices/${id}`),
    ingest: (data: object) => api.post('/integrations/field/ingest', data),
    batchIngest: (data: object) => api.post('/integrations/field/ingest/batch', data),
    telemetry: (limit?: number, connectorId?: string, telemetryType?: string) =>
      api.get('/integrations/field/telemetry', { params: { ...(limit ? { limit } : {}), ...(connectorId ? { connectorId } : {}), ...(telemetryType ? { telemetryType } : {}) } }),
    telemetryById: (id: string) => api.get(`/integrations/field/telemetry/${id}`),
    health: () => api.get('/integrations/field/health'),
  },
  comm: {
    dashboard: () => api.get('/integrations/comm/dashboard'),
    adapters: () => api.get('/integrations/comm/adapters'),
    connectors: () => api.get('/integrations/comm/connectors'),
    testConnection: (id: string) => api.post(`/integrations/comm/connectors/${id}/test`),
    templates: () => api.get('/integrations/comm/templates'),
    seedTemplates: () => api.post('/integrations/comm/templates/seed'),
    createTemplate: (data: object) => api.post('/integrations/comm/templates', data),
    deleteTemplate: (id: string) => api.delete(`/integrations/comm/templates/${id}`),
    rules: () => api.get('/integrations/comm/rules'),
    createRule: (data: object) => api.post('/integrations/comm/rules', data),
    deleteRule: (id: string) => api.delete(`/integrations/comm/rules/${id}`),
    send: (data: object) => api.post('/integrations/comm/send', data),
    broadcast: (data: object) => api.post('/integrations/comm/broadcast', data),
    queue: (limit?: number, status?: string) => api.get('/integrations/comm/queue', { params: { ...(limit ? { limit } : {}), ...(status ? { status } : {}) } }),
    retryMessage: (id: string) => api.post(`/integrations/comm/queue/${id}/retry`),
    campaigns: () => api.get('/integrations/comm/campaigns'),
    createCampaign: (data: object) => api.post('/integrations/comm/campaigns', data),
    runCampaign: (id: string) => api.post(`/integrations/comm/campaigns/${id}/run`),
    campaign: (id: string) => api.get(`/integrations/comm/campaigns/${id}`),
  },
};

export const platformApi = {
  dashboard: () => api.get('/platform/dashboard'),
  parentCompanies: () => api.get('/platform/parent-companies'),
  createParentCompany: (data: object) => api.post('/platform/parent-companies', data),
  organizations: () => api.get('/platform/organizations'),
  switchable: () => api.get('/platform/organizations/switchable'),
  linkOrganization: (data: object) => api.post('/platform/organizations/link', data),
  hierarchy: (organizationId?: string) => api.get('/platform/hierarchy', { params: organizationId ? { organizationId } : {} }),
  orgUnits: (organizationId?: string) => api.get('/platform/org-units', { params: organizationId ? { organizationId } : {} }),
  createOrgUnit: (data: object) => api.post('/platform/org-units', data),
  deleteOrgUnit: (id: string) => api.delete(`/platform/org-units/${id}`),
  settings: (organizationId?: string) => api.get('/platform/settings', { params: organizationId ? { organizationId } : {} }),
  updateSettings: (organizationId: string, data: object) => api.patch(`/platform/settings/${organizationId}`, data),
  branding: (organizationId?: string) => api.get('/platform/branding', { params: organizationId ? { organizationId } : {} }),
  updateBranding: (organizationId: string, data: object) => api.patch(`/platform/branding/${organizationId}`, data),
  themes: () => api.get('/platform/themes'),
  tenantBranding: (organizationId?: string) => api.get('/platform/tenant-branding', { params: organizationId ? { organizationId } : {} }),
  updateTenantBranding: (organizationId: string, data: object) => api.patch(`/platform/tenant-branding/${organizationId}`, data),
  applyTheme: (organizationId: string, themeId: string) => api.post(`/platform/tenant-branding/${organizationId}/apply-theme/${themeId}`),
  brandPreview: (organizationId?: string) => api.get('/platform/brand-preview', { params: organizationId ? { organizationId } : {} }),
  emailBranding: (organizationId?: string) => api.get('/platform/email-branding', { params: organizationId ? { organizationId } : {} }),
  pdfBranding: (organizationId?: string) => api.get('/platform/pdf-branding', { params: organizationId ? { organizationId } : {} }),
  catalog: () => api.get('/platform/catalog'),
  regional: (organizationId?: string) => api.get('/platform/regional', { params: organizationId ? { organizationId } : {} }),
  createRegional: (data: object) => api.post('/platform/regional', data),
  updateRegional: (id: string, data: object) => api.patch(`/platform/regional/${id}`, data),
  deleteRegional: (id: string) => api.delete(`/platform/regional/${id}`),
  localization: (locale?: string, organizationId?: string) =>
    api.get('/platform/localization', { params: { ...(locale ? { locale } : {}), ...(organizationId ? { organizationId } : {}) } }),
  upsertLocalization: (data: object) => api.post('/platform/localization', data),
  regionDashboard: (organizationId?: string) => api.get('/platform/region-dashboard', { params: organizationId ? { organizationId } : {} }),
  assignProject: (data: object) => api.post('/platform/projects/assign', data),
  analytics: () => api.get('/platform/analytics'),
  globalAnalytics: () => api.get('/platform/global-analytics'),
};

export const marketplaceApi = {
  dashboard: (organizationId?: string) => api.get('/marketplace/dashboard', { params: organizationId ? { organizationId } : {} }),
  sdkManifest: () => api.get('/marketplace/sdk/manifest'),
  plugins: (type?: string, organizationId?: string) =>
    api.get('/marketplace/plugins', { params: { ...(type ? { type } : {}), ...(organizationId ? { organizationId } : {}) } }),
  plugin: (pluginId: string, organizationId?: string) =>
    api.get(`/marketplace/plugins/${pluginId}`, { params: organizationId ? { organizationId } : {} }),
  installations: (organizationId?: string) =>
    api.get('/marketplace/installations', { params: organizationId ? { organizationId } : {} }),
  install: (pluginId: string, data?: object) => api.post(`/marketplace/plugins/${pluginId}/install`, data || {}),
  upgrade: (pluginId: string, organizationId?: string) =>
    api.post(`/marketplace/plugins/${pluginId}/upgrade`, {}, { params: organizationId ? { organizationId } : {} }),
  uninstall: (installationId: string, organizationId?: string) =>
    api.delete(`/marketplace/installations/${installationId}`, { params: organizationId ? { organizationId } : {} }),
  rate: (pluginId: string, data: object) => api.post(`/marketplace/plugins/${pluginId}/rate`, data),
  connectorStore: (organizationId?: string) =>
    api.get('/marketplace/connector-store', { params: organizationId ? { organizationId } : {} }),
  dashboardStore: (organizationId?: string) =>
    api.get('/marketplace/dashboard-store', { params: organizationId ? { organizationId } : {} }),
  workflowTemplates: (organizationId?: string) =>
    api.get('/marketplace/workflow-templates', { params: organizationId ? { organizationId } : {} }),
  reportTemplates: (organizationId?: string) =>
    api.get('/marketplace/report-templates', { params: organizationId ? { organizationId } : {} }),
  developerPlugins: (publisher?: string) =>
    api.get('/marketplace/developer/plugins', { params: publisher ? { publisher } : {} }),
  publishPlugin: (data: object) => api.post('/marketplace/developer/plugins', data),
  publishVersion: (pluginId: string, data: object) => api.post(`/marketplace/developer/plugins/${pluginId}/versions`, data),
};

export const developerApi = {
  dashboard: (organizationId?: string) => api.get('/developer/dashboard', { params: organizationId ? { organizationId } : {} }),
  swagger: () => api.get('/developer/docs/swagger'),
  sdk: () => api.get('/developer/docs/sdk'),
  webhooks: () => api.get('/developer/docs/webhooks'),
  sandbox: () => api.get('/developer/sandbox'),
  applications: (organizationId?: string) => api.get('/developer/applications', { params: organizationId ? { organizationId } : {} }),
  createApplication: (data: object) => api.post('/developer/applications', data),
  updateApplication: (applicationId: string, data: object) => api.patch(`/developer/applications/${applicationId}`, data),
  deleteApplication: (applicationId: string) => api.delete(`/developer/applications/${applicationId}`),
  apiKeys: (organizationId?: string) => api.get('/developer/api-keys', { params: organizationId ? { organizationId } : {} }),
  createApiKey: (data: object) => api.post('/developer/api-keys', data),
  deleteApiKey: (id: string) => api.delete(`/developer/api-keys/${id}`),
  usage: (organizationId?: string) => api.get('/developer/usage', { params: organizationId ? { organizationId } : {} }),
  rateLimits: (organizationId?: string) => api.get('/developer/rate-limits', { params: organizationId ? { organizationId } : {} }),
  license: (organizationId?: string) => api.get('/developer/license', { params: organizationId ? { organizationId } : {} }),
  audit: (organizationId?: string, limit?: number) =>
    api.get('/developer/audit', { params: { ...(organizationId ? { organizationId } : {}), ...(limit ? { limit } : {}) } }),
  analytics: (organizationId?: string) => api.get('/developer/analytics', { params: organizationId ? { organizationId } : {} }),
  oauthToken: (data: object) => api.post('/developer/oauth/token', data),
};
