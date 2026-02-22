import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CustomizerZone } from '@prisma/client';

const ZONE_CONFIG_VERSIONS_KEY = 'zoneConfigVersions';
const MAX_CONFIG_VERSIONS = 50;

export interface ZoneBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface ZoneDataForOverlap {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface BoundingRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OverlapResult {
  overlaps: boolean;
  overlappingZones: string[];
}

export interface ZoneConfigVersionSnapshot {
  id: string;
  createdAt: string;
  zoneCount: number;
  zones: Prisma.JsonArray;
}

export type ZoneLike = Pick<CustomizerZone, 'x' | 'y' | 'width' | 'height'>;

@Injectable()
export class ZoneEngineService {
  private readonly logger = new Logger(ZoneEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkZoneOverlap(
    customizerId: string,
    zoneData: ZoneDataForOverlap | ZoneDataForOverlap[],
  ): Promise<OverlapResult> {
    const customizer = await this.prisma.visualCustomizer.findUnique({
      where: { id: customizerId },
      select: { id: true },
    });
    if (!customizer) {
      throw new NotFoundException(
        `Visual customizer with ID ${customizerId} not found`,
      );
    }

    const zones = await this.prisma.customizerZone.findMany({
      where: { customizerId },
      select: { id: true, x: true, y: true, width: true, height: true, rotation: true },
    });

    const candidates: ZoneDataForOverlap[] = Array.isArray(zoneData)
      ? zoneData
      : [zoneData];
    const existing = zones.map((z) => ({
      id: z.id,
      x: z.x,
      y: z.y,
      width: z.width,
      height: z.height,
      rotation: z.rotation ?? 0,
    }));

    const overlappingIds: Set<string> = new Set();
    for (const c of candidates) {
      const cBox = this.aabbFromBounds(c.x, c.y, c.width, c.height, c.rotation ?? 0);
      for (const e of existing) {
        if (c.id && e.id === c.id) continue;
        const eBox = this.aabbFromBounds(e.x, e.y, e.width, e.height, e.rotation);
        if (this.rectsOverlap(cBox, eBox)) {
          if (e.id) overlappingIds.add(e.id);
          if (c.id) overlappingIds.add(c.id);
        }
      }
      for (let i = 0; i < candidates.length; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
          const a = candidates[i];
          const b = candidates[j];
          const aBox = this.aabbFromBounds(a.x, a.y, a.width, a.height, a.rotation ?? 0);
          const bBox = this.aabbFromBounds(b.x, b.y, b.width, b.height, b.rotation ?? 0);
          if (this.rectsOverlap(aBox, bBox)) {
            if (a.id) overlappingIds.add(a.id);
            if (b.id) overlappingIds.add(b.id);
          }
        }
      }
    }

    return {
      overlaps: overlappingIds.size > 0,
      overlappingZones: Array.from(overlappingIds),
    };
  }

  calculateSafeArea(
    zone: ZoneLike,
    margin: number = 0,
  ): BoundingRect {
    const m = Math.max(0, margin);
    const halfW = zone.width / 2;
    const halfH = zone.height / 2;
    const insetW = Math.min(m, halfW);
    const insetH = Math.min(m, halfH);
    return {
      x: zone.x + insetW,
      y: zone.y + insetH,
      width: Math.max(0, zone.width - 2 * insetW),
      height: Math.max(0, zone.height - 2 * insetH),
    };
  }

  calculateBleedArea(zone: ZoneLike, bleedSize: number): BoundingRect {
    const b = Math.max(0, bleedSize);
    return {
      x: zone.x - b,
      y: zone.y - b,
      width: zone.width + 2 * b,
      height: zone.height + 2 * b,
    };
  }

  async duplicateZonesToProduct(
    sourceCustomizerId: string,
    targetCustomizerId: string,
  ): Promise<{ duplicated: number; zoneIds: string[] }> {
    if (sourceCustomizerId === targetCustomizerId) {
      throw new BadRequestException(
        'Source and target customizer must be different',
      );
    }

    const [source, target] = await Promise.all([
      this.prisma.visualCustomizer.findUnique({
        where: { id: sourceCustomizerId },
        include: { zones: { orderBy: { sortOrder: 'asc' } } },
      }),
      this.prisma.visualCustomizer.findUnique({
        where: { id: targetCustomizerId },
        select: { id: true },
      }),
    ]);

    if (!source) {
      throw new NotFoundException(
        `Visual customizer with ID ${sourceCustomizerId} not found`,
      );
    }
    if (!target) {
      throw new NotFoundException(
        `Visual customizer with ID ${targetCustomizerId} not found`,
      );
    }

    const viewIdBySourceViewId = new Map<string, string>();
    const targetViews = await this.prisma.customizerView.findMany({
      where: { customizerId: targetCustomizerId },
      select: { id: true, sortOrder: true, name: true },
      orderBy: { sortOrder: 'asc' },
    });
    const sourceViews = await this.prisma.customizerView.findMany({
      where: { customizerId: sourceCustomizerId },
      select: { id: true, sortOrder: true, name: true },
      orderBy: { sortOrder: 'asc' },
    });
    for (let i = 0; i < sourceViews.length && i < targetViews.length; i++) {
      if (sourceViews[i].name === targetViews[i].name) {
        viewIdBySourceViewId.set(sourceViews[i].id, targetViews[i].id);
      }
    }

    const zoneIds: string[] = [];
    for (let i = 0; i < source.zones.length; i++) {
      const z = source.zones[i];
      const create = await this.prisma.customizerZone.create({
        data: {
          customizerId: targetCustomizerId,
          viewId: z.viewId ? viewIdBySourceViewId.get(z.viewId) ?? null : null,
          name: z.name,
          description: z.description,
          type: z.type,
          shape: z.shape,
          x: z.x,
          y: z.y,
          width: z.width,
          height: z.height,
          rotation: z.rotation,
          polygonPoints: z.polygonPoints ?? Prisma.JsonNull,
          borderRadius: z.borderRadius,
          backgroundColor: z.backgroundColor,
          borderColor: z.borderColor,
          borderWidth: z.borderWidth,
          opacity: z.opacity,
          allowText: z.allowText,
          allowImages: z.allowImages,
          allowShapes: z.allowShapes,
          allowClipart: z.allowClipart,
          allowDrawing: z.allowDrawing,
          maxElements: z.maxElements,
          lockAspectRatio: z.lockAspectRatio,
          minScale: z.minScale,
          maxScale: z.maxScale,
          allowRotation: z.allowRotation,
          snapToBounds: z.snapToBounds,
          clipContent: z.clipContent,
          sortOrder: i,
          isVisible: z.isVisible,
          isLocked: z.isLocked,
          priceModifier: z.priceModifier,
        },
        select: { id: true },
      });
      zoneIds.push(create.id);
    }

    this.logger.log(
      `Duplicated ${zoneIds.length} zones from customizer ${sourceCustomizerId} to ${targetCustomizerId}`,
    );
    return { duplicated: zoneIds.length, zoneIds };
  }

  async createConfigVersion(customizerId: string): Promise<ZoneConfigVersionSnapshot> {
    const customizer = await this.prisma.visualCustomizer.findUnique({
      where: { id: customizerId },
      select: { id: true, metadata: true },
    });
    if (!customizer) {
      throw new NotFoundException(
        `Visual customizer with ID ${customizerId} not found`,
      );
    }

    const zones = await this.prisma.customizerZone.findMany({
      where: { customizerId },
      orderBy: { sortOrder: 'asc' },
    });

    const snapshot: ZoneConfigVersionSnapshot = {
      id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      zoneCount: zones.length,
      zones: zones.map((z) => this.zoneToSerializable(z)) as Prisma.JsonArray,
    };

    const meta = (customizer.metadata as Record<string, unknown>) ?? {};
    const versions: ZoneConfigVersionSnapshot[] = Array.isArray(meta[ZONE_CONFIG_VERSIONS_KEY])
      ? (meta[ZONE_CONFIG_VERSIONS_KEY] as ZoneConfigVersionSnapshot[])
      : [];
    versions.unshift(snapshot);
    const trimmed = versions.slice(0, MAX_CONFIG_VERSIONS);

    await this.prisma.visualCustomizer.update({
      where: { id: customizerId },
      data: {
        metadata: { ...meta, [ZONE_CONFIG_VERSIONS_KEY]: trimmed } as unknown as Prisma.InputJsonValue,
      },
    });

    this.logger.log(
      `Created zone config version ${snapshot.id} for customizer ${customizerId}`,
    );
    return snapshot;
  }

  async listConfigVersions(customizerId: string): Promise<ZoneConfigVersionSnapshot[]> {
    const customizer = await this.prisma.visualCustomizer.findUnique({
      where: { id: customizerId },
      select: { id: true, metadata: true },
    });
    if (!customizer) {
      throw new NotFoundException(
        `Visual customizer with ID ${customizerId} not found`,
      );
    }
    const meta = (customizer.metadata as Record<string, unknown>) ?? {};
    const versions = meta[ZONE_CONFIG_VERSIONS_KEY];
    if (!Array.isArray(versions)) return [];
    return versions as ZoneConfigVersionSnapshot[];
  }

  async restoreConfigVersion(
    customizerId: string,
    versionId: string,
  ): Promise<{ restored: number; zoneIds: string[] }> {
    const customizer = await this.prisma.visualCustomizer.findUnique({
      where: { id: customizerId },
      select: { id: true, metadata: true },
    });
    if (!customizer) {
      throw new NotFoundException(
        `Visual customizer with ID ${customizerId} not found`,
      );
    }

    const meta = (customizer.metadata as Record<string, unknown>) ?? {};
    const versions = meta[ZONE_CONFIG_VERSIONS_KEY];
    if (!Array.isArray(versions)) {
      throw new NotFoundException(
        `Zone config version ${versionId} not found`,
      );
    }
    const snapshot = (versions as ZoneConfigVersionSnapshot[]).find(
      (v) => v.id === versionId,
    );
    if (!snapshot || !Array.isArray(snapshot.zones)) {
      throw new NotFoundException(
        `Zone config version ${versionId} not found`,
      );
    }

    await this.prisma.customizerZone.deleteMany({
      where: { customizerId },
    });

    const zoneIds: string[] = [];
    const payload = snapshot.zones as Array<Record<string, unknown>>;
    for (let i = 0; i < payload.length; i++) {
      const raw = payload[i];
      const data = this.serializableToZoneCreate(raw, customizerId);
      const created = await this.prisma.customizerZone.create({
        data,
        select: { id: true },
      });
      zoneIds.push(created.id);
    }

    this.logger.log(
      `Restored zone config version ${versionId} for customizer ${customizerId}: ${zoneIds.length} zones`,
    );
    return { restored: zoneIds.length, zoneIds };
  }

  private aabbFromBounds(
    x: number,
    y: number,
    width: number,
    height: number,
    rotationDeg: number,
  ): BoundingRect {
    if (!rotationDeg || Math.abs(rotationDeg) < 1e-6) {
      return { x, y, width, height };
    }
    const rad = (rotationDeg * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const w = width * cos + height * sin;
    const h = width * sin + height * cos;
    return {
      x: x + (width - w) / 2,
      y: y + (height - h) / 2,
      width: w,
      height: h,
    };
  }

  private rectsOverlap(a: BoundingRect, b: BoundingRect): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  private zoneToSerializable(
    z: CustomizerZone,
  ): Record<string, unknown> {
    return {
      viewId: z.viewId,
      name: z.name,
      description: z.description,
      type: z.type,
      shape: z.shape,
      x: z.x,
      y: z.y,
      width: z.width,
      height: z.height,
      rotation: z.rotation,
      polygonPoints: z.polygonPoints,
      borderRadius: z.borderRadius,
      backgroundColor: z.backgroundColor,
      borderColor: z.borderColor,
      borderWidth: z.borderWidth,
      opacity: z.opacity,
      allowText: z.allowText,
      allowImages: z.allowImages,
      allowShapes: z.allowShapes,
      allowClipart: z.allowClipart,
      allowDrawing: z.allowDrawing,
      maxElements: z.maxElements,
      lockAspectRatio: z.lockAspectRatio,
      minScale: z.minScale,
      maxScale: z.maxScale,
      allowRotation: z.allowRotation,
      snapToBounds: z.snapToBounds,
      clipContent: z.clipContent,
      sortOrder: z.sortOrder,
      isVisible: z.isVisible,
      isLocked: z.isLocked,
      priceModifier: z.priceModifier,
    };
  }

  private serializableToZoneCreate(
    raw: Record<string, unknown>,
    customizerId: string,
  ): Prisma.CustomizerZoneCreateInput {
    return {
      customizer: { connect: { id: customizerId } },
      view: typeof raw.viewId === 'string' ? { connect: { id: raw.viewId } } : undefined,
      name: String(raw.name ?? 'Zone'),
      description:
        raw.description !== undefined && raw.description !== null
          ? String(raw.description)
          : undefined,
      type: raw.type as CustomizerZone['type'],
      shape: raw.shape as CustomizerZone['shape'],
      x: Number(raw.x) || 0,
      y: Number(raw.y) || 0,
      width: Number(raw.width) || 1,
      height: Number(raw.height) || 1,
      rotation: Number(raw.rotation) || 0,
      polygonPoints:
        raw.polygonPoints !== undefined && raw.polygonPoints !== null
          ? (raw.polygonPoints as Prisma.InputJsonValue)
          : undefined,
      borderRadius: Number(raw.borderRadius) ?? 0,
      backgroundColor:
        typeof raw.backgroundColor === 'string' ? raw.backgroundColor : undefined,
      borderColor:
        typeof raw.borderColor === 'string' ? raw.borderColor : undefined,
      borderWidth: Number(raw.borderWidth) ?? 0,
      opacity: Number(raw.opacity) ?? 1,
      allowText: Boolean(raw.allowText ?? true),
      allowImages: Boolean(raw.allowImages ?? true),
      allowShapes: Boolean(raw.allowShapes ?? true),
      allowClipart: Boolean(raw.allowClipart ?? true),
      allowDrawing: Boolean(raw.allowDrawing ?? false),
      maxElements: Number(raw.maxElements) || 10,
      lockAspectRatio: Boolean(raw.lockAspectRatio ?? false),
      minScale: Number(raw.minScale) ?? 0.1,
      maxScale: Number(raw.maxScale) ?? 5,
      allowRotation: Boolean(raw.allowRotation ?? true),
      snapToBounds: Boolean(raw.snapToBounds ?? false),
      clipContent: Boolean(raw.clipContent ?? true),
      sortOrder: Number(raw.sortOrder) ?? 0,
      isVisible: Boolean(raw.isVisible ?? true),
      isLocked: Boolean(raw.isLocked ?? false),
      priceModifier: Number(raw.priceModifier) ?? 0,
    };
  }
}
