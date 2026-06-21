import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('shap_global_importance')
export class ShapGlobalImportance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  feature: string;

  @Column('real')
  meanAbsShap: number;
}
