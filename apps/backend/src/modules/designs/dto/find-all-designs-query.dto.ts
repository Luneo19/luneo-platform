import { IsOptional, IsEnum, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DesignStatus } from '@prisma/client';

export class FindAllDesignsQueryDto {
  @ApiPropertyOptional({
    description: 'Numéro de page',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Nombre d\'éléments par page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filtrer par statut de génération',
    enum: DesignStatus,
    example: DesignStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(DesignStatus)
  status?: DesignStatus;

  @ApiPropertyOptional({
    description: 'Recherche textuelle dans les noms et descriptions de designs',
    example: 'collier',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
