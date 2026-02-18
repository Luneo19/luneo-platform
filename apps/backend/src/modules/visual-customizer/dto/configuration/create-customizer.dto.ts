import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  IsEnum,
  IsArray,
  IsUrl,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
  ValidateNested,
  ArrayMaxSize,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sanitize } from '@/common/decorators/sanitize.decorator';
import {
  CustomizerType,
  CustomizerStatus,
  CanvasUnit,
} from '@prisma/client';

// =============================================================================
// Nested DTOs
// =============================================================================

export class CanvasSettingsDto {
  @ApiProperty({
    description: 'Canvas width',
    example: 800,
    minimum: 10,
    maximum: 10000,
  })
  @IsNumber()
  @Min(10)
  @Max(10000)
  @Type(() => Number)
  width: number;

  @ApiProperty({
    description: 'Canvas height',
    example: 1000,
    minimum: 10,
    maximum: 10000,
  })
  @IsNumber()
  @Min(10)
  @Max(10000)
  @Type(() => Number)
  height: number;

  @ApiProperty({
    description: 'Canvas unit',
    enum: CanvasUnit,
    example: CanvasUnit.PIXEL,
  })
  @IsEnum(CanvasUnit)
  unit: CanvasUnit;

  @ApiPropertyOptional({
    description: 'DPI (72-600)',
    example: 72,
    minimum: 72,
    maximum: 600,
  })
  @IsOptional()
  @IsNumber()
  @Min(72)
  @Max(600)
  @Type(() => Number)
  dpi?: number;

  @ApiPropertyOptional({
    description: 'Background color in hex format',
    example: '#ffffff',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'backgroundColor must be a valid hex color',
  })
  backgroundColor?: string;

  @ApiPropertyOptional({
    description: 'Show grid',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  showGrid?: boolean;

  @ApiPropertyOptional({
    description: 'Grid size in pixels',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  gridSize?: number;

  @ApiPropertyOptional({
    description: 'Snap to grid',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  snapToGrid?: boolean;

  @ApiPropertyOptional({
    description: 'Show rulers',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  showRulers?: boolean;

  @ApiPropertyOptional({
    description: 'Show safe zone',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  showSafeZone?: boolean;

  @ApiPropertyOptional({
    description: 'Safe zone margin in pixels',
    example: 20,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  safeZoneMargin?: number;

  @ApiPropertyOptional({
    description: 'Show bleed area',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  showBleedArea?: boolean;

  @ApiPropertyOptional({
    description: 'Bleed size in pixels',
    example: 3,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  bleedSize?: number;
}

export class PricingSettingsDto {
  @ApiPropertyOptional({
    description: 'Enable pricing',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Base price',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  basePrice?: number;

  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217, 3 letters)',
    example: 'EUR',
    pattern: '^[A-Z]{3}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, {
    message: 'currency must be a valid ISO 4217 3-letter code',
  })
  currency?: string;

  @ApiPropertyOptional({
    description: 'Price per text element',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  pricePerText?: number;

  @ApiPropertyOptional({
    description: 'Price per image',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  pricePerImage?: number;

  @ApiPropertyOptional({
    description: 'Price per color',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  pricePerColor?: number;
}

export class ModerationSettingsDto {
  @ApiPropertyOptional({
    description: 'Enable moderation',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'NSFW detection',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  nsfwDetection?: boolean;

  @ApiPropertyOptional({
    description: 'Profanity filter',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  profanityFilter?: boolean;

  @ApiPropertyOptional({
    description: 'Trademark detection',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  trademarkDetection?: boolean;

  @ApiPropertyOptional({
    description: 'Auto reject',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoReject?: boolean;

  @ApiPropertyOptional({
    description: 'Quarantine',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  quarantine?: boolean;

  @ApiPropertyOptional({
    description: 'Blocked words list',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockedWords?: string[];
}

export class UiSettingsDto {
  @ApiPropertyOptional({
    description: 'UI theme',
    enum: ['light', 'dark', 'auto'],
    example: 'light',
  })
  @IsOptional()
  @IsIn(['light', 'dark', 'auto'])
  theme?: 'light' | 'dark' | 'auto';

  @ApiPropertyOptional({
    description: 'Primary color in hex format',
    example: '#000000',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'primaryColor must be a valid hex color',
  })
  primaryColor?: string;

  @ApiPropertyOptional({
    description: 'Layout',
    enum: ['sidebar-left', 'sidebar-right'],
    example: 'sidebar-left',
  })
  @IsOptional()
  @IsIn(['sidebar-left', 'sidebar-right'])
  layout?: 'sidebar-left' | 'sidebar-right';

  @ApiPropertyOptional({
    description: 'Show toolbar',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showToolbar?: boolean;

  @ApiPropertyOptional({
    description: 'Show layers panel',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showLayersPanel?: boolean;

  @ApiPropertyOptional({
    description: 'Show properties panel',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showPropertiesPanel?: boolean;
}

// =============================================================================
// Main DTO
// =============================================================================

export class CreateCustomizerDto {
  @ApiProperty({
    description: 'Customizer name',
    example: 'T-Shirt Customizer',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Sanitize()
  name: string;

  @ApiPropertyOptional({
    description: 'Customizer description',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Associated product ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({
    description: 'Customizer type',
    enum: CustomizerType,
    example: CustomizerType.PRODUCT,
  })
  @IsEnum(CustomizerType)
  type: CustomizerType;

  @ApiPropertyOptional({
    description: 'Customizer status',
    enum: CustomizerStatus,
    example: CustomizerStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(CustomizerStatus)
  status?: CustomizerStatus;

  @ApiPropertyOptional({
    description: 'Product image URL',
    example: 'https://example.com/product.jpg',
  })
  @IsOptional()
  @IsUrl()
  productImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Product mask URL',
    example: 'https://example.com/mask.png',
  })
  @IsOptional()
  @IsUrl()
  productMaskUrl?: string;

  @ApiProperty({
    description: 'Canvas settings',
    type: CanvasSettingsDto,
  })
  @ValidateNested()
  @Type(() => CanvasSettingsDto)
  canvasSettings: CanvasSettingsDto;

  @ApiPropertyOptional({
    description: 'Tool settings (JSON)',
    example: {
      enableText: true,
      enableImageUpload: true,
      enableClipart: true,
      enableShapes: true,
      enableDrawing: false,
      enableFilters: true,
      enableQRCode: false,
      enableTemplates: true,
      enableLayers: true,
      enableHistory: true,
    },
  })
  @IsOptional()
  @IsObject()
  toolSettings?: {
    enableText?: boolean;
    enableImageUpload?: boolean;
    enableClipart?: boolean;
    enableShapes?: boolean;
    enableDrawing?: boolean;
    enableFilters?: boolean;
    enableQRCode?: boolean;
    enableTemplates?: boolean;
    enableLayers?: boolean;
    enableHistory?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Text settings (JSON)',
    example: {
      allowedFonts: ['Arial', 'Helvetica'],
      allowCustomFonts: true,
      defaultFont: 'Arial',
      minFontSize: 8,
      maxFontSize: 200,
      allowedColors: ['#000000', '#FFFFFF'],
      maxCharacters: 1000,
      enableEffects: true,
      enableCurvedText: false,
    },
  })
  @IsOptional()
  @IsObject()
  textSettings?: {
    allowedFonts?: string[];
    allowCustomFonts?: boolean;
    defaultFont?: string;
    minFontSize?: number;
    maxFontSize?: number;
    allowedColors?: string[];
    maxCharacters?: number;
    enableEffects?: boolean;
    enableCurvedText?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Image settings (JSON)',
    example: {
      maxUploadSizeMB: 10,
      allowedFormats: ['jpg', 'png', 'webp'],
      minDimensions: { width: 100, height: 100 },
      maxDimensions: { width: 5000, height: 5000 },
      autoRemoveBackground: false,
      enableFilters: true,
      enableCropping: true,
      enableMasking: true,
    },
  })
  @IsOptional()
  @IsObject()
  imageSettings?: {
    maxUploadSizeMB?: number;
    allowedFormats?: string[];
    minDimensions?: { width: number; height: number };
    maxDimensions?: { width: number; height: number };
    autoRemoveBackground?: boolean;
    enableFilters?: boolean;
    enableCropping?: boolean;
    enableMasking?: boolean;
  };

  @ApiPropertyOptional({
    description: 'Pricing settings',
    type: PricingSettingsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PricingSettingsDto)
  pricingSettings?: PricingSettingsDto;

  @ApiPropertyOptional({
    description: 'Moderation settings',
    type: ModerationSettingsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ModerationSettingsDto)
  moderationSettings?: ModerationSettingsDto;

  @ApiPropertyOptional({
    description: 'UI settings',
    type: UiSettingsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UiSettingsDto)
  uiSettings?: UiSettingsDto;

  @ApiPropertyOptional({
    description: 'Enable multi-view',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  enableMultiView?: boolean;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    type: [String],
    maxItems: 20,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @MaxLength(50, { each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
