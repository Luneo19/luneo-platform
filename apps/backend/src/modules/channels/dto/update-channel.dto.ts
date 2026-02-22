import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelStatus } from '@prisma/client';

export class UpdateChannelDto {
  @ApiPropertyOptional({ description: 'Statut du canal', enum: ChannelStatus })
  @IsOptional()
  @IsEnum(ChannelStatus)
  status?: ChannelStatus;

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
