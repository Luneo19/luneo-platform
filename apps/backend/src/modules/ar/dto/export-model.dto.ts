import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsIn, IsBoolean, IsOptional } from 'class-validator';

/** Note: snake_case properties maintained for API backwards compatibility */
export class ExportModelDto {
  @ApiProperty({ description: 'AR model ID', example: 'clx123abc' })
  @IsString()
  ar_model_id: string;

  @ApiProperty({ description: 'Export format', enum: ['glb', 'usdz'] })
  @IsIn(['glb', 'usdz'])
  format: 'glb' | 'usdz';

  @ApiPropertyOptional({ description: 'Optimize output', default: false })
  @IsOptional()
  @IsBoolean()
  optimize?: boolean;

  @ApiPropertyOptional({ description: 'Include textures in export', default: true })
  @IsOptional()
  @IsBoolean()
  include_textures?: boolean;

  @ApiPropertyOptional({ description: 'Compression level', enum: ['low', 'medium', 'high'] })
  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  compression_level?: 'low' | 'medium' | 'high';
}
