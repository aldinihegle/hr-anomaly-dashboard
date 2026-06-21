import { Module } from '@nestjs/common';
import { SummaryController } from './summary.controller';
import { EmployeesModule } from '../employees/employees.module';
import { ShapModule } from '../shap/shap.module';

@Module({
  imports: [EmployeesModule, ShapModule],
  controllers: [SummaryController],
})
export class SummaryModule {}
