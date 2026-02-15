import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadModelDto {
  @ApiProperty({
    description: 'ID du produit associé',
    example: 'prod_abc123',
  })
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'Format du modèle 3D',
    enum: ['glb', 'gltf', 'usdz'],
    example: 'glb',
  })
  @IsEnum(['glb', 'gltf', 'usdz'] as const)
  format: 'glb' | 'gltf' | 'usdz';

  @ApiPropertyOptional({
    description: 'Position 3D par défaut',
    example: { x: 0, y: 0, z: 0 },
  })
  @IsOptional()
  @IsObject()
  defaultPosition?: { x: number; y: number; z: number };

  @ApiPropertyOptional({
    description: 'Rotation 3D par défaut',
    example: { x: 0, y: 0, z: 0 },
  })
  @IsOptional()
  @IsObject()
  defaultRotation?: { x: number; y: number; z: number };

  @ApiPropertyOptional({
    description: 'Activer l\'occlusion (doigts devant le produit)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enableOcclusion?: boolean;

  @ApiPropertyOptional({
    description: 'Activer les ombres',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enableShadows?: boolean;
}
