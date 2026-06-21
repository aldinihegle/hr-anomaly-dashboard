import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeAnomaly } from './employees/employee.entity';
import { ShapGlobalImportance } from './shap/shap-global.entity';
import { ShapLocal } from './shap/shap-local.entity';
import { User } from './users/user.entity';
import { MasterEmployee } from './master-data/master-employee.entity';
import { EmployeesModule } from './employees/employees.module';
import { ShapModule } from './shap/shap.module';
import { SummaryModule } from './summary/summary.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      schema: process.env.DB_SCHEMA || 'public',
      entities: [EmployeeAnomaly, ShapGlobalImportance, ShapLocal, User, MasterEmployee],
      synchronize: true, // auto-create tables from entities
      ssl: true,
    }),
    EmployeesModule,
    ShapModule,
    SummaryModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
