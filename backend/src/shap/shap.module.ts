import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShapGlobalImportance } from './shap-global.entity';
import { ShapLocal } from './shap-local.entity';
import { ShapService } from './shap.service';
import { ShapController } from './shap.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ShapGlobalImportance, ShapLocal])],
  providers: [ShapService],
  controllers: [ShapController],
  exports: [ShapService],
})
export class ShapModule {}
