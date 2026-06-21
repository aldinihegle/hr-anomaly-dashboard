import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { EmployeeAnomaly } from './employee.entity';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ModelClientService } from './model-client.service';
import { ShapLocal } from '../shap/shap-local.entity';

const ALLOWED_SORT = new Set([
  'anomalyScoreIf',
  'monthlyIncome',
  'age',
  'totalWorkingYears',
  'id',
]);

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(EmployeeAnomaly)
    private readonly repo: Repository<EmployeeAnomaly>,
    @InjectRepository(ShapLocal)
    private readonly shapLocalRepo: Repository<ShapLocal>,
    private readonly modelClient: ModelClientService,
  ) {}

  async findAll(q: QueryEmployeesDto) {
    const {
      page = 1,
      perPage = 50,
      risk,
      sort = 'anomalyScoreIf',
      order = 'desc',
      department,
      jobRole,
      overTime,
      minScore,
      maxScore,
    } = q;

    if (!ALLOWED_SORT.has(sort)) {
      throw new BadRequestException(`Invalid sort column: ${sort}`);
    }

    const where: Record<string, unknown> = {};
    if (risk) where.riskCategory = risk;
    if (overTime) where.overTime = overTime;
    if (department) where.department = Like(`%${department}%`);
    if (jobRole) where.jobRole = Like(`%${jobRole}%`);
    if (minScore !== undefined && maxScore !== undefined) {
      where.anomalyScoreIf = Between(minScore, maxScore);
    } else if (minScore !== undefined) {
      where.anomalyScoreIf = MoreThanOrEqual(minScore);
    } else if (maxScore !== undefined) {
      where.anomalyScoreIf = LessThanOrEqual(maxScore);
    }

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { [sort]: order.toUpperCase() as 'ASC' | 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      total,
      page,
      perPage,
      pages: Math.ceil(total / perPage),
      items,
    };
  }

  async findOne(id: number) {
    return this.repo.findOneByOrFail({ id });
  }

  async create(dto: CreateEmployeeDto): Promise<EmployeeAnomaly> {
    // Build the feature payload expected by the Python model
    const payload: Record<string, unknown> = {
      Age: dto.age,
      BusinessTravel: dto.businessTravel,
      Department: dto.department,
      DistanceFromHome: dto.distanceFromHome,
      Education: dto.education,
      EducationField: dto.educationField,
      EnvironmentSatisfaction: dto.environmentSatisfaction,
      Gender: dto.gender,
      JobInvolvement: dto.jobInvolvement,
      JobLevel: dto.jobLevel,
      JobRole: dto.jobRole,
      JobSatisfaction: dto.jobSatisfaction,
      MaritalStatus: dto.maritalStatus,
      MonthlyIncome: dto.monthlyIncome,
      NumCompaniesWorked: dto.numCompaniesWorked,
      OverTime: dto.overTime,
      PercentSalaryHike: dto.percentSalaryHike,
      PerformanceRating: dto.performanceRating,
      RelationshipSatisfaction: dto.relationshipSatisfaction,
      StockOptionLevel: dto.stockOptionLevel,
      TotalWorkingYears: dto.totalWorkingYears,
      TrainingTimesLastYear: dto.trainingTimesLastYear,
      WorkLifeBalance: dto.workLifeBalance,
      YearsAtCompany: dto.yearsAtCompany,
      YearsInCurrentRole: dto.yearsInCurrentRole,
      YearsSinceLastPromotion: dto.yearsSinceLastPromotion,
      YearsWithCurrManager: dto.yearsWithCurrManager,
    };

    const prediction = await this.modelClient.predict(payload);

    const employee = this.repo.create({
      ...dto,
      attrition: dto.attrition ?? 'No',
      anomalyScoreIf: prediction.anomaly_score_if,
      riskCategory: prediction.risk_category,
    });
    const saved = await this.repo.save(employee);

    // Save SHAP local values for this employee (employeeIdx = id - 1)
    const employeeIdx = saved.id - 1;
    const shapRows = (prediction.local_shap_top10 ?? []).map((s) =>
      this.shapLocalRepo.create({
        employeeIdx,
        feature: s.feature,
        shapValue: s.shap,
      }),
    );
    if (shapRows.length) await this.shapLocalRepo.save(shapRows);

    return saved;
  }

  async findTop(limit = 20) {
    return this.repo.find({
      order: { anomalyScoreIf: 'DESC' },
      take: Math.min(limit, 200),
    });
  }

  async riskDistribution() {
    const rows = await this.repo
      .createQueryBuilder('e')
      .select('e.riskCategory', 'kategori')
      .addSelect('COUNT(*)', 'jumlah')
      .groupBy('e.riskCategory')
      .getRawMany<{ kategori: string; jumlah: string }>();

    const total = rows.reduce((s, r) => s + parseInt(r.jumlah), 0);
    return rows.map((r) => ({
      kategori: r.kategori,
      jumlah: parseInt(r.jumlah),
      persentase: total ? (parseInt(r.jumlah) / total) * 100 : 0,
    }));
  }

  async statistics() {
    const raw = await this.repo
      .createQueryBuilder('e')
      .select('AVG(e.anomalyScoreIf)', 'mean')
      .addSelect('MIN(e.anomalyScoreIf)', 'min')
      .addSelect('MAX(e.anomalyScoreIf)', 'max')
      .addSelect('COUNT(*)', 'total')
      .getRawOne<{ mean: string; min: string; max: string; total: string }>();

    return {
      mean: parseFloat(raw?.mean ?? '0'),
      min: parseFloat(raw?.min ?? '0'),
      max: parseFloat(raw?.max ?? '0'),
      total: parseInt(raw?.total ?? '0'),
    };
  }

  async distinctValues(field: 'department' | 'jobRole') {
    const rows = await this.repo
      .createQueryBuilder('e')
      .select(`DISTINCT e.${field}`, 'value')
      .where(`e.${field} IS NOT NULL`)
      .orderBy(`e.${field}`, 'ASC')
      .getRawMany<{ value: string }>();
    return rows.map((r) => r.value);
  }
}
