import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, IsOptional } from 'class-validator';

/**
 * DTO for recording a web vital metric
 * Matches the WebVitalData interface expected by AnalyticsService.recordWebVital
 */
export class RecordWebVitalDto {
  @ApiProperty({
    description: 'Metric name',
    enum: ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'],
    example: 'LCP',
  })
  @IsEnum(['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'])
  name: string;

  @ApiProperty({
    description: 'Metric value in milliseconds',
    example: 2500,
  })
  @IsNumber()
  value: number;

  @ApiPropertyOptional({
    description: 'Rating',
    enum: ['good', 'needs-improvement', 'poor'],
    example: 'good',
  })
  @IsOptional()
  @IsEnum(['good', 'needs-improvement', 'poor'])
  rating?: string;

  @ApiPropertyOptional({
    description: 'Delta value',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  delta?: number;

  @ApiProperty({
    description: 'Unique metric ID',
    example: 'cls-1234567890',
  })
  @IsString()
  id: string;

  @ApiPropertyOptional({
    description: 'Page URL',
    example: '/dashboard',
  })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({
    description: 'Timestamp in milliseconds (optional, server uses current time if omitted)',
    example: 1704892800000,
  })
  @IsOptional()
  @IsNumber()
  timestamp?: number;
}
