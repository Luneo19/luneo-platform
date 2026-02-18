import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsObject } from 'class-validator';

export class CreateProductARConfigDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  primaryModelId: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  defaultScale?: number;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  defaultRotation?: { x: number; y: number; z: number };

  @ApiProperty({ enum: ['GROUND_PLANE', 'TABLE_TOP', 'WALL', 'WRIST', 'FACE'], required: false })
  @IsString()
  @IsOptional()
  placementMode?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  showPriceInAR?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  showBuyButton?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  showVariantPicker?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  overlayPosition?: string;

  @ApiProperty({ enum: ['WORLD', 'IMAGE', 'BODY', 'FACE'], required: false })
  @IsString()
  @IsOptional()
  trackingType?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  imageTargetId?: string;
}

export class UpdateProductARConfigDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  primaryModelId?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  defaultScale?: number;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  defaultRotation?: { x: number; y: number; z: number };

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  placementMode?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  showPriceInAR?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  showBuyButton?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  showVariantPicker?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  overlayPosition?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  trackingType?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  imageTargetId?: string | null;
}

export class MapVariantDto {
  @ApiProperty({ example: 'color:gold' })
  @IsString()
  variantKey: string;

  @ApiProperty()
  @IsString()
  modelId: string;
}

export class AddToCartFromARDto {
  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  variantId?: string | null;

  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @IsOptional()
  quantity?: number;
}

export class ListConfigsQueryDto {
  @ApiProperty()
  @IsString()
  brandId: string;
}
