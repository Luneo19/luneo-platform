import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectType } from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Nom du projet',
    example: 'Mon Projet E-commerce',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Description du projet',
    example: 'Projet de personnalisation pour ma boutique en ligne',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Type de projet',
    enum: ProjectType,
    example: ProjectType.VIRTUAL_TRY_ON,
  })
  @IsEnum(ProjectType)
  type: ProjectType;

  @ApiProperty({
    description: 'Slug unique pour le projet (utilisé dans les URLs)',
    example: 'mon-projet-ecommerce',
    pattern: '^[a-z0-9-]+$',
  })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets',
  })
  @MinLength(3)
  @MaxLength(50)
  slug: string;

  @ApiPropertyOptional({
    description: 'Configuration spécifique au projet (JSON)',
    example: { theme: 'dark', language: 'fr' },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'URL du webhook pour les événements du projet',
    example: 'https://example.com/webhooks',
  })
  @IsOptional()
  @IsString()
  webhookUrl?: string;
}
