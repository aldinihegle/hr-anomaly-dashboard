import { IsOptional, IsIn, IsInt, Min, Max, IsString, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryEmployeesDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2000)
  perPage?: number = 50;

  @ApiPropertyOptional({ enum: ['rendah', 'sedang', 'tinggi'] })
  @IsOptional()
  @IsIn(['rendah', 'sedang', 'tinggi'])
  risk?: string;

  @ApiPropertyOptional({ default: 'anomalyScoreIf' })
  @IsOptional()
  @IsString()
  sort?: string = 'anomalyScoreIf';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value as string).toLowerCase())
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobRole?: string;

  @ApiPropertyOptional({ enum: ['Yes', 'No'] })
  @IsOptional()
  @IsIn(['Yes', 'No'])
  overTime?: string;

  @ApiPropertyOptional({ description: 'Filter minimum anomaly score (inclusive)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minScore?: number;

  @ApiPropertyOptional({ description: 'Filter maximum anomaly score (inclusive)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxScore?: number;
}
