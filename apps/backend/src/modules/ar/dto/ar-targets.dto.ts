/**
 * DTOs for AR Image Targets API
 */

import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TriggerAction } from '@prisma/client';

export class CreateImageTargetDto {
  @ApiProperty({ description: 'Display name for the target' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Physical width in cm (for AR scale)' })
  @IsNumber()
  @Min(0.1)
  @Max(1000)
  physicalWidthCm: number;

  @ApiProperty({ description: 'Physical height in cm (for AR scale)' })
  @IsNumber()
  @Min(0.1)
  @Max(1000)
  physicalHeightCm: number;

  @ApiPropertyOptional({ description: 'Linked 3D model ID' })
  @IsOptional()
  @IsString()
  linkedModelId?: string;

  @ApiPropertyOptional({ enum: TriggerAction, description: 'Action when target is recognized' })
  @IsOptional()
  @IsEnum(TriggerAction)
  triggerAction?: TriggerAction;

  @ApiPropertyOptional({ description: 'Trigger config (animation, autoplay, etc.)' })
  @IsOptional()
  @IsObject()
  triggerConfig?: Record<string, unknown>;
}

export class UpdateImageTargetDto {
  @ApiPropertyOptional({ description: 'Display name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Physical width in cm' })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1000)
  physicalWidthCm?: number;

  @ApiPropertyOptional({ description: 'Physical height in cm' })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1000)
  physicalHeightCm?: number;

  @ApiPropertyOptional({ description: 'Linked 3D model ID or null to unlink' })
  @IsOptional()
  linkedModelId?: string | null;

  @ApiPropertyOptional({ enum: TriggerAction })
  @IsOptional()
  @IsEnum(TriggerAction)
  triggerAction?: TriggerAction;

  @ApiPropertyOptional({ description: 'Trigger config' })
  @IsOptional()
  @IsObject()
  triggerConfig?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Active flag' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
