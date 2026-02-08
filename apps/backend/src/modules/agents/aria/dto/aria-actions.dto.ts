import { IsString, IsNotEmpty, IsOptional, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** GET /agents/aria/quick-suggest - query params */
export class AriaQuickSuggestQueryDto {
  @ApiProperty({ description: 'Product ID (UUID)' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Occasion for suggestions' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  occasion: string;

  @ApiPropertyOptional({ default: 'fr' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ description: 'Brand ID (UUID)' })
  @IsString()
  @IsUUID()
  @IsOptional()
  brandId?: string;
}

/** POST /agents/aria/recommend-style */
export class RecommendStyleDto {
  @ApiProperty({ description: 'Text to analyze' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ description: 'Occasion' })
  @IsString()
  @IsNotEmpty()
  occasion: string;

  @ApiPropertyOptional({ description: 'Product type' })
  @IsString()
  @IsOptional()
  productType?: string;

  @ApiPropertyOptional({ description: 'Brand ID (UUID)' })
  @IsString()
  @IsUUID()
  @IsOptional()
  brandId?: string;
}

/** POST /agents/aria/translate */
export class AriaTranslateDto {
  @ApiProperty({ description: 'Text to translate' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ description: 'Target language code' })
  @IsString()
  @IsNotEmpty()
  targetLanguage: string;

  @ApiPropertyOptional({ description: 'Source language code' })
  @IsString()
  @IsOptional()
  sourceLanguage?: string;

  @ApiPropertyOptional({ description: 'Brand ID (UUID)' })
  @IsString()
  @IsUUID()
  @IsOptional()
  brandId?: string;
}

/** POST /agents/aria/spell-check */
export class AriaSpellCheckDto {
  @ApiProperty({ description: 'Text to check' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({ description: 'Language code' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ description: 'Brand ID (UUID)' })
  @IsString()
  @IsUUID()
  @IsOptional()
  brandId?: string;
}

/** POST /agents/aria/gift-ideas */
export class AriaGiftIdeasDto {
  @ApiProperty({ description: 'Occasion' })
  @IsString()
  @IsNotEmpty()
  occasion: string;

  @ApiProperty({ description: 'Recipient description' })
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @ApiPropertyOptional({ description: 'Budget' })
  @IsString()
  @IsOptional()
  budget?: string;

  @ApiPropertyOptional({ description: 'Preferences' })
  @IsString()
  @IsOptional()
  preferences?: string;

  @ApiPropertyOptional({ description: 'Brand ID (UUID)' })
  @IsString()
  @IsUUID()
  @IsOptional()
  brandId?: string;
}
