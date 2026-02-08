import {
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Note: snake_case keys in anchorPoints example (e.g. left_temple, right_temple) maintained for API backwards compatibility */
export class AddProductMappingDto {
  @ApiProperty({
    description: 'ID du produit à mapper',
    example: 'prod_abc123',
  })
  @IsString()
  productId: string;

  @ApiPropertyOptional({
    description: 'ID du modèle 3D (si disponible)',
    example: 'model_xyz789',
  })
  @IsOptional()
  @IsString()
  modelId?: string;

  @ApiPropertyOptional({
    description: 'Points d\'ancrage 3D pour le positionnement',
    example: {
      left_temple: { x: 0, y: 0, z: 0 },
      right_temple: { x: 0, y: 0, z: 0 },
      bridge: { x: 0, y: 0, z: 0 },
    },
  })
  @IsOptional()
  @IsObject()
  anchorPoints?: Record<string, { x: number; y: number; z: number }>;

  @ApiPropertyOptional({
    description: 'Facteur d\'échelle (0.5 à 2.0)',
    example: 1.0,
    minimum: 0.5,
    maximum: 2.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  scaleFactor?: number;

  @ApiPropertyOptional({
    description: 'Ajustements supplémentaires',
    example: {
      rotation: { x: 0, y: 0, z: 0 },
      offset: { x: 0, y: 0, z: 0 },
    },
  })
  @IsOptional()
  @IsObject()
  adjustments?: Record<string, unknown>;
}
