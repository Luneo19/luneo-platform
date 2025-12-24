import { IsString, IsEnum, IsOptional, IsInt, Min, Max, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQCReportDto {
  @ApiProperty({ description: 'Work order ID' })
  @IsString()
  @IsNotEmpty()
  workOrderId: string;

  @ApiProperty({ description: 'QC status', enum: ['passed', 'failed', 'needs_revision'] })
  @IsEnum(['passed', 'failed', 'needs_revision'])
  status: 'passed' | 'failed' | 'needs_revision';

  @ApiPropertyOptional({ description: 'Quality score (0-100)' })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  qualityScore?: number;

  @ApiPropertyOptional({ description: 'Issues found' })
  @IsObject()
  @IsOptional()
  issues?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}




















