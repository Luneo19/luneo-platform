import { IsString, IsOptional, IsEnum, IsObject, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DesignStatus } from '@prisma/client';

export class UpdateDesignDto {
  @ApiPropertyOptional({
    description: 'Nom du design',
    example: 'Mon design personnalisé',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Description du design',
    example: 'Description détaillée du design',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Statut du design',
    enum: DesignStatus,
    example: DesignStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(DesignStatus)
  status?: DesignStatus;

  @ApiPropertyOptional({
    description: 'Données du design (canvas, éléments, etc.)',
    example: { objects: [], background: '#ffffff' },
  })
  @IsOptional()
  @IsObject()
  designData?: Record<string, unknown>;
}
