import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelType } from '@prisma/client';

export class CreateChannelDto {
  @ApiProperty({ description: 'ID de l\'agent' })
  @IsString()
  @IsNotEmpty()
  agentId: string;

  @ApiProperty({ description: 'Type de canal', enum: ChannelType })
  @IsEnum(ChannelType)
  type: ChannelType;

  @ApiPropertyOptional({ description: 'Couleur primaire du widget' })
  @IsOptional()
  @IsString()
  widgetPrimaryColor?: string;

  @ApiPropertyOptional({ description: 'Couleur secondaire du widget' })
  @IsOptional()
  @IsString()
  widgetSecondaryColor?: string;

  @ApiPropertyOptional({ description: 'Position du widget' })
  @IsOptional()
  @IsString()
  widgetPosition?: string;

  @ApiPropertyOptional({ description: 'Taille du widget' })
  @IsOptional()
  @IsString()
  widgetSize?: string;

  @ApiPropertyOptional({ description: 'Message de bienvenue' })
  @IsOptional()
  @IsString()
  widgetWelcomeMessage?: string;

  @ApiPropertyOptional({ description: 'Placeholder du champ de saisie' })
  @IsOptional()
  @IsString()
  widgetPlaceholder?: string;

  @ApiPropertyOptional({ description: 'URL du logo du widget' })
  @IsOptional()
  @IsString()
  widgetLogoUrl?: string;

  @ApiPropertyOptional({ description: 'Activer le widget automatiquement' })
  @IsOptional()
  @IsBoolean()
  widgetAutoOpen?: boolean;

  @ApiPropertyOptional({ description: 'Délai avant ouverture auto (ms)' })
  @IsOptional()
  widgetAutoOpenDelay?: number;
}
