/**
 * DTO for AR model upload (multipart/form-data body fields)
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export const ALLOWED_3D_FORMATS = ['.glb', '.gltf', '.usdz', '.obj', '.fbx'] as const;

export class UploadModelDto {
  @ApiProperty({ description: 'Model display name', example: 'My AR Model' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'File format hint (must match uploaded file extension)',
    enum: ['glb', 'gltf', 'usdz', 'obj', 'fbx'],
  })
  @IsOptional()
  @IsIn(['glb', 'gltf', 'usdz', 'obj', 'fbx'])
  format?: string;

  @ApiPropertyOptional({
    description: 'AR project ID to associate the model with',
  })
  @IsOptional()
  @IsString()
  projectId?: string;
}
