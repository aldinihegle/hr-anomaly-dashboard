import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('employee_anomalies')
export class EmployeeAnomaly {
  @PrimaryGeneratedColumn()
  id: number;

  // ── Original HR fields ─────────────────────────────────────────────
  @Column({ nullable: true }) age: number;
  @Column({ nullable: true }) businessTravel: string;
  @Column({ nullable: true }) department: string;
  @Column({ nullable: true }) distanceFromHome: number;
  @Column({ nullable: true }) education: number;
  @Column({ nullable: true }) educationField: string;
  @Column({ nullable: true }) environmentSatisfaction: number;
  @Column({ nullable: true }) gender: string;
  @Column({ nullable: true }) jobInvolvement: number;
  @Column({ nullable: true }) jobLevel: number;
  @Column({ nullable: true }) jobRole: string;
  @Column({ nullable: true }) jobSatisfaction: number;
  @Column({ nullable: true }) maritalStatus: string;
  @Column({ nullable: true }) monthlyIncome: number;
  @Column({ nullable: true }) dailyRate: number;
  @Column({ nullable: true }) hourlyRate: number;
  @Column({ nullable: true }) monthlyRate: number;
  @Column({ nullable: true }) numCompaniesWorked: number;
  @Column({ nullable: true }) overTime: string;
  @Column({ nullable: true }) percentSalaryHike: number;
  @Column({ nullable: true }) performanceRating: number;
  @Column({ nullable: true }) relationshipSatisfaction: number;
  @Column({ nullable: true }) stockOptionLevel: number;
  @Column({ nullable: true }) totalWorkingYears: number;
  @Column({ nullable: true }) trainingTimesLastYear: number;
  @Column({ nullable: true }) workLifeBalance: number;
  @Column({ nullable: true }) yearsAtCompany: number;
  @Column({ nullable: true }) yearsInCurrentRole: number;
  @Column({ nullable: true }) yearsSinceLastPromotion: number;
  @Column({ nullable: true }) yearsWithCurrManager: number;
  @Column({ nullable: true }) attrition: string;

  // ── Model outputs ──────────────────────────────────────────────────
  @Column('real', { nullable: false }) anomalyScoreIf: number;
  @Column({ nullable: false }) riskCategory: string; // rendah | sedang | tinggi
}
