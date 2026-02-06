import { IsString, IsOptional, IsUrl, IsEmail, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBrandDto {
  @ApiProperty({ description: 'Nom de la marque', example: 'Ma Marque' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Description de la marque' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'URL du logo' })
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiPropertyOptional({ description: 'URL du site web' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Email de contact' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}

export class UpdateBrandDto {
  @ApiPropertyOptional({ description: 'Nom de la marque' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Description de la marque' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'URL du logo' })
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiPropertyOptional({ description: 'URL du site web' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Email de contact' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}

export class AddWebhookDto {
  @ApiProperty({ description: 'URL du webhook', example: 'https://example.com/webhook' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ description: 'Événements à écouter', example: ['order.created', 'design.completed'] })
  @IsOptional()
  @IsString({ each: true })
  events?: string[];

  @ApiPropertyOptional({ description: 'Secret pour la signature' })
  @IsOptional()
  @IsString()
  secret?: string;
}
