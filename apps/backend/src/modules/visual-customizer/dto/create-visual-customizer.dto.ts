import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVisualCustomizerDto {
  @ApiProperty({
    description: 'Nom du customizer',
    example: 'Customizer T-shirt',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Description du customizer',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Configuration du canvas (dimensions, background, etc.)',
    example: {
      width: 800,
      height: 1000,
      backgroundColor: '#FFFFFF',
    },
  })
  @IsObject()
  canvasConfig: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Configuration UI',
    example: {
      primaryColor: '#000000',
      showGrid: true,
    },
  })
  @IsOptional()
  @IsObject()
  uiConfig?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Activer le customizer',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
