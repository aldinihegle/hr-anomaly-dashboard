#!/usr/bin/env npx ts-node
/**
 * Seed script — baca CSV output model dan simpan ke SQLite via TypeORM
 *
 * Usage (dari folder backend/):
 *   npx ts-node scripts/seed.ts
 *   npx ts-node scripts/seed.ts --outputs-dir "../../model/outputs"
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { EmployeeAnomaly } from '../src/employees/employee.entity';
import { ShapGlobalImportance } from '../src/shap/shap-global.entity';
import { ShapLocal } from '../src/shap/shap-local.entity';
import { User } from '../src/users/user.entity';
import { MasterEmployee } from '../src/master-data/master-employee.entity';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ── Parse CLI args ────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const outputsDirArg = args.findIndex((a) => a === '--outputs-dir');
const OUTPUTS_DIR = path.resolve(
  outputsDirArg !== -1
    ? args[outputsDirArg + 1]
    : path.join(__dirname, '../../model/outputs'),
);
// shap_local_all.csv dihasilkan oleh model/development_ml.py
const SHAP_LOCAL_CSV = path.resolve(__dirname, '../../model/outputs/shap_local_all.csv');
const DB_PATH = path.resolve(__dirname, '../data/hr_anomaly.db');

console.log('📂  Outputs dir:', OUTPUTS_DIR);
console.log('🗃️   DB path:     ', DB_PATH);

// ── Ensure data/ folder exists ────────────────────────────────────────────
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// ── DataSource ────────────────────────────────────────────────────────────
const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  schema: process.env.DB_SCHEMA || 'public',
  entities: [EmployeeAnomaly, ShapGlobalImportance, ShapLocal, User, MasterEmployee],
  synchronize: true,
  logging: false,
  ssl: true,
});

// ── CSV helper ────────────────────────────────────────────────────────────
async function readCsv(file: string): Promise<Record<string, string>[]> {
  const rows: Record<string, string>[] = [];
  const rl = readline.createInterface({ input: fs.createReadStream(file) });
  let headers: string[] = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    if (!headers.length) { 
      headers = line.split(',').map(h => h.replace(/^\uFEFF/, '').trim()); 
      continue; 
    }
    const vals = line.split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ? vals[i].trim() : ''; });
    rows.push(row);
  }
  return rows;
}

// ── Column map: CSV header → entity field ─────────────────────────────────
const COL_MAP: Record<string, keyof EmployeeAnomaly> = {
  Age: 'age', BusinessTravel: 'businessTravel', Department: 'department',
  DistanceFromHome: 'distanceFromHome', Education: 'education',
  EducationField: 'educationField', EnvironmentSatisfaction: 'environmentSatisfaction',
  Gender: 'gender', JobInvolvement: 'jobInvolvement', JobLevel: 'jobLevel',
  JobRole: 'jobRole', JobSatisfaction: 'jobSatisfaction',
  MaritalStatus: 'maritalStatus', MonthlyIncome: 'monthlyIncome',
  NumCompaniesWorked: 'numCompaniesWorked', OverTime: 'overTime',
  PercentSalaryHike: 'percentSalaryHike', PerformanceRating: 'performanceRating',
  RelationshipSatisfaction: 'relationshipSatisfaction', StockOptionLevel: 'stockOptionLevel',
  TotalWorkingYears: 'totalWorkingYears', TrainingTimesLastYear: 'trainingTimesLastYear',
  WorkLifeBalance: 'workLifeBalance', YearsAtCompany: 'yearsAtCompany',
  YearsInCurrentRole: 'yearsInCurrentRole', YearsSinceLastPromotion: 'yearsSinceLastPromotion',
  YearsWithCurrManager: 'yearsWithCurrManager', Attrition: 'attrition',
  anomaly_score_if: 'anomalyScoreIf',
  risk_category: 'riskCategory',
};

const NUMERIC_FIELDS = new Set<keyof EmployeeAnomaly>([
  'age', 'distanceFromHome', 'education', 'environmentSatisfaction', 'jobInvolvement',
  'jobLevel', 'jobSatisfaction', 'monthlyIncome', 'numCompaniesWorked', 'percentSalaryHike',
  'performanceRating', 'relationshipSatisfaction', 'stockOptionLevel', 'totalWorkingYears',
  'trainingTimesLastYear', 'workLifeBalance', 'yearsAtCompany', 'yearsInCurrentRole',
  'yearsSinceLastPromotion', 'yearsWithCurrManager', 'anomalyScoreIf',
]);

// ── Seed employees ────────────────────────────────────────────────────────
async function seedEmployees(ds: DataSource) {
  const csvPath = path.join(OUTPUTS_DIR, 'anomaly_scoring_results.csv');
  const rows = await readCsv(csvPath);
  const repo = ds.getRepository(EmployeeAnomaly);
  await repo.clear();
  // Reset SQLite autoincrement so IDs always start from 1 (penting agar
  // employeeIdx = id - 1 mapping ke shap_local tetap benar)
  await ds.query("DELETE FROM sqlite_sequence WHERE name='employee_anomalies'").catch(() => {});

  const entities = rows.map((row) => {
    const emp = new EmployeeAnomaly();
    for (const [csvCol, field] of Object.entries(COL_MAP)) {
      const raw = row[csvCol];
      if (raw === undefined || raw === '') continue;
      (emp as unknown as Record<string, unknown>)[field] = NUMERIC_FIELDS.has(field)
        ? parseFloat(raw)
        : raw;
    }
    return emp;
  });

  await repo.save(entities, { chunk: 200 });
  console.log(`✅  Seeded ${entities.length} employee records`);
}

// ── Seed SHAP local ───────────────────────────────────────────────────────
async function seedShapLocal(ds: DataSource) {
  if (!fs.existsSync(SHAP_LOCAL_CSV)) {
    console.warn('⚠️   shap_local_all.csv not found, skipping. Run model/compute_shap_all.py first.');
    return;
  }
  const rows = await readCsv(SHAP_LOCAL_CSV);
  const repo = ds.getRepository(ShapLocal);
  await repo.clear();

  const entities = rows
    .filter((r) => r['feature'] && r['shap_value'] !== '')
    .map((row) => {
      const s = new ShapLocal();
      s.employeeIdx = parseInt(row['employee_idx']);
      s.feature = row['feature'];
      s.shapValue = parseFloat(row['shap_value']);
      return s;
    });

  await repo.save(entities, { chunk: 500 });
  console.log(`✅  Seeded ${entities.length} SHAP local records`);
}

// ── Seed SHAP global ──────────────────────────────────────────────────────
async function seedShap(ds: DataSource) {
  const csvPath = path.join(OUTPUTS_DIR, 'shap_global_importance.csv');
  const rows = await readCsv(csvPath);
  const repo = ds.getRepository(ShapGlobalImportance);
  await repo.clear();

  const entities = rows.map((row) => {
    const s = new ShapGlobalImportance();
    s.feature = row['feature'];
    s.meanAbsShap = parseFloat(row['mean_abs_shap']);
    return s;
  });

  await repo.save(entities, { chunk: 100 });
  console.log(`✅  Seeded ${entities.length} SHAP global importance records`);
}

// ── Seed Master Employees ──────────────────────────────────────────────────
async function seedMasterEmployees(ds: DataSource) {
  const MASTER_CSV = path.resolve(__dirname, '../../dataset/WA_Fn-UseC_-HR-Employee-Attrition.csv');
  if (!fs.existsSync(MASTER_CSV)) {
    console.log(`⚠️  Master CSV not found at ${MASTER_CSV}, skipping master employee seed.`);
    return;
  }
  const rows = await readCsv(MASTER_CSV);
  const repo = ds.getRepository(MasterEmployee);
  await repo.clear();

  const entities = rows.map((row) => {
    const e = new MasterEmployee();
    e.Age = parseInt(row['Age']);
    e.Attrition = row['Attrition'];
    e.BusinessTravel = row['BusinessTravel'];
    e.DailyRate = parseInt(row['DailyRate']);
    e.Department = row['Department'];
    e.DistanceFromHome = parseInt(row['DistanceFromHome']);
    e.Education = parseInt(row['Education']);
    e.EducationField = row['EducationField'];
    e.EmployeeCount = parseInt(row['EmployeeCount']);
    e.EmployeeNumber = parseInt(row['EmployeeNumber']);
    e.EnvironmentSatisfaction = parseInt(row['EnvironmentSatisfaction']);
    e.Gender = row['Gender'];
    e.HourlyRate = parseInt(row['HourlyRate']);
    e.JobInvolvement = parseInt(row['JobInvolvement']);
    e.JobLevel = parseInt(row['JobLevel']);
    e.JobRole = row['JobRole'];
    e.JobSatisfaction = parseInt(row['JobSatisfaction']);
    e.MaritalStatus = row['MaritalStatus'];
    e.MonthlyIncome = parseInt(row['MonthlyIncome']);
    e.MonthlyRate = parseInt(row['MonthlyRate']);
    e.NumCompaniesWorked = parseInt(row['NumCompaniesWorked']);
    e.Over18 = row['Over18'];
    e.OverTime = row['OverTime'];
    e.PercentSalaryHike = parseInt(row['PercentSalaryHike']);
    e.PerformanceRating = parseInt(row['PerformanceRating']);
    e.RelationshipSatisfaction = parseInt(row['RelationshipSatisfaction']);
    e.StandardHours = parseInt(row['StandardHours']);
    e.StockOptionLevel = parseInt(row['StockOptionLevel']);
    e.TotalWorkingYears = parseInt(row['TotalWorkingYears']);
    e.TrainingTimesLastYear = parseInt(row['TrainingTimesLastYear']);
    e.WorkLifeBalance = parseInt(row['WorkLifeBalance']);
    e.YearsAtCompany = parseInt(row['YearsAtCompany']);
    e.YearsInCurrentRole = parseInt(row['YearsInCurrentRole']);
    e.YearsSinceLastPromotion = parseInt(row['YearsSinceLastPromotion']);
    e.YearsWithCurrManager = parseInt(row['YearsWithCurrManager']);
    return e;
  });

  await repo.save(entities, { chunk: 100 });
  console.log(`✅  Seeded ${entities.length} Master Employee records`);
}

// ── Seed Admin User ────────────────────────────────────────────────────────
async function seedAdminUser(ds: DataSource) {
  const repo = ds.getRepository(User);
  const existingAdmin = await repo.findOne({ where: { email: 'admin@admin.com' } });
  if (!existingAdmin) {
    const admin = new User();
    admin.name = 'Admin';
    admin.email = 'admin@admin.com';
    admin.password = await bcrypt.hash('admin', 10);
    admin.role = 'admin';
    await repo.save(admin);
    console.log('✅  Seeded default admin user (admin@admin.com / admin)');
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  await ds.initialize();
  console.log('🔌  Database connected');

  await seedMasterEmployees(ds);
  await seedAdminUser(ds);
  await seedEmployees(ds);
  await seedShapLocal(ds);
  await seedShap(ds);

  await ds.destroy();
  console.log('🎉  Seeding complete!');
}

main().catch((err) => { console.error('❌', err); process.exit(1); });
