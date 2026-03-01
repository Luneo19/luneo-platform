import { ApiPropertyOptional } from '@nestjs/swagger';
import { KnowledgeGapStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class LearningGapQueryDto {
  @ApiPropertyOptional({ enum: KnowledgeGapStatus })
  @IsOptional()
  @IsEnum(KnowledgeGapStatus)
  status?: KnowledgeGapStatus;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  limit: number = 20;
}
