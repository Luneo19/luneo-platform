import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsObject,
  IsEnum,
  Min,
} from 'class-validator';
import { ReturnStatus } from '@prisma/client';

export class CreateReturnDto {
  @ApiProperty({ description: 'Order ID' })
  @IsString()
  orderId!: string;

  @ApiPropertyOptional({ description: 'Fulfillment ID' })
  @IsOptional()
  @IsString()
  fulfillmentId?: string;

  @ApiProperty({ description: 'Return reason' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ description: 'Reason details' })
  @IsOptional()
  @IsString()
  reasonDetails?: string;

  @ApiProperty({ description: 'Items to return (array of item refs)' })
  @IsArray()
  items!: unknown[];

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ProcessReturnDto {
  @ApiProperty({ enum: ReturnStatus, description: 'Action / target status' })
  @IsEnum(ReturnStatus)
  action!: ReturnStatus;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProcessRefundDto {
  @ApiProperty({ description: 'Refund amount in cents' })
  @IsNumber()
  @Min(0)
  refundAmountCents!: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ListReturnsQueryDto {
  @ApiPropertyOptional({ enum: ReturnStatus })
  @IsOptional()
  @IsEnum(ReturnStatus)
  status?: ReturnStatus;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}
