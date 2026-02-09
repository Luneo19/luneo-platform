/**
 * Web Vitals DTOs
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, IsOptional, IsObject, IsDateString } from 'class-validator';

export class CreateWebVitalDto {
  @ApiProperty({
    description: 'Metric name',
    enum: ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'],
    example: 'LCP',
  })
  @IsEnum(['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'])
  name: string;

  @ApiProperty({
    description: 'Metric value',
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
    description: 'Device information',
    example: { type: 'mobile', brand: 'Apple' },
  })
  @IsOptional()
  @IsObject()
  device?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Connection information',
    example: { effectiveType: '4g', downlink: 10 },
  })
  @IsOptional()
  @IsObject()
  connection?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'User ID',
    example: 'user_123',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Session ID',
    example: 'session_123',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Timestamp in milliseconds (client-side)',
    example: 1704892800000,
  })
  @IsOptional()
  @IsNumber()
  timestamp?: number;
}

export class GetWebVitalsDto {
  @ApiPropertyOptional({
    description: 'Filter by metric name',
    enum: ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'],
  })
  @IsOptional()
  @IsEnum(['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'])
  metric?: string;

  @ApiPropertyOptional({
    description: 'Start date (ISO 8601)',
    example: '2025-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO 8601)',
    example: '2025-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by page path',
    example: '/dashboard',
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({
    description: 'User ID filter',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Brand ID filter',
  })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  pageNumber?: number;

  @ApiPropertyOptional({
    description: 'Page size',
    default: 50,
  })
  @IsOptional()
  @IsNumber()
  pageSize?: number;
}
