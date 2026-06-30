import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RouteLoading } from '@/components/ui/RouteLoading';
import { LoginPage } from '@/pages/LoginPage';
import { RoleHomeRedirect } from '@/pages/RoleHomeRedirect';
import { ExplorerRedirect } from '@/components/explorer/ExplorerRedirect';

const MissionControlPage = lazy(() => import('@/pages/MissionControlPage').then((m) => ({ default: m.MissionControlPage })));
const ProjectsPage = lazy(() => import('@/pages/modules/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('@/pages/modules/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })));
const ProcurementPage = lazy(() => import('@/pages/modules/ProcurementPage').then((m) => ({ default: m.ProcurementPage })));
const InventoryPage = lazy(() => import('@/pages/modules/InventoryPage').then((m) => ({ default: m.InventoryPage })));
const EquipmentPage = lazy(() => import('@/pages/modules/EquipmentPage').then((m) => ({ default: m.EquipmentPage })));
const FleetPage = lazy(() => import('@/pages/modules/FleetPage').then((m) => ({ default: m.FleetPage })));
const MaintenancePage = lazy(() => import('@/pages/modules/MaintenancePage').then((m) => ({ default: m.MaintenancePage })));
const WorkforceWorkspacePage = lazy(() => import('@/pages/workspaces/WorkforceWorkspacePage').then((m) => ({ default: m.WorkforceWorkspacePage })));
const VendorsPage = lazy(() => import('@/pages/modules/VendorsPage').then((m) => ({ default: m.VendorsPage })));
const ConsumptionPage = lazy(() => import('@/pages/modules/ConsumptionPage').then((m) => ({ default: m.ConsumptionPage })));
const AssetsWorkspacePage = lazy(() => import('@/pages/workspaces/AssetsWorkspacePage').then((m) => ({ default: m.AssetsWorkspacePage })));
const SupplyChainWorkspacePage = lazy(() => import('@/pages/workspaces/SupplyChainWorkspacePage').then((m) => ({ default: m.SupplyChainWorkspacePage })));
const BusinessWorkspacePage = lazy(() => import('@/pages/workspaces/BusinessWorkspacePage').then((m) => ({ default: m.BusinessWorkspacePage })));
const AdminWorkspacePage = lazy(() => import('@/pages/workspaces/AdminWorkspacePage').then((m) => ({ default: m.AdminWorkspacePage })));
const VendorBillsPage = lazy(() => import('@/pages/workspaces/VendorBillsPage').then((m) => ({ default: m.VendorBillsPage })));
const PaymentsPage = lazy(() => import('@/pages/workspaces/PaymentsPage').then((m) => ({ default: m.PaymentsPage })));
const DocumentCenterPage = lazy(() => import('@/pages/workspaces/DocumentCenterPage').then((m) => ({ default: m.DocumentCenterPage })));
const CompliancePlusPage = lazy(() => import('@/pages/workspaces/CompliancePlusPage').then((m) => ({ default: m.CompliancePlusPage })));
const InsightsPage = lazy(() => import('@/pages/insights/InsightsPage').then((m) => ({ default: m.InsightsPage })));
const IntelligenceWorkspacePage = lazy(() => import('@/pages/intelligence/IntelligenceWorkspacePage').then((m) => ({ default: m.IntelligenceWorkspacePage })));
const IntegrationsWorkspacePage = lazy(() => import('@/pages/integrations/IntegrationsWorkspacePage').then((m) => ({ default: m.IntegrationsWorkspacePage })));
const EnterpriseWorkspacePage = lazy(() => import('@/pages/enterprise/EnterpriseWorkspacePage').then((m) => ({ default: m.EnterpriseWorkspacePage })));
const MarketplaceWorkspacePage = lazy(() => import('@/pages/marketplace/MarketplaceWorkspacePage').then((m) => ({ default: m.MarketplaceWorkspacePage })));
const DeveloperPortalPage = lazy(() => import('@/pages/developer/DeveloperPortalPage').then((m) => ({ default: m.DeveloperPortalPage })));
const WarehouseManagerDashboard = lazy(() => import('@/pages/dashboards/WarehouseManagerDashboard').then((m) => ({ default: m.WarehouseManagerDashboard })));
const StoreKeeperDashboard = lazy(() => import('@/pages/dashboards/StoreKeeperDashboard').then((m) => ({ default: m.StoreKeeperDashboard })));
const SiteEngineerDashboard = lazy(() => import('@/pages/dashboards/SiteEngineerDashboard').then((m) => ({ default: m.SiteEngineerDashboard })));
const MaintenanceManagerDashboard = lazy(() => import('@/pages/dashboards/MaintenanceManagerDashboard').then((m) => ({ default: m.MaintenanceManagerDashboard })));
const ComplianceManagerDashboard = lazy(() => import('@/pages/dashboards/ComplianceManagerDashboard').then((m) => ({ default: m.ComplianceManagerDashboard })));
const EntityExplorerPage = lazy(() => import('@/pages/explorer/EntityExplorerPage').then((m) => ({ default: m.EntityExplorerPage })));

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteLoading />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/" element={<RoleHomeRedirect />} />
        <Route path="/mission-control" element={<Lazy><MissionControlPage /></Lazy>} />
        <Route path="/explore/purchase-request/by-number/:prNumber" element={<Lazy><EntityExplorerPage /></Lazy>} />
        <Route path="/explore/:entityType/:entityId" element={<Lazy><EntityExplorerPage /></Lazy>} />
        <Route path="/dashboard/warehouse" element={<Lazy><WarehouseManagerDashboard /></Lazy>} />
        <Route path="/dashboard/store-keeper" element={<Lazy><StoreKeeperDashboard /></Lazy>} />
        <Route path="/dashboard/site-engineer" element={<Lazy><SiteEngineerDashboard /></Lazy>} />
        <Route path="/dashboard/maintenance" element={<Lazy><MaintenanceManagerDashboard /></Lazy>} />
        <Route path="/dashboard/compliance" element={<Lazy><ComplianceManagerDashboard /></Lazy>} />
        <Route path="/command/executive" element={<Navigate to="/insights?tab=brief" replace />} />
        <Route path="/analytics" element={<Navigate to="/insights" replace />} />
        <Route path="/projects" element={<Lazy><ProjectsPage /></Lazy>} />
        <Route path="/projects/:projectId" element={<Lazy><ProjectDetailPage /></Lazy>} />
        <Route path="/assets" element={<Lazy><AssetsWorkspacePage /></Lazy>} />
        <Route path="/supply-chain" element={<Lazy><SupplyChainWorkspacePage /></Lazy>} />
        <Route path="/business" element={<Lazy><BusinessWorkspacePage /></Lazy>} />
        <Route path="/business/vendor-bills" element={<Lazy><VendorBillsPage /></Lazy>} />
        <Route path="/business/vendor-bills/:billId" element={<ExplorerRedirect kind="vendor-bill" />} />
        <Route path="/business/payments" element={<Lazy><PaymentsPage /></Lazy>} />
        <Route path="/business/payments/:paymentId" element={<ExplorerRedirect kind="payment" />} />
        <Route path="/business/documents" element={<Lazy><DocumentCenterPage /></Lazy>} />
        <Route path="/business/documents/:docId" element={<ExplorerRedirect kind="document" />} />
        <Route path="/business/compliance" element={<Lazy><CompliancePlusPage /></Lazy>} />
        <Route path="/business/compliance/:recordId" element={<ExplorerRedirect kind="compliance-record" />} />
        <Route path="/compliance" element={<Navigate to="/business/compliance" replace />} />
        <Route path="/finance" element={<Navigate to="/business" replace />} />
        <Route path="/workforce" element={<Lazy><WorkforceWorkspacePage /></Lazy>} />
        <Route path="/insights" element={<Lazy><InsightsPage /></Lazy>} />
        <Route path="/intelligence" element={<Lazy><IntelligenceWorkspacePage /></Lazy>} />
        <Route path="/integrations" element={<Lazy><IntegrationsWorkspacePage /></Lazy>} />
        <Route path="/enterprise" element={<Lazy><EnterpriseWorkspacePage /></Lazy>} />
        <Route path="/marketplace" element={<Lazy><MarketplaceWorkspacePage /></Lazy>} />
        <Route path="/developer" element={<Lazy><DeveloperPortalPage /></Lazy>} />
        <Route path="/admin" element={<Lazy><AdminWorkspacePage /></Lazy>} />
        <Route path="/procurement" element={<Lazy><ProcurementPage /></Lazy>} />
        <Route path="/vendors" element={<Lazy><VendorsPage /></Lazy>} />
        <Route path="/inventory" element={<Lazy><InventoryPage /></Lazy>} />
        <Route path="/consumption" element={<Lazy><ConsumptionPage /></Lazy>} />
        <Route path="/equipment" element={<Lazy><EquipmentPage /></Lazy>} />
        <Route path="/equipment/:id" element={<ExplorerRedirect kind="equipment" />} />
        <Route path="/fleet" element={<Lazy><FleetPage /></Lazy>} />
        <Route path="/maintenance" element={<Lazy><MaintenancePage /></Lazy>} />
        <Route path="/ai" element={<Navigate to="/insights" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
