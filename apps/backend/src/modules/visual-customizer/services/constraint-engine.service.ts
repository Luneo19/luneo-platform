import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { VisualCustomizerLayerType } from '@prisma/client';
import {
  VISUAL_CUSTOMIZER_LIMITS,
  SUPPORTED_SYSTEM_FONTS,
} from '../visual-customizer.constants';

// =============================================================================
// Types
// =============================================================================

export interface ValidationError {
  zone: string;
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/** Text-specific content for TEXT layers */
export interface TextLayerContent {
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  [key: string]: unknown;
}

/** Image-specific content for IMAGE layers */
export interface ImageLayerContent {
  src?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  format?: string;
  mimeType?: string;
  [key: string]: unknown;
}

/** Generic layer data passed to validateLayerContent */
export interface LayerData {
  type: VisualCustomizerLayerType | string;
  content?: Record<string, unknown>;
  scaleX?: number;
  scaleY?: number;
  width?: number;
  height?: number;
  [key: string]: unknown;
}

/** Zone metadata constraints (stored in CustomizerZone.metadata) */
export interface ZoneMetadataConstraints {
  text?: {
    maxLength?: number;
    allowedFonts?: string[];
    allowedColors?: string[];
    allowedFontSizes?: { min?: number; max?: number };
  };
  image?: {
    maxFileSize?: number;
    allowedFormats?: string[];
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
}

/** Full constraint set returned by getZoneConstraints */
export interface ZoneConstraints {
  zoneId: string;
  zoneName: string;
  allowedTypes: {
    text: boolean;
    image: boolean;
    shape: boolean;
    clipart: boolean;
    drawing: boolean;
  };
  maxElements: number;
  minScale: number;
  maxScale: number;
  lockAspectRatio: boolean;
  allowRotation: boolean;
  text?: {
    maxLength: number;
    allowedFonts: string[];
    allowedColors: string[] | null;
    allowedFontSizes: { min: number; max: number };
  };
  image?: {
    maxFileSize: number;
    allowedFormats: string[];
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
  };
}

/** Canvas data structure for full design validation */
export interface CanvasData {
  version?: string;
  objects?: Array<{ type?: string; zoneId?: string; [key: string]: unknown }>;
  layers?: LayerData[];
  zones?: Array<{ id: string; layers?: LayerData[] }>;
  [key: string]: unknown;
}

// =============================================================================
// Service
// =============================================================================

@Injectable()
export class ConstraintEngineService {
  private readonly logger = new Logger(ConstraintEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validates that a layer respects its zone's constraints.
   * Checks allowed types, text/image constraints, element count, and scale.
   */
  async validateLayerContent(
    zoneId: string,
    layerData: LayerData,
    options?: { currentElementCount?: number },
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const zone = await this.prisma.customizerZone.findUnique({
      where: { id: zoneId },
      select: {
        id: true,
        name: true,
        allowText: true,
        allowImages: true,
        allowShapes: true,
        allowClipart: true,
        allowDrawing: true,
        maxElements: true,
        minScale: true,
        maxScale: true,
        metadata: true,
      },
    });

    if (!zone) {
      throw new NotFoundException(`Zone with ID ${zoneId} not found`);
    }

    const zoneName = zone.name;
    const meta = (zone.metadata as ZoneMetadataConstraints | null) ?? {};
    const currentCount = options?.currentElementCount ?? 0;

    // --- Allowed types ---
    const typeAllowed = this.isLayerTypeAllowed(zone, layerData.type);
    if (!typeAllowed.allowed) {
      errors.push({
        zone: zoneName,
        field: 'type',
        message: typeAllowed.message ?? `Layer type "${layerData.type}" is not allowed in this zone`,
      });
    }

    // --- Element count ---
    if (currentCount >= zone.maxElements) {
      errors.push({
        zone: zoneName,
        field: 'maxElements',
        message: `Zone allows at most ${zone.maxElements} element(s). Current count: ${currentCount}.`,
      });
    }

    // --- Scale ---
    const scaleX = typeof layerData.scaleX === 'number' ? layerData.scaleX : 1;
    const scaleY = typeof layerData.scaleY === 'number' ? layerData.scaleY : 1;
    const scale = Math.max(scaleX, scaleY);
    if (scale < zone.minScale || scale > zone.maxScale) {
      errors.push({
        zone: zoneName,
        field: 'scale',
        message: `Scale must be between ${zone.minScale} and ${zone.maxScale}. Got ${scale}.`,
      });
    }

    // --- Type-specific: TEXT ---
    if (layerData.type === VisualCustomizerLayerType.TEXT && zone.allowText) {
      const textErrors = this.validateTextContent(
        zoneName,
        layerData.content as TextLayerContent | undefined,
        meta.text,
      );
      errors.push(...textErrors);
    }

    // --- Type-specific: IMAGE ---
    if (layerData.type === VisualCustomizerLayerType.IMAGE && zone.allowImages) {
      const imageErrors = this.validateImageContent(
        zoneName,
        layerData.content as ImageLayerContent | undefined,
        meta.image,
      );
      errors.push(...imageErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Full design validation before order (all zones and layers).
   */
  async validateDesignComplete(
    customizerId: string,
    canvasData: CanvasData,
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    const customizer = await this.prisma.visualCustomizer.findUnique({
      where: { id: customizerId },
      select: { id: true },
    });

    if (!customizer) {
      throw new NotFoundException(
        `Customizer with ID ${customizerId} not found`,
      );
    }

    const zones = await this.prisma.customizerZone.findMany({
      where: { customizerId },
      select: {
        id: true,
        name: true,
        allowText: true,
        allowImages: true,
        allowShapes: true,
        allowClipart: true,
        allowDrawing: true,
        maxElements: true,
        minScale: true,
        maxScale: true,
        metadata: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    const zoneMap = new Map(zones.map((z) => [z.id, z]));

    // Normalize canvas data: support both objects[] and zones[].layers[]
    const layersByZone = this.normalizeCanvasLayersByZone(canvasData);

    for (const [zoneId, layers] of layersByZone.entries()) {
      const zone = zoneMap.get(zoneId);
      if (!zone) {
        errors.push({
          zone: zoneId,
          field: 'zoneId',
          message: `Zone "${zoneId}" does not belong to this customizer.`,
        });
        continue;
      }

      if (layers.length > zone.maxElements) {
        errors.push({
          zone: zone.name,
          field: 'maxElements',
          message: `Zone "${zone.name}" allows at most ${zone.maxElements} element(s). Found ${layers.length}.`,
        });
      }

      const meta = (zone.metadata as ZoneMetadataConstraints | null) ?? {};
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        const typeAllowed = this.isLayerTypeAllowed(zone, layer.type);
        if (!typeAllowed.allowed) {
          errors.push({
            zone: zone.name,
            field: `layers[${i}].type`,
            message:
              typeAllowed.message ??
              `Layer type "${layer.type}" is not allowed in zone "${zone.name}".`,
          });
        }

        const scaleX = typeof layer.scaleX === 'number' ? layer.scaleX : 1;
        const scaleY = typeof layer.scaleY === 'number' ? layer.scaleY : 1;
        const scale = Math.max(scaleX, scaleY);
        if (scale < zone.minScale || scale > zone.maxScale) {
          errors.push({
            zone: zone.name,
            field: `layers[${i}].scale`,
            message: `Scale must be between ${zone.minScale} and ${zone.maxScale}.`,
          });
        }

        if (
          layer.type === VisualCustomizerLayerType.TEXT &&
          zone.allowText
        ) {
          errors.push(
            ...this.validateTextContent(
              zone.name,
              layer.content as TextLayerContent | undefined,
              meta.text,
            ),
          );
        }
        if (
          layer.type === VisualCustomizerLayerType.IMAGE &&
          zone.allowImages
        ) {
          errors.push(
            ...this.validateImageContent(
              zone.name,
              layer.content as ImageLayerContent | undefined,
              meta.image,
            ),
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Returns full constraint set for a zone (for frontend consumption).
   */
  async getZoneConstraints(zoneId: string): Promise<ZoneConstraints> {
    const zone = await this.prisma.customizerZone.findUnique({
      where: { id: zoneId },
      select: {
        id: true,
        name: true,
        allowText: true,
        allowImages: true,
        allowShapes: true,
        allowClipart: true,
        allowDrawing: true,
        maxElements: true,
        minScale: true,
        maxScale: true,
        lockAspectRatio: true,
        allowRotation: true,
        metadata: true,
      },
    });

    if (!zone) {
      throw new NotFoundException(`Zone with ID ${zoneId} not found`);
    }

    const meta = (zone.metadata as ZoneMetadataConstraints | null) ?? {};

    const result: ZoneConstraints = {
      zoneId: zone.id,
      zoneName: zone.name,
      allowedTypes: {
        text: zone.allowText,
        image: zone.allowImages,
        shape: zone.allowShapes,
        clipart: zone.allowClipart,
        drawing: zone.allowDrawing,
      },
      maxElements: zone.maxElements,
      minScale: zone.minScale,
      maxScale: zone.maxScale,
      lockAspectRatio: zone.lockAspectRatio,
      allowRotation: zone.allowRotation,
    };

    result.text = {
      maxLength:
        meta.text?.maxLength ?? VISUAL_CUSTOMIZER_LIMITS.MAX_TEXT_LENGTH,
      allowedFonts:
        (meta.text?.allowedFonts?.length ?? 0) > 0
          ? (meta.text!.allowedFonts as string[])
          : [...SUPPORTED_SYSTEM_FONTS],
      allowedColors: meta.text?.allowedColors ?? null,
      allowedFontSizes: {
        min:
          meta.text?.allowedFontSizes?.min ??
          VISUAL_CUSTOMIZER_LIMITS.MIN_FONT_SIZE,
        max:
          meta.text?.allowedFontSizes?.max ??
          VISUAL_CUSTOMIZER_LIMITS.MAX_FONT_SIZE,
      },
    };

    result.image = {
      maxFileSize:
        meta.image?.maxFileSize ??
        VISUAL_CUSTOMIZER_LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024,
      allowedFormats:
        (meta.image?.allowedFormats?.length ?? 0) > 0
          ? (meta.image!.allowedFormats as string[])
          : [...VISUAL_CUSTOMIZER_LIMITS.ALLOWED_IMAGE_TYPES],
      minWidth:
        meta.image?.minWidth ??
        VISUAL_CUSTOMIZER_LIMITS.MIN_IMAGE_DIMENSIONS.width,
      minHeight:
        meta.image?.minHeight ??
        VISUAL_CUSTOMIZER_LIMITS.MIN_IMAGE_DIMENSIONS.height,
      maxWidth:
        meta.image?.maxWidth ??
        VISUAL_CUSTOMIZER_LIMITS.MAX_IMAGE_DIMENSIONS.width,
      maxHeight:
        meta.image?.maxHeight ??
        VISUAL_CUSTOMIZER_LIMITS.MAX_IMAGE_DIMENSIONS.height,
    };

    return result;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private isLayerTypeAllowed(
    zone: {
      allowText: boolean;
      allowImages: boolean;
      allowShapes: boolean;
      allowClipart: boolean;
      allowDrawing: boolean;
    },
    type: string,
  ): { allowed: boolean; message?: string } {
    const upper = String(type).toUpperCase();
    switch (upper) {
      case 'TEXT':
        return zone.allowText
          ? { allowed: true }
          : { allowed: false, message: 'Text is not allowed in this zone.' };
      case 'IMAGE':
        return zone.allowImages
          ? { allowed: true }
          : { allowed: false, message: 'Images are not allowed in this zone.' };
      case 'SHAPE':
        return zone.allowShapes
          ? { allowed: true }
          : { allowed: false, message: 'Shapes are not allowed in this zone.' };
      case 'CLIPART':
        return zone.allowClipart
          ? { allowed: true }
          : { allowed: false, message: 'Clipart is not allowed in this zone.' };
      case 'DRAWING':
        return zone.allowDrawing
          ? { allowed: true }
          : { allowed: false, message: 'Drawing is not allowed in this zone.' };
      case 'PATTERN':
      case 'QR_CODE':
      case 'GROUP':
        return { allowed: true };
      default:
        return {
          allowed: false,
          message: `Unknown or disallowed layer type: ${type}.`,
        };
    }
  }

  private validateTextContent(
    zoneName: string,
    content: TextLayerContent | undefined,
    textMeta: ZoneMetadataConstraints['text'],
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const maxLength =
      textMeta?.maxLength ?? VISUAL_CUSTOMIZER_LIMITS.MAX_TEXT_LENGTH;
    const allowedFonts =
      textMeta?.allowedFonts && textMeta.allowedFonts.length > 0
        ? textMeta.allowedFonts
        : [...SUPPORTED_SYSTEM_FONTS];
    const allowedColors = textMeta?.allowedColors;
    const minFontSize =
      textMeta?.allowedFontSizes?.min ?? VISUAL_CUSTOMIZER_LIMITS.MIN_FONT_SIZE;
    const maxFontSize =
      textMeta?.allowedFontSizes?.max ?? VISUAL_CUSTOMIZER_LIMITS.MAX_FONT_SIZE;

    const text = content?.text;
    if (typeof text === 'string' && text.length > maxLength) {
      errors.push({
        zone: zoneName,
        field: 'content.text',
        message: `Text length must not exceed ${maxLength} characters.`,
      });
    }

    const fontFamily = content?.fontFamily;
    if (fontFamily != null && typeof fontFamily === 'string') {
      const normalized = fontFamily.trim();
      if (normalized && !allowedFonts.some((f) => f.toLowerCase() === normalized.toLowerCase())) {
        errors.push({
          zone: zoneName,
          field: 'content.fontFamily',
          message: `Font "${fontFamily}" is not allowed. Allowed: ${allowedFonts.join(', ')}.`,
        });
      }
    }

    const fontSize = content?.fontSize;
    if (typeof fontSize === 'number' && (fontSize < minFontSize || fontSize > maxFontSize)) {
      errors.push({
        zone: zoneName,
        field: 'content.fontSize',
        message: `Font size must be between ${minFontSize} and ${maxFontSize}.`,
      });
    }

    const fill = content?.fill;
    if (allowedColors != null && allowedColors.length > 0 && fill != null && typeof fill === 'string') {
      const normalizedFill = fill.toLowerCase();
      const allowedLower = allowedColors.map((c) => c.toLowerCase());
      if (!allowedLower.includes(normalizedFill)) {
        errors.push({
          zone: zoneName,
          field: 'content.fill',
          message: 'Text color is not in the allowed list.',
        });
      }
    }

    return errors;
  }

  private validateImageContent(
    zoneName: string,
    content: ImageLayerContent | undefined,
    imageMeta: ZoneMetadataConstraints['image'],
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const maxFileSize =
      imageMeta?.maxFileSize ??
      VISUAL_CUSTOMIZER_LIMITS.MAX_IMAGE_SIZE_MB * 1024 * 1024;
    const allowedFormats =
      imageMeta?.allowedFormats && imageMeta.allowedFormats.length > 0
        ? imageMeta.allowedFormats
        : [...VISUAL_CUSTOMIZER_LIMITS.ALLOWED_IMAGE_TYPES];
    const minWidth =
      imageMeta?.minWidth ?? VISUAL_CUSTOMIZER_LIMITS.MIN_IMAGE_DIMENSIONS.width;
    const minHeight =
      imageMeta?.minHeight ??
      VISUAL_CUSTOMIZER_LIMITS.MIN_IMAGE_DIMENSIONS.height;
    const maxWidth =
      imageMeta?.maxWidth ?? VISUAL_CUSTOMIZER_LIMITS.MAX_IMAGE_DIMENSIONS.width;
    const maxHeight =
      imageMeta?.maxHeight ??
      VISUAL_CUSTOMIZER_LIMITS.MAX_IMAGE_DIMENSIONS.height;

    const fileSize = content?.fileSize;
    if (typeof fileSize === 'number' && fileSize > maxFileSize) {
      errors.push({
        zone: zoneName,
        field: 'content.fileSize',
        message: `Image file size must not exceed ${Math.round(maxFileSize / 1024 / 1024)}MB.`,
      });
    }

    const format = content?.format ?? content?.mimeType;
    if (format != null && typeof format === 'string') {
      const normalized = format.toLowerCase().trim();
      const allowedLower = allowedFormats.map((f) => f.toLowerCase());
      if (!allowedLower.some((f) => normalized.includes(f) || f.includes(normalized))) {
        errors.push({
          zone: zoneName,
          field: 'content.format',
          message: `Image format "${format}" is not allowed. Allowed: ${allowedFormats.join(', ')}.`,
        });
      }
    }

    const width = content?.width;
    const height = content?.height;
    if (typeof width === 'number' && (width < minWidth || width > maxWidth)) {
      errors.push({
        zone: zoneName,
        field: 'content.width',
        message: `Image width must be between ${minWidth} and ${maxWidth}px.`,
      });
    }
    if (typeof height === 'number' && (height < minHeight || height > maxHeight)) {
      errors.push({
        zone: zoneName,
        field: 'content.height',
        message: `Image height must be between ${minHeight} and ${maxHeight}px.`,
      });
    }

    return errors;
  }

  private normalizeCanvasLayersByZone(
    canvasData: CanvasData,
  ): Map<string, LayerData[]> {
    const map = new Map<string, LayerData[]>();

    if (canvasData.zones && Array.isArray(canvasData.zones)) {
      for (const z of canvasData.zones) {
        const zoneId = z.id;
        if (!zoneId) continue;
        const layers = Array.isArray(z.layers) ? z.layers : [];
        map.set(zoneId, layers);
      }
    }

    if (canvasData.objects && Array.isArray(canvasData.objects)) {
      for (const obj of canvasData.objects) {
        const zoneId = obj.zoneId as string | undefined;
        if (!zoneId) continue;
        const layer: LayerData = {
          type: (obj.type as string) ?? 'UNKNOWN',
          content: obj as Record<string, unknown>,
          scaleX: obj.scaleX as number | undefined,
          scaleY: obj.scaleY as number | undefined,
          width: obj.width as number | undefined,
          height: obj.height as number | undefined,
          ...obj,
        };
        const existing = map.get(zoneId) ?? [];
        existing.push(layer);
        map.set(zoneId, existing);
      }
    }

    if (canvasData.layers && Array.isArray(canvasData.layers)) {
      const defaultZone = canvasData.zones?.[0]?.id;
      if (defaultZone) {
        const existing = map.get(defaultZone) ?? [];
        existing.push(...canvasData.layers);
        map.set(defaultZone, existing);
      }
    }

    return map;
  }
}
