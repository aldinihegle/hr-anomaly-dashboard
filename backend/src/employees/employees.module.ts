import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeAnomaly } from './employee.entity';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { ModelClientService } from './model-client.service';
import { ShapLocal } from '../shap/shap-local.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeAnomaly, ShapLocal]), AuthModule],
  providers: [EmployeesService, ModelClientService],
  controllers: [EmployeesController],
  exports: [EmployeesService],
})
export class EmployeesModule {}
