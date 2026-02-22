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
import { WorkspaceEnvironment } from '@prisma/client';

export class CreateWorkspaceDto {
  @ApiProperty({
    description: 'Nom du workspace',
    example: 'Development Environment',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Slug unique pour le workspace',
    example: 'development-environment',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Description du workspace',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Environnement du workspace',
    enum: WorkspaceEnvironment,
    example: WorkspaceEnvironment.DEVELOPMENT,
  })
  @IsEnum(WorkspaceEnvironment)
  environment: WorkspaceEnvironment;

  @ApiPropertyOptional({
    description: 'Configuration spécifique à l\'environnement (JSON)',
    example: { apiUrl: 'https://dev.api.example.com', debug: true },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Alias pour settings (rétrocompatibilité)',
    deprecated: true,
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
