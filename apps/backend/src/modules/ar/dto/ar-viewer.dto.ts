/**
 * DTOs for AR Viewer public API (session, interaction, performance).
 */

import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsObject,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ARInteractionType } from '@prisma/client';

/** POST /ar/session/start */
export class StartARSessionDto {
  @ApiProperty({ description: 'Project ID' })
  @IsString()
  projectId: string;

  @ApiPropertyOptional({ description: 'Model ID' })
  @IsOptional()
  @IsString()
  modelId?: string;

  @ApiProperty({ description: 'Platform: ios | android | desktop' })
  @IsString()
  platform: string;

  @ApiProperty({ description: 'Device identifier' })
  @IsString()
  device: string;

  @ApiProperty({ description: 'Browser identifier' })
  @IsString()
  browser: string;

  @ApiProperty({ description: 'AR method: webxr | quick-look | scene-viewer' })
  @IsString()
  arMethod: string;

  @ApiPropertyOptional({ description: 'Features used' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featuresUsed?: string[];

  @ApiPropertyOptional({ description: 'User ID if authenticated' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Region' })
  @IsOptional()
  @IsString()
  region?: string;
}

/** POST /ar/session/end */
export class EndARSessionDto {
  @ApiProperty({ description: 'Session ID' })
  @IsString()
  sessionId: string;

  @ApiPropertyOptional({ description: 'Duration in seconds' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({ description: 'Placement count' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  placementCount?: number;

  @ApiPropertyOptional({ description: 'Rotation count' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rotationCount?: number;

  @ApiPropertyOptional({ description: 'Scale change count' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  scaleChangeCount?: number;

  @ApiPropertyOptional({ description: 'Screenshots taken' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  screenshotsTaken?: number;

  @ApiPropertyOptional({ description: 'Share count' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shareCount?: number;

  @ApiPropertyOptional({ description: 'Tracking quality 0-1' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  trackingQuality?: number;

  @ApiPropertyOptional({ description: 'Conversion action' })
  @IsOptional()
  @IsString()
  conversionAction?: string;

  @ApiPropertyOptional({ description: 'Conversion value (e.g. EUR)' })
  @IsOptional()
  @IsNumber()
  conversionValue?: number;

  @ApiPropertyOptional({ description: 'Errors encountered' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  errors?: string[];
}

/** POST /ar/session/interaction */
export class LogARInteractionDto {
  @ApiProperty({ description: 'Session ID' })
  @IsString()
  sessionId: string;

  @ApiProperty({ enum: ARInteractionType, description: 'Interaction type' })
  @IsEnum(ARInteractionType)
  type: ARInteractionType;

  @ApiPropertyOptional({ description: 'Position { x, y, z }' })
  @IsOptional()
  @IsObject()
  position?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Rotation { x, y, z, w }' })
  @IsOptional()
  @IsObject()
  rotation?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Scale' })
  @IsOptional()
  @IsNumber()
  scale?: number;

  @ApiPropertyOptional({ description: 'Model ID' })
  @IsOptional()
  @IsString()
  modelId?: string;

  @ApiPropertyOptional({ description: 'Target ID (image target)' })
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

/** POST /ar/session/performance */
export class LogARPerformanceDto {
  @ApiProperty({ description: 'Session ID' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'FPS' })
  @IsNumber()
  @Min(0)
  fps: number;

  @ApiProperty({ description: 'Memory usage in MB' })
  @IsNumber()
  @Min(0)
  memoryUsage: number;

  @ApiPropertyOptional({ description: 'Battery drain % per minute' })
  @IsOptional()
  @IsNumber()
  batteryDrain?: number;

  @ApiPropertyOptional({ description: 'Thermal state' })
  @IsOptional()
  @IsString()
  thermalState?: string;

  @ApiProperty({ description: 'Tracking state' })
  @IsString()
  trackingState: string;
}
