import { IsString, IsInt, IsIn, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateEmployeeDto {
  @ApiProperty() @Type(() => Number) @IsInt() @Min(18) @Max(65)
  age: number;

  @ApiProperty({ enum: ['Travel_Rarely', 'Travel_Frequently', 'Non-Travel'] })
  @IsIn(['Travel_Rarely', 'Travel_Frequently', 'Non-Travel'])
  businessTravel: string;

  @ApiProperty({
    enum: ['Sales', 'Research & Development', 'Human Resources'],
  })
  @IsIn(['Sales', 'Research & Development', 'Human Resources'])
  department: string;

  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) @Max(30)
  distanceFromHome: number;

  @ApiProperty({ minimum: 1, maximum: 5 }) @Type(() => Number) @IsInt() @Min(1) @Max(5)
  education: number;

  @ApiProperty({
    enum: ['Life Sciences', 'Medical', 'Marketing', 'Technical Degree', 'Human Resources', 'Other'],
  })
  @IsIn(['Life Sciences', 'Medical', 'Marketing', 'Technical Degree', 'Human Resources', 'Other'])
  educationField: string;

  @ApiProperty({ minimum: 1, maximum: 4 }) @Type(() => Number) @IsInt() @Min(1) @Max(4)
  environmentSatisfaction: number;

  @ApiProperty({ enum: ['Male', 'Female'] })
  @IsIn(['Male', 'Female'])
  gender: string;

  @ApiProperty({ minimum: 1, maximum: 4 }) @Type(() => Number) @IsInt() @Min(1) @Max(4)
  jobInvolvement: number;

  @ApiProperty({ minimum: 1, maximum: 5 }) @Type(() => Number) @IsInt() @Min(1) @Max(5)
  jobLevel: number;

  @ApiProperty({
    enum: [
      'Sales Executive', 'Research Scientist', 'Laboratory Technician',
      'Manufacturing Director', 'Healthcare Representative', 'Manager',
      'Sales Representative', 'Research Director', 'Human Resources',
    ],
  })
  @IsString()
  jobRole: string;

  @ApiProperty({ minimum: 1, maximum: 4 }) @Type(() => Number) @IsInt() @Min(1) @Max(4)
  jobSatisfaction: number;

  @ApiProperty({ enum: ['Single', 'Married', 'Divorced'] })
  @IsIn(['Single', 'Married', 'Divorced'])
  maritalStatus: string;

  @ApiProperty() @Type(() => Number) @IsInt() @Min(1000)
  monthlyIncome: number;

  @ApiProperty() @Type(() => Number) @IsInt() @Min(0)
  dailyRate: number;

  @ApiProperty() @Type(() => Number) @IsInt() @Min(0)
  hourlyRate: number;

  @ApiProperty() @Type(() => Number) @IsInt() @Min(0)
  monthlyRate: number;

  @ApiProperty() @Type(() => Number) @IsInt() @Min(0) @Max(9)
  numCompaniesWorked: number;

  @ApiProperty({ enum: ['Yes', 'No'] })
  @IsIn(['Yes', 'No'])
  overTime: string;

  @ApiProperty({ minimum: 11, maximum: 25 }) @Type(() => Number) @IsInt() @Min(11) @Max(25)
  percentSalaryHike: number;

  @ApiProperty({ minimum: 3, maximum: 4 }) @Type(() => Number) @IsInt() @Min(3) @Max(4)
  performanceRating: number;

  @ApiProperty({ minimum: 1, maximum: 4 }) @Type(() => Number) @IsInt() @Min(1) @Max(4)
  relationshipSatisfaction: number;

  @ApiProperty({ minimum: 0, maximum: 3 }) @Type(() => Number) @IsInt() @Min(0) @Max(3)
  stockOptionLevel: number;

  @ApiProperty() @Type(() => Number) @IsInt() @Min(0)
  totalWorkingYears: number;

  @ApiProperty({ minimum: 0, maximum: 6 }) @Type(() => Number) @IsInt() @Min(0) @Max(6)
  trainingTimesLastYear: number;

  @ApiProperty({ minimum: 1, maximum: 4 }) @Type(() => Number) @IsInt() @Min(1) @Max(4)
  workLifeBalance: number;

  @ApiProperty() @Type(() => Number) @IsInt() @Min(0)
  yearsAtCompany: number;

  @ApiProperty() @Type(() => Number) @IsInt() @Min(0)
  yearsInCurrentRole: number;

  @ApiProperty() @Type(() => Number) @IsInt() @Min(0)
  yearsSinceLastPromotion: number;

  @ApiProperty() @Type(() => Number) @IsInt() @Min(0)
  yearsWithCurrManager: number;

  @ApiPropertyOptional({ enum: ['Yes', 'No'], default: 'No' })
  @IsOptional()
  @IsIn(['Yes', 'No'])
  attrition?: string;
}
