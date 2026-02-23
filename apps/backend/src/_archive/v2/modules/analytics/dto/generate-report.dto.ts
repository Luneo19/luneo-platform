import { IsEnum, IsBoolean, IsOptional, ValidateNested, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DateRangeDto {
  @ApiProperty()
  @IsDateString()
  start: string;

  @ApiProperty()
  @IsDateString()
  end: string;
}

export class GenerateReportDto {
  @ApiProperty({ enum: ['sales', 'products', 'customers', 'custom'] })
  @IsEnum(['sales', 'products', 'customers', 'custom'])
  type: 'sales' | 'products' | 'customers' | 'custom';

  @ApiProperty({ type: DateRangeDto })
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange: DateRangeDto;

  @ApiPropertyOptional({ enum: ['pdf', 'csv', 'json'], default: 'pdf' })
  @IsOptional()
  @IsEnum(['pdf', 'csv', 'json'])
  format?: 'pdf' | 'csv' | 'json';

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean;
}
