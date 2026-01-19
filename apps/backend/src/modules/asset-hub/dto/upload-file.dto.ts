import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetFileType } from '@prisma/client';

export class UploadFileDto {
  @ApiProperty({
    description: 'Nom du fichier',
    example: 'mon-image.png',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'ID du projet (optionnel)',
    example: 'proj_abc123',
  })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiProperty({
    description: 'Type de fichier',
    enum: AssetFileType,
    example: AssetFileType.IMAGE,
  })
  @IsEnum(AssetFileType)
  type: AssetFileType;

  @ApiPropertyOptional({
    description: 'ID du dossier parent',
    example: 'folder_xyz789',
  })
  @IsOptional()
  @IsString()
  folderId?: string;

  @ApiPropertyOptional({
    description: 'Tags pour organisation',
    example: ['logo', 'branding', 'header'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Métadonnées du fichier',
    example: {
      width: 1920,
      height: 1080,
      format: 'png',
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
