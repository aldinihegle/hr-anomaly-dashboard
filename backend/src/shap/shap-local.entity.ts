import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('shap_local')
@Index(['employeeIdx'])
export class ShapLocal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  employeeIdx: number; // 0-based index (maps to EmployeeAnomaly.id - 1)

  @Column({ nullable: false })
  feature: string;

  @Column('real', { nullable: false })
  shapValue: number;
}
