import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SmartCropDto {
  @ApiProperty({ description: 'URL of the image to smart crop' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({
    description: 'Target aspect ratio for the crop',
    enum: ['1:1', '16:9', '9:16', '4:3'],
  })
  @IsOptional()
  @IsEnum(['1:1', '16:9', '9:16', '4:3'])
  targetAspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';

  @ApiPropertyOptional({
    description: 'Focus point for the crop',
    enum: ['auto', 'face', 'center', 'product'],
  })
  @IsOptional()
  @IsEnum(['auto', 'face', 'center', 'product'])
  focusPoint?: 'auto' | 'face' | 'center' | 'product';
}
