import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationStatus } from '@prisma/client';

export class UpdateConversationDto {
  @ApiPropertyOptional({ description: 'Statut de la conversation', enum: ConversationStatus })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @ApiPropertyOptional({ description: 'ID de l\'agent assigné' })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional({ description: 'Résumé de la conversation' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: 'Sentiment détecté' })
  @IsOptional()
  @IsString()
  sentiment?: string;

  @ApiPropertyOptional({ description: 'Note de satisfaction (1-5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  satisfactionRating?: number;

  @ApiPropertyOptional({ description: 'Tags associés', type: [String] })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
