// ── Shared TypeScript types ──────────────────────────────────────────────

export interface EmployeeAnomaly {
  id: number;
  age: number;
  businessTravel: string;
  department: string;
  distanceFromHome: number;
  education: number;
  educationField: string;
  environmentSatisfaction: number;
  gender: string;
  jobInvolvement: number;
  jobLevel: number;
  jobRole: string;
  jobSatisfaction: number;
  maritalStatus: string;
  monthlyIncome: number;
  dailyRate: number;
  hourlyRate: number;
  monthlyRate: number;
  numCompaniesWorked: number;
  overTime: string;
  percentSalaryHike: number;
  performanceRating: number;
  relationshipSatisfaction: number;
  stockOptionLevel: number;
  totalWorkingYears: number;
  trainingTimesLastYear: number;
  workLifeBalance: number;
  yearsAtCompany: number;
  yearsInCurrentRole: number;
  yearsSinceLastPromotion: number;
  yearsWithCurrManager: number;
  attrition: string;
  anomalyScoreIf: number;
  riskCategory: 'rendah' | 'sedang' | 'tinggi';
}

export interface PaginatedEmployees {
  total: number;
  page: number;
  perPage: number;
  pages: number;
  items: EmployeeAnomaly[];
}

export interface RiskBucket {
  kategori: 'rendah' | 'sedang' | 'tinggi';
  jumlah: number;
  persentase: number;
}

export interface AnomalyStats {
  mean: number;
  min: number;
  max: number;
  total: number;
}

export interface ShapFeature {
  id: number;
  feature: string;
  meanAbsShap: number;
}

export interface ShapLocalEntry {
  id: number;
  employeeIdx: number;
  feature: string;
  shapValue: number;
}

export interface Summary {
  riskDistribution: RiskBucket[];
  anomalyScoreStats: AnomalyStats;
  topShap: ShapFeature[];
}

export type RiskCategory = 'rendah' | 'sedang' | 'tinggi';
export type SortOrder = 'asc' | 'desc';
