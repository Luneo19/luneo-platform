import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Canvas object from design data (objects array or nested in zones) */
export interface CanvasObjectLike {
  type?: string;
  zoneId?: string;
  fill?: string;
  text?: string;
  src?: string;
  objects?: CanvasObjectLike[];
  [key: string]: unknown;
}

/** Canvas data shape for pricing calculation */
export interface CanvasDataForPricing {
  objects?: CanvasObjectLike[];
  zones?: Array<{ id: string; name?: string; objects?: CanvasObjectLike[] }>;
  [key: string]: unknown;
}

export interface ZonePriceItem {
  zoneId: string;
  zoneName: string;
  elements: number;
  price: number;
}

export interface DesignPriceBreakdown {
  basePrice: number;
  zoneSubtotal: number;
  elementSubtotal: number;
  colorSurcharge: number;
  discountAmount: number;
  totalBeforeDiscount: number;
}

export interface DesignPriceResult {
  basePrice: number;
  zonePrices: ZonePriceItem[];
  totalElementPrice: number;
  discounts: { percentage: number; amount: number; reason?: string };
  totalPrice: number;
  currency: string;
  breakdown: DesignPriceBreakdown;
}

export interface ZonePricingRules {
  zoneId: string;
  zoneName: string;
  customizerId: string;
  priceModifier: number;
  customizerBasePrice: number;
  pricePerText: number;
  pricePerImage: number;
  pricePerColor: number;
  currency: string;
}

export interface UpdateZonePricingData {
  priceModifier?: number;
}

/** Volume discount tiers: [minQuantity] => discount percentage (0-100) */
const VOLUME_DISCOUNT_TIERS: Array<{ minQuantity: number; discountPercent: number }> = [
  { minQuantity: 100, discountPercent: 15 },
  { minQuantity: 50, discountPercent: 10 },
  { minQuantity: 20, discountPercent: 5 },
  { minQuantity: 10, discountPercent: 3 },
  { minQuantity: 1, discountPercent: 0 },
];

// -----------------------------------------------------------------------------
// Service
// -----------------------------------------------------------------------------

@Injectable()
export class ZonePricingService {
  private readonly logger = new Logger(ZonePricingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates total design price from customizer config, zone modifiers, and canvas data.
   */
  async calculateDesignPrice(
    customizerId: string,
    canvasData: CanvasDataForPricing,
    quantity = 1,
  ): Promise<DesignPriceResult> {
    const customizer = await this.prisma.visualCustomizer.findUnique({
      where: { id: customizerId },
      select: {
        id: true,
        pricingEnabled: true,
        basePrice: true,
        currency: true,
        pricePerText: true,
        pricePerImage: true,
        pricePerColor: true,
        zones: {
          select: { id: true, name: true, priceModifier: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!customizer) {
      throw new NotFoundException(
        `Visual customizer with ID ${customizerId} not found`,
      );
    }

    if (!customizer.pricingEnabled) {
      return this.zeroPriceResult(customizer.currency);
    }

    const basePrice = Number(customizer.basePrice) ?? 0;
    const pricePerText = Number(customizer.pricePerText) ?? 0;
    const pricePerImage = Number(customizer.pricePerImage) ?? 0;
    const pricePerColor = Number(customizer.pricePerColor) ?? 0;

    const { zonePrices, totalElementPrice, colorSurcharge } =
      this.computeZoneAndElementPrices(
        canvasData,
        customizer.zones,
        pricePerText,
        pricePerImage,
        pricePerColor,
      );

    const totalBeforeDiscount = basePrice + totalElementPrice + colorSurcharge;
    const discountPct = this.calculateVolumeDiscount(quantity, totalBeforeDiscount);
    const discountAmount = (totalBeforeDiscount * discountPct) / 100;
    const totalPrice = Math.max(0, totalBeforeDiscount - discountAmount);

    const breakdown: DesignPriceBreakdown = {
      basePrice,
      zoneSubtotal: zonePrices.reduce((s, z) => s + z.price, 0),
      elementSubtotal: totalElementPrice,
      colorSurcharge,
      discountAmount,
      totalBeforeDiscount,
    };

    return {
      basePrice,
      zonePrices,
      totalElementPrice,
      discounts: {
        percentage: discountPct,
        amount: discountAmount,
        reason:
          discountPct > 0 ? `Volume discount (${quantity} unit(s))` : undefined,
      },
      totalPrice,
      currency: customizer.currency,
      breakdown,
    };
  }

  /**
   * Returns pricing rules for a zone (customizer defaults + zone modifier).
   */
  async getZonePricing(zoneId: string): Promise<ZonePricingRules> {
    const zone = await this.prisma.customizerZone.findUnique({
      where: { id: zoneId },
      include: {
        customizer: {
          select: {
            id: true,
            basePrice: true,
            currency: true,
            pricePerText: true,
            pricePerImage: true,
            pricePerColor: true,
          },
        },
      },
    });

    if (!zone) {
      throw new NotFoundException(`Zone with ID ${zoneId} not found`);
    }

    const c = zone.customizer;
    return {
      zoneId: zone.id,
      zoneName: zone.name,
      customizerId: c.id,
      priceModifier: Number(zone.priceModifier) ?? 0,
      customizerBasePrice: Number(c.basePrice) ?? 0,
      pricePerText: Number(c.pricePerText) ?? 0,
      pricePerImage: Number(c.pricePerImage) ?? 0,
      pricePerColor: Number(c.pricePerColor) ?? 0,
      currency: c.currency,
    };
  }

  /**
   * Updates pricing rules for a zone (e.g. priceModifier).
   */
  async updateZonePricing(
    zoneId: string,
    pricingData: UpdateZonePricingData,
  ): Promise<ZonePricingRules> {
    const zone = await this.prisma.customizerZone.findUnique({
      where: { id: zoneId },
      select: { id: true, customizerId: true },
    });

    if (!zone) {
      throw new NotFoundException(`Zone with ID ${zoneId} not found`);
    }

    if (
      pricingData.priceModifier !== undefined &&
      (typeof pricingData.priceModifier !== 'number' ||
        pricingData.priceModifier < 0)
    ) {
      throw new BadRequestException(
        'priceModifier must be a non-negative number',
      );
    }

    const updated = await this.prisma.customizerZone.update({
      where: { id: zoneId },
      data: {
        ...(pricingData.priceModifier !== undefined && {
          priceModifier: pricingData.priceModifier,
        }),
      },
      include: {
        customizer: {
          select: {
            id: true,
            basePrice: true,
            currency: true,
            pricePerText: true,
            pricePerImage: true,
            pricePerColor: true,
          },
        },
      },
    });

    const c = updated.customizer;
    this.logger.log(`Zone pricing updated: ${zoneId}`);

    return {
      zoneId: updated.id,
      zoneName: updated.name,
      customizerId: c.id,
      priceModifier: Number(updated.priceModifier) ?? 0,
      customizerBasePrice: Number(c.basePrice) ?? 0,
      pricePerText: Number(c.pricePerText) ?? 0,
      pricePerImage: Number(c.pricePerImage) ?? 0,
      pricePerColor: Number(c.pricePerColor) ?? 0,
      currency: c.currency,
    };
  }

  /**
   * Returns volume discount percentage (0–100) for a given quantity and base price.
   */
  calculateVolumeDiscount(quantity: number, basePrice: number): number {
    if (quantity < 1 || basePrice <= 0) return 0;
    const tier = VOLUME_DISCOUNT_TIERS.find((t) => quantity >= t.minQuantity);
    return tier?.discountPercent ?? 0;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private zeroPriceResult(currency: string): DesignPriceResult {
    const breakdown: DesignPriceBreakdown = {
      basePrice: 0,
      zoneSubtotal: 0,
      elementSubtotal: 0,
      colorSurcharge: 0,
      discountAmount: 0,
      totalBeforeDiscount: 0,
    };
    return {
      basePrice: 0,
      zonePrices: [],
      totalElementPrice: 0,
      discounts: { percentage: 0, amount: 0 },
      totalPrice: 0,
      currency,
      breakdown,
    };
  }

  private collectObjectsFromCanvas(data: CanvasDataForPricing): CanvasObjectLike[] {
    const out: CanvasObjectLike[] = [];
    if (Array.isArray(data.objects)) {
      this.flattenObjects(data.objects, out);
    }
    if (Array.isArray(data.zones)) {
      for (const z of data.zones) {
        if (Array.isArray(z.objects)) {
          const withZone = z.objects.map((o) => ({
            ...o,
            zoneId: o.zoneId ?? z.id,
          }));
          this.flattenObjects(withZone, out);
        }
      }
    }
    return out;
  }

  private flattenObjects(
    objects: CanvasObjectLike[],
    acc: CanvasObjectLike[],
  ): void {
    for (const obj of objects) {
      if (!obj || typeof obj !== 'object') continue;
      acc.push(obj);
      if (Array.isArray(obj.objects)) {
        this.flattenObjects(obj.objects, acc);
      }
    }
  }

  private countColors(objects: CanvasObjectLike[]): number {
    const colors = new Set<string>();
    for (const obj of objects) {
      const fill = obj.fill ?? obj.color;
      if (typeof fill === 'string' && /^#([0-9A-Fa-f]{3}){1,2}$/.test(fill)) {
        colors.add(fill.toLowerCase());
      }
    }
    return colors.size;
  }

  private countByType(
    objects: CanvasObjectLike[],
  ): { text: number; image: number; clipart: number } {
    let text = 0;
    let image = 0;
    let clipart = 0;
    for (const obj of objects) {
      const t = (obj.type ?? '').toLowerCase();
      if (t === 'text') text++;
      else if (t === 'image') image++;
      else if (t === 'clipart') clipart++;
    }
    return { text, image, clipart };
  }

  private computeZoneAndElementPrices(
    canvasData: CanvasDataForPricing,
    zones: Array<{ id: string; name: string; priceModifier: number }>,
    pricePerText: number,
    pricePerImage: number,
    pricePerColor: number,
  ): {
    zonePrices: ZonePriceItem[];
    totalElementPrice: number;
    colorSurcharge: number;
  } {
    const allObjects = this.collectObjectsFromCanvas(canvasData);
    const zoneMap = new Map(
      zones.map((z) => [z.id, { ...z, objects: [] as CanvasObjectLike[] }]),
    );

    // Assign objects to zones (by zoneId or first zone as default)
    const defaultZoneId = zones[0]?.id;
    for (const obj of allObjects) {
      const zoneId = (obj.zoneId as string) ?? defaultZoneId;
      if (zoneId && zoneMap.has(zoneId)) {
        zoneMap.get(zoneId)!.objects.push(obj);
      } else if (defaultZoneId) {
        zoneMap.get(defaultZoneId)!.objects.push(obj);
      }
    }

    const zonePrices: ZonePriceItem[] = [];
    let totalElementPrice = 0;
    let totalColorCount = 0;

    for (const z of zones) {
      const entry = zoneMap.get(z.id);
      const objects = entry?.objects ?? [];
      const modifier = 1 + (Number(z.priceModifier) ?? 0) / 100;
      const { text, image, clipart } = this.countByType(objects);
      const elementCount = text + image + clipart;
      const elementPrice =
        (text * pricePerText + (image + clipart) * pricePerImage) * modifier;
      const colorsInZone = this.countColors(objects);
      totalColorCount += colorsInZone;

      zonePrices.push({
        zoneId: z.id,
        zoneName: z.name,
        elements: elementCount,
        price: Math.round(elementPrice * 100) / 100,
      });
      totalElementPrice += elementPrice;
    }

    const colorSurcharge = totalColorCount * pricePerColor;

    return {
      zonePrices,
      totalElementPrice: Math.round(totalElementPrice * 100) / 100,
      colorSurcharge: Math.round(colorSurcharge * 100) / 100,
    };
  }
}
