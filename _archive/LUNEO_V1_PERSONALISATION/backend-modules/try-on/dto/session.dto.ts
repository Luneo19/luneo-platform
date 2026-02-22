import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  IsBoolean,
  IsIn,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartSessionDto {
  @ApiProperty({ description: 'ID de la configuration try-on' })
  @IsString()
  configurationId: string;

  @ApiProperty({ description: 'ID unique du visiteur (généré côté client)' })
  @IsString()
  @MaxLength(128)
  visitorId: string;

  @ApiPropertyOptional({ description: 'Informations sur le device (screenSize, userAgent, etc.)' })
  @IsOptional()
  @IsObject()
  deviceInfo?: Record<string, unknown>;
}

export class EndSessionDto {
  @ApiPropertyOptional({
    description: 'Action de conversion éventuelle',
    enum: ['ADD_TO_CART', 'PURCHASE', 'WISHLIST', 'SHARE', 'CLICK_THROUGH'],
  })
  @IsOptional()
  @IsIn(['ADD_TO_CART', 'PURCHASE', 'WISHLIST', 'SHARE', 'CLICK_THROUGH'])
  conversionAction?: string;

  @ApiPropertyOptional({
    description: 'Qualité de rendu utilisée durant la session',
    enum: ['high', 'medium', 'low', '2d_fallback'],
  })
  @IsOptional()
  @IsIn(['high', 'medium', 'low', '2d_fallback'])
  renderQuality?: string;
}

export class UpdateSessionDto {
  @ApiPropertyOptional({ description: 'Liste des IDs produits essayés' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productsTried?: string[];

  @ApiPropertyOptional({ description: 'Nombre de screenshots pris' })
  @IsOptional()
  screenshotsTaken?: number;

  @ApiPropertyOptional({ description: 'Session partagée' })
  @IsOptional()
  @IsBoolean()
  shared?: boolean;

  @ApiPropertyOptional({ description: 'Conversion effectuée' })
  @IsOptional()
  @IsBoolean()
  converted?: boolean;
}
