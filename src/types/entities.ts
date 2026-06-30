export interface MongoEntity {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project extends MongoEntity {
  code: string;
  name: string;
  client?: string;
  status: string;
  progressPercent: number;
  budgetAmount: number;
  spentAmount: number;
  projectManager?: string;
  siteCount: number;
  startDate?: string;
  endDate?: string;
}

export interface PurchaseRequest extends MongoEntity {
  prNumber: string;
  title: string;
  description?: string;
  projectId: string;
  requestedBy: string;
  status: string;
  totalEstimatedCost: number;
}

export interface Vendor extends MongoEntity {
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  gstin?: string;
  status: string;
  rating: number;
}

export interface Material extends MongoEntity {
  code: string;
  name: string;
  category?: string;
  unit?: string;
  reorderLevel: number;
  status: string;
}

export interface StockMovement extends MongoEntity {
  materialId: string;
  warehouseId: string;
  type: string;
  quantity: number;
  balanceAfter: number;
  reference?: string;
}

export interface Equipment extends MongoEntity {
  code: string;
  name: string;
  category?: string;
  make?: string;
  model?: string;
  status: string;
  utilizationPercent: number;
  engineHours: number;
  isCompliant: boolean;
}

export interface Vehicle extends MongoEntity {
  registrationNumber: string;
  name: string;
  type?: string;
  status: string;
  odometerKm: number;
  isCompliant: boolean;
}

export interface WorkOrder extends MongoEntity {
  woNumber: string;
  title: string;
  type: string;
  status: string;
  assignedTo?: string;
  estimatedCost: number;
}

export interface ComplianceRecord extends MongoEntity {
  entityType: string;
  entityId: string;
  documentType: string;
  documentNumber?: string;
  expiryDate?: string;
  status: string;
}
