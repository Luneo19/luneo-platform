import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VisualCustomizerLayerType } from '@prisma/client';

export class AddLayerDto {
  @ApiProperty({
    description: 'Nom de la couche',
    example: 'Background Layer',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Type de couche',
    enum: VisualCustomizerLayerType,
    example: VisualCustomizerLayerType.IMAGE,
  })
  @IsEnum(VisualCustomizerLayerType)
  type: VisualCustomizerLayerType;

  @ApiPropertyOptional({
    description: 'Ordre d\'affichage',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;

  @ApiProperty({
    description: 'Configuration de la couche',
    example: {
      x: 0,
      y: 0,
      width: 800,
      height: 1000,
      imageUrl: 'https://...',
    },
  })
  @IsObject()
  config: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Couche verrouillée',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;

  @ApiPropertyOptional({
    description: 'Couche visible',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
