import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('employees')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly svc: EmployeesService) {}

  @Post()
  @ApiOperation({ summary: 'Tambah karyawan baru — anomaly score dihitung otomatis via model' })
  create(@Body() dto: CreateEmployeeDto) {
    return this.svc.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List karyawan dengan filter, sort, dan paginasi' })
  findAll(@Query() q: QueryEmployeesDto) {
    return this.svc.findAll(q);
  }

  @Get('top')
  @ApiOperation({ summary: 'Top N karyawan dengan anomaly score tertinggi' })
  top(@Query('limit') limit = 20) {
    return this.svc.findTop(+limit);
  }

  @Get('risk-distribution')
  @ApiOperation({ summary: 'Distribusi jumlah karyawan per kategori risiko' })
  riskDistribution() {
    return this.svc.riskDistribution();
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Statistik anomaly score IF (mean, min, max, total)' })
  statistics() {
    return this.svc.statistics();
  }

  @Get('filters/departments')
  @ApiOperation({ summary: 'Daftar nilai Department untuk filter' })
  departments() {
    return this.svc.distinctValues('department');
  }

  @Get('filters/job-roles')
  @ApiOperation({ summary: 'Daftar nilai JobRole untuk filter' })
  jobRoles() {
    return this.svc.distinctValues('jobRole');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail satu karyawan berdasarkan ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }
}
