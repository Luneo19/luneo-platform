import { IsString, IsOptional, IsEnum, IsUrl, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KBSourceType } from '@prisma/client';

export class CreateKnowledgeSourceDto {
  @ApiProperty({ description: 'Nom de la source', example: 'Documentation technique' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: 'Type de source', enum: KBSourceType, example: 'FILE' })
  @IsEnum(KBSourceType)
  type: KBSourceType;

  @ApiPropertyOptional({ description: 'URL du fichier uploadé' })
  @IsOptional()
  @IsUrl()
  fileUrl?: string;

  @ApiPropertyOptional({ description: 'URL du site web à crawler', example: 'https://docs.example.com' })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiPropertyOptional({ description: 'Contenu texte brut' })
  @IsOptional()
  @IsString()
  @MaxLength(100_000)
  textContent?: string;
}
