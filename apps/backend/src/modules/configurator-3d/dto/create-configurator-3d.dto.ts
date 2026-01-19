import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConfigurator3DConfigurationDto {
  @ApiProperty({
    description: 'Nom de la configuration 3D',
    example: 'Configurateur T-shirt Premium',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Description de la configuration',
    example: 'Configurateur 3D pour personnalisation de t-shirts',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'ID du modèle 3D associé',
    example: 'model_abc123',
  })
  @IsOptional()
  @IsString()
  model3dId?: string;

  @ApiProperty({
    description: 'Configuration de la scène Three.js',
    example: {
      camera: { position: { x: 0, y: 1.5, z: 3 } },
      lights: [{ type: 'ambient', intensity: 0.5 }],
      environment: 'studio',
    },
  })
  @IsObject()
  sceneConfig: Record<string, unknown>;

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
