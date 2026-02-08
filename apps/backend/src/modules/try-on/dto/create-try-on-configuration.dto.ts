import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TryOnProductType } from '@prisma/client';

/** Note: snake_case keys in config example (e.g. face_detection, confidence_threshold) maintained for API backwards compatibility */
export class CreateTryOnConfigurationDto {
  @ApiProperty({
    description: 'Nom de la configuration',
    example: 'Lunettes de soleil - Collection été',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Type de produit pour le try-on',
    enum: TryOnProductType,
    example: TryOnProductType.GLASSES,
  })
  @IsEnum(TryOnProductType)
  productType: TryOnProductType;

  @ApiProperty({
    description: 'Configuration technique (face detection, rendering, AR)',
    example: {
      face_detection: {
        model: 'mediapipe',
        confidence_threshold: 0.8,
      },
      rendering: {
        quality: 'high',
        shadows: true,
        reflections: true,
      },
      ar: {
        enabled: true,
        platform: 'webxr',
      },
    },
  })
  @IsObject()
  settings: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Configuration UI (couleurs, layout, etc.)',
    example: {
      primaryColor: '#000000',
      showControls: true,
    },
  })
  @IsOptional()
  @IsObject()
  uiConfig?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Activer la configuration',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
