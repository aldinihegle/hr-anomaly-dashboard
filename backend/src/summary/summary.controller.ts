import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from '../employees/employees.service';
import { ShapService } from '../shap/shap.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
