import {
  IsOptional,
  IsInt,
  IsString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  CustomizerType,
  CustomizerStatus,
} from '@prisma/client';

export class CustomizerQueryDto {
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
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Search by name or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by type',
    enum: CustomizerType,
  })
  @IsOptional()
  @IsEnum(CustomizerType)
  type?: CustomizerType;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: CustomizerStatus,
  })
  @IsOptional()
  @IsEnum(CustomizerStatus)
  status?: CustomizerStatus;
}
