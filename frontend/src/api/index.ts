import axios from 'axios';
import type {
  PaginatedEmployees,
  RiskBucket,
  AnomalyStats,
  ShapFeature,
  ShapLocalEntry,
  Summary,
  EmployeeAnomaly,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Summary ──────────────────────────────────────────────────────────────
export const getSummary = (): Promise<Summary> =>
  api.get<Summary>('/summary').then((r) => r.data);

// ── Employees ─────────────────────────────────────────────────────────────
export interface EmployeeQuery {
  page?: number;
  perPage?: number;
  risk?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  department?: string;
  jobRole?: string;
  overTime?: string;
  minScore?: number;
  maxScore?: number;
}

export const getEmployees = (params: EmployeeQuery = {}): Promise<PaginatedEmployees> =>
  api.get<PaginatedEmployees>('/employees', { params }).then((r) => r.data);

export const getEmployee = (id: number): Promise<EmployeeAnomaly> =>
  api.get<EmployeeAnomaly>(`/employees/${id}`).then((r) => r.data);

export const getTopEmployees = (limit = 20): Promise<EmployeeAnomaly[]> =>
  api.get<EmployeeAnomaly[]>(`/employees/top?limit=${limit}`).then((r) => r.data);

export const getRiskDistribution = (): Promise<RiskBucket[]> =>
  api.get<RiskBucket[]>('/employees/risk-distribution').then((r) => r.data);

export const getStatistics = (): Promise<AnomalyStats> =>
  api.get<AnomalyStats>('/employees/statistics').then((r) => r.data);

export const getDepartments = (): Promise<string[]> =>
  api.get<string[]>('/employees/filters/departments').then((r) => r.data);

export const getJobRoles = (): Promise<string[]> =>
  api.get<string[]>('/employees/filters/job-roles').then((r) => r.data);

// ── SHAP ─────────────────────────────────────────────────────────────────
export const getShapGlobal = (top = 10): Promise<ShapFeature[]> =>
  api.get<ShapFeature[]>(`/shap/global?top=${top}`).then((r) => r.data);

export const getShapLocal = (employeeId: number, top = 12): Promise<ShapLocalEntry[]> =>
  api.get<ShapLocalEntry[]>(`/shap/local/${employeeId}?top=${top}`).then((r) => r.data);

// ── Create employee ───────────────────────────────────────────────────────
export interface CreateEmployeePayload {
  age: number; businessTravel: string; department: string;
  distanceFromHome: number; education: number; educationField: string;
  environmentSatisfaction: number; gender: string; jobInvolvement: number;
  jobLevel: number; jobRole: string; jobSatisfaction: number;
  maritalStatus: string; monthlyIncome: number; numCompaniesWorked: number;
  overTime: string; percentSalaryHike: number; performanceRating: number;
  relationshipSatisfaction: number; stockOptionLevel: number;
  totalWorkingYears: number; trainingTimesLastYear: number;
  workLifeBalance: number; yearsAtCompany: number; yearsInCurrentRole: number;
  yearsSinceLastPromotion: number; yearsWithCurrManager: number;
  attrition?: string;
}

export const createEmployee = (data: CreateEmployeePayload): Promise<EmployeeAnomaly> =>
  api.post<EmployeeAnomaly>('/employees', data).then((r) => r.data);

export const login = (email: string, password: string): Promise<{ access_token: string; user: any }> =>
  api.post<{ access_token: string; user: any }>('/auth/login', { email, password }).then((r) => r.data);

export default api;
