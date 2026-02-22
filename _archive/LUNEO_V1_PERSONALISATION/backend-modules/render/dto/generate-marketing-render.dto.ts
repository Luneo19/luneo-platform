import { IsString, IsEnum, IsOptional, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateMarketingRenderDto {
  @ApiProperty({ description: 'Design ID' })
  @IsString()
  @IsNotEmpty()
  designId: string;

  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Render type', enum: ['packshot', 'lifestyle', 'turntable', 'detail'] })
  @IsEnum(['packshot', 'lifestyle', 'turntable', 'detail'])
  type: 'packshot' | 'lifestyle' | 'turntable' | 'detail';

  @ApiPropertyOptional({ description: 'Additional options' })
  @IsObject()
  @IsOptional()
  options?: Record<string, unknown>;
}

































