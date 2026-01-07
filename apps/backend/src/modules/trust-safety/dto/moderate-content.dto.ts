import { IsString, IsEnum, IsOptional, IsUrl, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ModerateContentDto {
  @ApiProperty({ description: 'Content type', enum: ['text', 'image', 'ai_generation'] })
  @IsEnum(['text', 'image', 'ai_generation'])
  type: 'text' | 'image' | 'ai_generation';

  @ApiPropertyOptional({ description: 'Text content (for text type)' })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiPropertyOptional({ description: 'Image URL (for image/ai_generation type)' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'User ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Brand ID' })
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Additional context' })
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}
































