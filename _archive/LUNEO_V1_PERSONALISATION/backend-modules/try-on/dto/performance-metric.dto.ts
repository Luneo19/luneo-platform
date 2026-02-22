import {
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PerformanceMetricDto {
  @ApiProperty({ description: 'FPS moyen', example: 30 })
  @IsNumber()
  @Min(0)
  @Max(120)
  fps: number;

  @ApiProperty({ description: 'Latence détection ML en ms', example: 25 })
  @IsNumber()
  @Min(0)
  detectionLatencyMs: number;

  @ApiProperty({ description: 'Latence rendu 3D en ms', example: 12 })
  @IsNumber()
  @Min(0)
  renderLatencyMs: number;

  @ApiPropertyOptional({
    description: 'Info GPU (WebGL renderer string)',
    example: 'ANGLE (Apple, Apple M1 Pro, OpenGL 4.1)',
  })
  @IsOptional()
  @IsString()
  gpuInfo?: string;

  @ApiProperty({
    description: 'Type de device',
    example: 'mobile',
  })
  @IsString()
  deviceType: string;

  @ApiPropertyOptional({
    description: 'Info navigateur',
    example: 'Chrome 121.0',
  })
  @IsOptional()
  @IsString()
  browserInfo?: string;
}

export class BatchPerformanceMetricsDto {
  @ApiProperty({
    description: 'Tableau de métriques de performance (max 100 samples)',
    type: [PerformanceMetricDto],
  })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => PerformanceMetricDto)
  metrics: PerformanceMetricDto[];
}
