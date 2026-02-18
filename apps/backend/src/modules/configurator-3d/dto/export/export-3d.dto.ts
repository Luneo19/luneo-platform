import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const EXPORT_3D_FORMAT = ['gltf', 'glb', 'obj', 'fbx', 'stl'] as const;
export type Export3DFormat = (typeof EXPORT_3D_FORMAT)[number];

export class Export3DDto {
  @ApiPropertyOptional({
    description: '3D export format',
    enum: EXPORT_3D_FORMAT,
    default: 'glb',
  })
  @IsOptional()
  @IsIn(EXPORT_3D_FORMAT)
  format?: Export3DFormat = 'glb';

  @ApiPropertyOptional({
    description: 'Include textures in export',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeTextures?: boolean = true;
}
