import { IsString, IsObject, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDesignDto {
  @ApiProperty({ description: 'ID du produit', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Prompt pour la génération IA', example: 'A beautiful sunset over mountains' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ description: 'Options de génération', example: { style: 'realistic', resolution: 'high' } })
  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Taille du batch pour génération multiple', example: 1 })
  @IsOptional()
  batchSize?: number;
}
