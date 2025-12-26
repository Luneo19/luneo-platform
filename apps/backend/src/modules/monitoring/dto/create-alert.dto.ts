import { IsString, IsEnum, IsOptional, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertSeverity } from '@prisma/client';

export class CreateAlertDto {
  @ApiProperty({ enum: AlertSeverity })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  service?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metric?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  threshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  currentValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

