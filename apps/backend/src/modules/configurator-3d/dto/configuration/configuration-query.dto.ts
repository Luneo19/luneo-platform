import {
  IsOptional,
  IsInt,
  IsString,
  IsEnum,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConfiguratorType, ConfiguratorStatus } from '@prisma/client';
import { CONFIGURATOR_3D_LIMITS } from '../../configurator-3d.constants';

const SORT_ORDER = ['asc', 'desc'] as const;
type SortOrder = (typeof SORT_ORDER)[number];

export class ConfigurationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: CONFIGURATOR_3D_LIMITS.MAX_QUERY_LIMIT,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(CONFIGURATOR_3D_LIMITS.MAX_QUERY_LIMIT)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Search by name or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ConfiguratorStatus,
  })
  @IsOptional()
  @IsEnum(ConfiguratorStatus)
  status?: ConfiguratorStatus;

  @ApiPropertyOptional({
    description: 'Filter by type',
    enum: ConfiguratorType,
  })
  @IsOptional()
  @IsEnum(ConfiguratorType)
  type?: ConfiguratorType;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SORT_ORDER,
  })
  @IsOptional()
  @IsIn(SORT_ORDER)
  sortOrder?: SortOrder = 'desc';
}
