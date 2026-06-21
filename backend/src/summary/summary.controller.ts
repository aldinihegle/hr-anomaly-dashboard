import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EmployeesService } from '../employees/employees.service';
import { ShapService } from '../shap/shap.service';

@ApiTags('summary')
@Controller('summary')
export class SummaryController {
  constructor(
    private readonly empSvc: EmployeesService,
    private readonly shapSvc: ShapService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Ringkasan dashboard: distribusi risiko, statistik IF score, top SHAP' })
  async summary() {
    const [riskDistribution, anomalyScoreStats, topShap] = await Promise.all([
      this.empSvc.riskDistribution(),
      this.empSvc.statistics(),
      this.shapSvc.findGlobal(10),
    ]);
    return { riskDistribution, anomalyScoreStats, topShap };
  }
}
