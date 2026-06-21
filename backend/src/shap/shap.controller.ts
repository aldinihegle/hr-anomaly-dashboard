import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ShapService } from './shap.service';

@ApiTags('shap')
@Controller('shap')
export class ShapController {
  constructor(private readonly svc: ShapService) {}

  @Get('global')
  @ApiOperation({ summary: 'Global SHAP feature importance (top N fitur)' })
  @ApiQuery({ name: 'top', required: false, type: Number, example: 10 })
  global(@Query('top') top = 10) {
    return this.svc.findGlobal(+top);
  }

  @Get('local/:employeeId')
  @ApiOperation({ summary: 'Local SHAP explanation untuk satu karyawan (top N fitur berdasarkan |SHAP|)' })
  @ApiQuery({ name: 'top', required: false, type: Number, example: 10 })
  local(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query('top') top = 10,
  ) {
    return this.svc.findLocal(employeeId, +top);
  }
}
