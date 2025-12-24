import { IsString, IsOptional, IsInt, Min, IsEnum, IsArray, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoutingCriteriaDto {
  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: 'Material' })
  @IsString()
  @IsOptional()
  material?: string;

  @ApiPropertyOptional({ description: 'Technique' })
  @IsString()
  @IsOptional()
  technique?: string;

  @ApiPropertyOptional({ description: 'Quantity' })
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional({ description: 'Urgency level', enum: ['standard', 'express', 'rush'] })
  @IsEnum(['standard', 'express', 'rush'])
  @IsOptional()
  urgency?: 'standard' | 'express' | 'rush';

  @ApiPropertyOptional({ description: 'Maximum price in cents' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum lead time in days' })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxLeadTime?: number;

  @ApiPropertyOptional({ description: 'Preferred zones', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredZones?: string[];
}

export class RouteOrderDto {
  @ApiProperty({ description: 'Artisan ID' })
  @IsString()
  @IsNotEmpty()
  artisanId: string;

  @ApiProperty({ description: 'Quote details' })
  quote: {
    priceCents: number;
    leadTime: number;
    breakdown?: any;
  };
}




















