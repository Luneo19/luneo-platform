import { IsString, IsEnum, IsOptional, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum RenderType {
  PREVIEW = 'preview',
  FINAL = 'final',
  AR = 'ar',
  MANUFACTURING = 'manufacturing',
}

export class EnqueueRenderDto {
  @ApiProperty({ description: 'Snapshot ID', required: false })
  @IsString()
  @IsOptional()
  snapshotId?: string;

  @ApiProperty({ description: 'Design ID', required: false })
  @IsString()
  @IsOptional()
  designId?: string;

  @ApiProperty({ description: 'Customization ID', required: false })
  @IsString()
  @IsOptional()
  customizationId?: string;

  @ApiProperty({ description: 'Render type', enum: RenderType })
  @IsEnum(RenderType)
  @IsNotEmpty()
  type: RenderType;

  @ApiProperty({ description: 'Priority (higher = more priority)', required: false, default: 0 })
  @IsOptional()
  priority?: number;

  @ApiProperty({ description: 'Render options', required: false })
  @IsObject()
  @IsOptional()
  options?: Record<string, any>;
}








