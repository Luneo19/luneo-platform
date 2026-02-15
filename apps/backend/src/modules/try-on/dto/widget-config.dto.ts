import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsArray,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWidgetConfigDto {
  @ApiPropertyOptional({ description: 'Widget theme (primaryColor, secondaryColor, fontFamily, borderRadius)' })
  @IsOptional()
  @IsObject()
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    borderRadius?: string;
  };

  @ApiPropertyOptional({ description: 'Brand logo URL for widget header' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ description: 'CTA button text' })
  @IsOptional()
  @IsString()
  ctaText?: string;

  @ApiPropertyOptional({
    description: 'CTA action type',
    enum: ['postMessage', 'redirect', 'callback'],
  })
  @IsOptional()
  @IsIn(['postMessage', 'redirect', 'callback'])
  ctaAction?: string;

  @ApiPropertyOptional({ description: 'CTA redirect URL (if ctaAction = redirect)' })
  @IsOptional()
  @IsString()
  ctaUrl?: string;

  @ApiPropertyOptional({ description: 'Show "Powered by Luneo" (premium can hide)' })
  @IsOptional()
  @IsBoolean()
  showPoweredBy?: boolean;

  @ApiPropertyOptional({ description: 'Custom CSS override (premium only)' })
  @IsOptional()
  @IsString()
  customCss?: string;

  @ApiPropertyOptional({ description: 'Authorized domains for iframe embedding' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];

  @ApiPropertyOptional({ description: 'Widget locale (fr, en, de, it, etc.)' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ description: 'Custom translation overrides' })
  @IsOptional()
  @IsObject()
  translations?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Enable analytics tracking in widget' })
  @IsOptional()
  @IsBoolean()
  analyticsEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Show product recommendations in widget' })
  @IsOptional()
  @IsBoolean()
  showRecommendations?: boolean;

  @ApiPropertyOptional({ description: 'Show social share buttons in widget' })
  @IsOptional()
  @IsBoolean()
  showSocialShare?: boolean;
}
