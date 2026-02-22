import { IsString, IsOptional, IsEnum, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelType } from '@prisma/client';

export class CreateConversationDto {
  @ApiProperty({ description: 'ID de l\'agent assigné' })
  @IsString()
  @IsNotEmpty()
  agentId: string;

  @ApiPropertyOptional({ description: 'ID du canal' })
  @IsOptional()
  @IsString()
  channelId?: string;

  @ApiPropertyOptional({ description: 'Type de canal', enum: ChannelType })
  @IsOptional()
  @IsEnum(ChannelType)
  channelType?: ChannelType;

  @ApiPropertyOptional({ description: 'ID du visiteur' })
  @IsOptional()
  @IsString()
  visitorId?: string;

  @ApiPropertyOptional({ description: 'Email du visiteur' })
  @IsOptional()
  @IsEmail()
  visitorEmail?: string;

  @ApiPropertyOptional({ description: 'Nom du visiteur' })
  @IsOptional()
  @IsString()
  visitorName?: string;

  @ApiPropertyOptional({ description: 'Langue de la conversation' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Tags associés', type: [String] })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}
