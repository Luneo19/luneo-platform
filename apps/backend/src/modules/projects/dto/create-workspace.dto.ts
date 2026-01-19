import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  MinLength,
  MaxLength,
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
  config?: Record<string, unknown>;
}
