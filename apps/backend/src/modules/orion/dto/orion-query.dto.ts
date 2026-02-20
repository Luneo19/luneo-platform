import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class GetHealthScoresQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by churn risk level' })
  @IsOptional()
  @IsString()
  churnRisk?: string;
}

export class GetInsightsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by agent type' })
  @IsOptional()
  @IsString()
  agentType?: string;

  @ApiPropertyOptional({ description: 'Filter by read status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isRead?: boolean;
}

export class GetActionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by agent type' })
  @IsOptional()
  @IsString()
  agentType?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class GetActivityFeedQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
