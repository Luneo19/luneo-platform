import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateImageDto {
  @ApiProperty({ description: 'Prompt for DALL-E 3 image generation' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({
    description: 'Image size',
    enum: ['1024x1024', '1792x1024', '1024x1792'],
  })
  @IsOptional()
  @IsEnum(['1024x1024', '1792x1024', '1024x1792'])
  size?: '1024x1024' | '1792x1024' | '1024x1792';

  @ApiPropertyOptional({
    description: 'Image quality',
    enum: ['standard', 'hd'],
  })
  @IsOptional()
  @IsEnum(['standard', 'hd'])
  quality?: 'standard' | 'hd';

  @ApiPropertyOptional({
    description: 'Image style',
    enum: ['vivid', 'natural'],
  })
  @IsOptional()
  @IsEnum(['vivid', 'natural'])
  style?: 'vivid' | 'natural';
}
