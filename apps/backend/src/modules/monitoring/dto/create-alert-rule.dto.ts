import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertSeverity } from '@prisma/client';

export class CreateAlertRuleDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  service: string;

  @ApiProperty()
  @IsString()
  metric: string;

  @ApiProperty({ description: 'Condition: gt, lt, eq, gte, lte' })
  @IsString()
  condition: string;

  @ApiProperty()
  @IsNumber()
  threshold: number;

  @ApiProperty({ enum: AlertSeverity })
  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Cooldown in seconds', default: 300 })
  @IsOptional()
  @IsInt()
  @Min(0)
  cooldown?: number;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

