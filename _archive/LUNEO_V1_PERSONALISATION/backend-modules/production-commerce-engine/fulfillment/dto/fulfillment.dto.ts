import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { FulfillmentStatus } from '@prisma/client';

export class CreateFulfillmentDto {
  @ApiProperty({ description: 'Pipeline ID' })
  @IsString()
  pipelineId!: string;
}

export class ListFulfillmentsQueryDto {
  @ApiPropertyOptional({ enum: FulfillmentStatus })
  @IsOptional()
  @IsEnum(FulfillmentStatus)
  status?: FulfillmentStatus;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

export class UpdateFulfillmentStatusDto {
  @ApiProperty({ enum: FulfillmentStatus })
  @IsEnum(FulfillmentStatus)
  status!: FulfillmentStatus;
}

export class ShipFulfillmentDto {
  @ApiProperty({ description: 'Carrier code' })
  @IsString()
  carrier!: string;

  @ApiProperty({ description: 'Tracking number' })
  @IsString()
  trackingNumber!: string;

  @ApiPropertyOptional({ description: 'Tracking URL' })
  @IsOptional()
  @IsString()
  trackingUrl?: string;

  @ApiPropertyOptional({ description: 'Weight in kg' })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ description: 'Packages metadata' })
  @IsOptional()
  @IsObject()
  packages?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Estimated delivery date (ISO)' })
  @IsOptional()
  @IsString()
  estimatedDelivery?: string;
}
