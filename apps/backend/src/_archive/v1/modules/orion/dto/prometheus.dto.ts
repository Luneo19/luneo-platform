// @ts-nocheck
import {
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  IsArray,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AIResponseStatus } from '@prisma/client';

export class ReviewQueueQueryDto {
  @ApiPropertyOptional({ enum: AIResponseStatus })
  @IsOptional()
  @IsString()
  status?: AIResponseStatus;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  minConfidence?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  maxConfidence?: number;

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

export class ApproveResponseDto {
  @ApiPropertyOptional({ description: 'Review notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Edited content to override AI response' })
  @IsOptional()
  @IsString()
  editedContent?: string;
}

export class RejectResponseDto {
  @ApiPropertyOptional({ description: 'Rejection notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkApproveDto {
  @ApiProperty({ description: 'Response IDs to approve', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  responseIds: string[];
}

export class SubmitFeedbackDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}
