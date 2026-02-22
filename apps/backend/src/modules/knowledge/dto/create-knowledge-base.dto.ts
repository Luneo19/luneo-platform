import { IsString, IsOptional, MaxLength, MinLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateKnowledgeBaseDto {
  @ApiProperty({ description: 'Nom de la base de connaissances', example: 'FAQ Produits' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Base contenant la FAQ produits' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Langue', example: 'fr', default: 'fr' })
  @IsOptional()
  @IsString()
  @IsIn(['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'ar', 'zh', 'ja', 'ko'])
  language?: string;

  @ApiPropertyOptional({
    description: 'Stratégie de chunking',
    example: 'semantic',
    default: 'semantic',
  })
  @IsOptional()
  @IsString()
  @IsIn(['semantic', 'fixed', 'paragraph', 'sentence'])
  chunkingStrategy?: string;
}
