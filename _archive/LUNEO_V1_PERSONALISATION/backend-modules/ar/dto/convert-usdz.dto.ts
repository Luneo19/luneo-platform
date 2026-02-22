import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional, IsNumber, IsBoolean } from 'class-validator';

/** Note: snake_case properties maintained for API backwards compatibility */
export class ConvertUsdzDto {
  @ApiProperty({ description: 'GLB model URL to convert to USDZ', example: 'https://example.com/model.glb' })
  @IsString()
  @IsUrl()
  glb_url: string;

  @ApiPropertyOptional({ description: 'AR model ID to associate' })
  @IsOptional()
  @IsString()
  ar_model_id?: string;

  @ApiPropertyOptional({ description: 'Product name for the model' })
  @IsOptional()
  @IsString()
  product_name?: string;

  @ApiPropertyOptional({ description: 'Scale factor', default: 1 })
  @IsOptional()
  @IsNumber()
  scale?: number;

  @ApiPropertyOptional({ description: 'Optimize output', default: false })
  @IsOptional()
  @IsBoolean()
  optimize?: boolean;
}
