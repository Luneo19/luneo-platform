/**
 * ★★★ DTO - GENERATE ANIMATION ★★★
 * DTO pour la génération d'une animation AI
 * Respecte la Bible Luneo : validation Zod, types explicites
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';

export class GenerateAnimationDto {
  @ApiProperty({ description: 'Animation prompt', example: 'A beautiful sunset over mountains' })
  @IsString()
  prompt: string;

  @ApiProperty({ description: 'Style', example: 'photorealistic', required: false })
  @IsString()
  @IsOptional()
  style?: string;

  @ApiProperty({ description: 'Duration in seconds', example: 5, default: 5, minimum: 1, maximum: 30 })
  @IsNumber()
  @Min(1)
  @Max(30)
  @IsOptional()
  duration?: number;

  @ApiProperty({ description: 'Frames per second', example: 30, default: 30, minimum: 24, maximum: 60 })
  @IsNumber()
  @Min(24)
  @Max(60)
  @IsOptional()
  fps?: number;

  @ApiProperty({ description: 'Resolution', enum: ['720p', '1080p', '4k'], example: '1080p', default: '1080p' })
  @IsEnum(['720p', '1080p', '4k'])
  @IsOptional()
  resolution?: '720p' | '1080p' | '4k';
}



