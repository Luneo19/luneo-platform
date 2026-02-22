import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExportARDto {
  @ApiProperty({ description: '3D configuration ID' })
  @IsString()
  @IsNotEmpty()
  configurationId: string;

  @ApiProperty({
    description: 'Target platform',
    enum: ['ios', 'android', 'web'],
  })
  @IsEnum(['ios', 'android', 'web'])
  platform: 'ios' | 'android' | 'web';

  @ApiPropertyOptional({ description: 'Include textures in export' })
  @IsOptional()
  @IsBoolean()
  includeTextures?: boolean;

  @ApiPropertyOptional({ description: 'Max texture size', minimum: 256 })
  @IsOptional()
  @IsNumber()
  @Min(256)
  @Max(4096)
  maxTextureSize?: number;

  @ApiPropertyOptional({ description: 'Enable compression' })
  @IsOptional()
  @IsBoolean()
  compression?: boolean;
}
