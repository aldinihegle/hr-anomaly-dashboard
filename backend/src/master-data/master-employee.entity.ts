import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('master_employees')
export class MasterEmployee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true }) Age: number;
  @Column({ nullable: true }) Attrition: string;
  @Column({ nullable: true }) BusinessTravel: string;
  @Column({ nullable: true }) DailyRate: number;
  @Column({ nullable: true }) Department: string;
  @Column({ nullable: true }) DistanceFromHome: number;
  @Column({ nullable: true }) Education: number;
  @Column({ nullable: true }) EducationField: string;
  @Column({ nullable: true }) EmployeeCount: number;
  @Column({ nullable: true }) EmployeeNumber: number;
  @Column({ nullable: true }) EnvironmentSatisfaction: number;
  @Column({ nullable: true }) Gender: string;
  @Column({ nullable: true }) HourlyRate: number;
  @Column({ nullable: true }) JobInvolvement: number;
  @Column({ nullable: true }) JobLevel: number;
  @Column({ nullable: true }) JobRole: string;
  @Column({ nullable: true }) JobSatisfaction: number;
  @Column({ nullable: true }) MaritalStatus: string;
  @Column({ nullable: true }) MonthlyIncome: number;
  @Column({ nullable: true }) MonthlyRate: number;
  @Column({ nullable: true }) NumCompaniesWorked: number;
  @Column({ nullable: true }) Over18: string;
  @Column({ nullable: true }) OverTime: string;
  @Column({ nullable: true }) PercentSalaryHike: number;
  @Column({ nullable: true }) PerformanceRating: number;
  @Column({ nullable: true }) RelationshipSatisfaction: number;
  @Column({ nullable: true }) StandardHours: number;
  @Column({ nullable: true }) StockOptionLevel: number;
  @Column({ nullable: true }) TotalWorkingYears: number;
  @Column({ nullable: true }) TrainingTimesLastYear: number;
  @Column({ nullable: true }) WorkLifeBalance: number;
  @Column({ nullable: true }) YearsAtCompany: number;
  @Column({ nullable: true }) YearsInCurrentRole: number;
  @Column({ nullable: true }) YearsSinceLastPromotion: number;
  @Column({ nullable: true }) YearsWithCurrManager: number;
}
