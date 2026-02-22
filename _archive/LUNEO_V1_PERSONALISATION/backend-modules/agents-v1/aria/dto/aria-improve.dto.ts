import { IsString, IsNotEmpty, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AriaImproveStyle {
  ELEGANT = 'elegant',
  FUN = 'fun',
  ROMANTIC = 'romantic',
  FORMAL = 'formal',
}

/** POST /agents/aria/improve */
export class AriaImproveTextDto {
  @ApiProperty({ description: 'Text to improve', minLength: 1, maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  text: string;

  @ApiProperty({ description: 'Target style', enum: AriaImproveStyle })
  @IsEnum(AriaImproveStyle)
  style: AriaImproveStyle;

  @ApiPropertyOptional({ default: 'fr' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ description: 'Product ID (UUID)' })
  @IsString()

  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ description: 'Brand ID (UUID)' })
  @IsString()

  @IsOptional()
  brandId?: string;
}
