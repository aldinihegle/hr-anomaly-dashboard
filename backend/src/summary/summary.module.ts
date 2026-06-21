import { Module } from '@nestjs/common';
import { SummaryController } from './summary.controller';
import { EmployeesModule } from '../employees/employees.module';
import { ShapModule } from '../shap/shap.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [EmployeesModule, ShapModule, AuthModule],
  controllers: [SummaryController],
})
export class SummaryModule {}
