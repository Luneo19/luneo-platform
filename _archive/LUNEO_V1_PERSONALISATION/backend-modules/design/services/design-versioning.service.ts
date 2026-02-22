import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

/** Single named version stored in Design.metadata.versions */
export interface DesignVersionRecord {
  id: string;
  name: string | null;
  canvasData: Prisma.JsonValue;
  createdBy: string;
  createdAt: string; // ISO
  thumbnailUrl: string | null;
}

/** Auto-save snapshot (no name, no createdBy) */
export interface AutoSaveSnapshot {
  id: string;
  canvasData: Prisma.JsonValue;
  createdAt: string;
}

/** Shape of Design.metadata when using versioning */
export interface DesignVersioningMetadata {
  versions?: DesignVersionRecord[];
  autoSaveSnapshots?: AutoSaveSnapshot[];
  [key: string]: unknown;
}

/** DTO returned by listVersions */
export interface VersionListItem {
  id: string;
  name: string | null;
  createdAt: string;
  createdBy: string;
  thumbnailUrl: string | null;
}

/** DTO returned by compareVersions */
export interface VersionCompareResult {
  added: number;
  removed: number;
  modified: number;
  summary: string;
}

const MAX_AUTO_SAVE_SNAPSHOTS = 50;

@Injectable()
export class DesignVersioningService {
  private readonly logger = new Logger(DesignVersioningService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a named snapshot of the design's current canvas data and stores it in metadata.versions.
   */
  async createVersion(
    designId: string,
    userId: string,
    name?: string,
  ): Promise<DesignVersionRecord> {
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      select: {
        id: true,
        designData: true,
        metadata: true,
        imageUrl: true,
        previewUrl: true,
      },
    });

    if (!design) {
      throw new NotFoundException(`Design with ID ${designId} not found`);
    }

    const meta = this.getVersioningMetadata(design.metadata);
    const versions = meta.versions ?? [];
    const canvasData = design.designData ?? {};
    const thumbnailUrl =
      design.imageUrl ?? design.previewUrl ?? null;
    const now = new Date().toISOString();
    const version: DesignVersionRecord = {
      id: randomUUID(),
      name: name ?? null,
      canvasData,
      createdBy: userId,
      createdAt: now,
      thumbnailUrl,
    };
    versions.push(version);

    const updatedMeta: DesignVersioningMetadata = {
      ...meta,
      versions,
    };

    await this.prisma.design.update({
      where: { id: designId },
      data: {
        metadata: updatedMeta as unknown as Prisma.InputJsonValue,
      },
    });

    this.logger.log(
      `Created version ${version.id} for design ${designId} by user ${userId}`,
    );
    return version;
  }

  /**
   * Lists all named versions for a design (id, name, createdAt, createdBy, thumbnailUrl).
   */
  async listVersions(designId: string): Promise<VersionListItem[]> {
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      select: { metadata: true },
    });

    if (!design) {
      throw new NotFoundException(`Design with ID ${designId} not found`);
    }

    const meta = this.getVersioningMetadata(design.metadata);
    const versions = meta.versions ?? [];
    return versions.map((v) => ({
      id: v.id,
      name: v.name,
      createdAt: v.createdAt,
      createdBy: v.createdBy,
      thumbnailUrl: v.thumbnailUrl,
    }));
  }

  /**
   * Restores a previous version by copying its canvasData back to the design's designData.
   */
  async restoreVersion(
    designId: string,
    versionId: string,
  ): Promise<{ designData: Prisma.JsonValue }> {
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      select: { id: true, metadata: true },
    });

    if (!design) {
      throw new NotFoundException(`Design with ID ${designId} not found`);
    }

    const meta = this.getVersioningMetadata(design.metadata);
    const versions = meta.versions ?? [];
    const version = versions.find((v) => v.id === versionId);
    if (!version) {
      throw new NotFoundException(
        `Version ${versionId} not found for design ${designId}`,
      );
    }

    await this.prisma.design.update({
      where: { id: designId },
      data: {
        designData: version.canvasData as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Restored version ${versionId} for design ${designId}`);
    return { designData: version.canvasData };
  }

  /**
   * Compares two versions and returns a diff summary (added/removed/modified object counts).
   */
  async compareVersions(
    designId: string,
    versionAId: string,
    versionBId: string,
  ): Promise<VersionCompareResult> {
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      select: { metadata: true },
    });

    if (!design) {
      throw new NotFoundException(`Design with ID ${designId} not found`);
    }

    const meta = this.getVersioningMetadata(design.metadata);
    const versions = meta.versions ?? [];
    const versionA = versions.find((v) => v.id === versionAId);
    const versionB = versions.find((v) => v.id === versionBId);

    if (!versionA) {
      throw new NotFoundException(
        `Version ${versionAId} not found for design ${designId}`,
      );
    }
    if (!versionB) {
      throw new NotFoundException(
        `Version ${versionBId} not found for design ${designId}`,
      );
    }

    const diff = this.computeCanvasDiff(
      versionA.canvasData as object,
      versionB.canvasData as object,
    );

    const summary = `Added: ${diff.added}, Removed: ${diff.removed}, Modified: ${diff.modified}`;
    return {
      ...diff,
      summary,
    };
  }

  /**
   * Auto-saves canvas data. Keeps the last 50 auto-save snapshots in metadata.autoSaveSnapshots.
   * Call this from the client every ~30s when the user is editing.
   */
  async autoSave(
    designId: string,
    canvasData: Prisma.JsonValue,
  ): Promise<{ snapshotId: string }> {
    if (canvasData === undefined || canvasData === null) {
      throw new BadRequestException('canvasData is required');
    }

    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      select: { id: true, metadata: true },
    });

    if (!design) {
      throw new NotFoundException(`Design with ID ${designId} not found`);
    }

    const meta = this.getVersioningMetadata(design.metadata);
    const snapshots: AutoSaveSnapshot[] = meta.autoSaveSnapshots ?? [];
    const snapshot: AutoSaveSnapshot = {
      id: randomUUID(),
      canvasData,
      createdAt: new Date().toISOString(),
    };
    snapshots.push(snapshot);

    const trimmed = snapshots.slice(-MAX_AUTO_SAVE_SNAPSHOTS);
    const updatedMeta: DesignVersioningMetadata = {
      ...meta,
      autoSaveSnapshots: trimmed,
    };

    await this.prisma.design.update({
      where: { id: designId },
      data: {
        designData: canvasData as Prisma.InputJsonValue,
        metadata: updatedMeta as unknown as Prisma.InputJsonValue,
      },
    });

    this.logger.debug(
      `Auto-save snapshot ${snapshot.id} for design ${designId} (${trimmed.length} snapshots kept)`,
    );
    return { snapshotId: snapshot.id };
  }

  /** Normalizes metadata to our versioning shape. */
  private getVersioningMetadata(metadata: Prisma.JsonValue): DesignVersioningMetadata {
    if (metadata === null || metadata === undefined) {
      return {};
    }
    if (typeof metadata !== 'object' || Array.isArray(metadata)) {
      return {};
    }
    const obj = metadata as Record<string, unknown>;
    return {
      ...obj,
      versions: Array.isArray(obj.versions) ? obj.versions as DesignVersionRecord[] : [],
      autoSaveSnapshots: Array.isArray(obj.autoSaveSnapshots)
        ? (obj.autoSaveSnapshots as AutoSaveSnapshot[])
        : [],
    };
  }

  /**
   * Computes added/removed/modified counts between two canvas payloads.
   * Expects canvas data to have an "objects" or "layers" array with items that have an "id" field.
   */
  private computeCanvasDiff(
    canvasA: object,
    canvasB: object,
  ): Omit<VersionCompareResult, 'summary'> {
    const idsA = this.getCanvasObjectIds(canvasA);
    const idsB = this.getCanvasObjectIds(canvasB);
    const mapA = this.getCanvasObjectMap(canvasA);
    const mapB = this.getCanvasObjectMap(canvasB);

    let added = 0;
    let removed = 0;
    let modified = 0;

    const allIds = new Set([...idsA, ...idsB]);
    for (const id of allIds) {
      const inA = idsA.has(id);
      const inB = idsB.has(id);
      if (!inA && inB) added++;
      else if (inA && !inB) removed++;
      else if (inA && inB) {
        const objA = mapA.get(id);
        const objB = mapB.get(id);
        if (objA !== undefined && objB !== undefined && !this.shallowEqual(objA, objB)) {
          modified++;
        }
      }
    }

    return { added, removed, modified };
  }

  private getCanvasObjectIds(canvas: object): Set<string> {
    const arr = this.getCanvasObjectArray(canvas);
    const ids = new Set<string>();
    for (const item of arr) {
      if (item && typeof item === 'object' && 'id' in item && typeof (item as { id: unknown }).id === 'string') {
        ids.add((item as { id: string }).id);
      }
    }
    return ids;
  }

  private getCanvasObjectMap(canvas: object): Map<string, unknown> {
    const arr = this.getCanvasObjectArray(canvas);
    const map = new Map<string, unknown>();
    for (const item of arr) {
      if (item && typeof item === 'object' && 'id' in item && typeof (item as { id: unknown }).id === 'string') {
        map.set((item as { id: string }).id, item);
      }
    }
    return map;
  }

  private getCanvasObjectArray(canvas: object): unknown[] {
    if (!canvas || typeof canvas !== 'object') return [];
    const c = canvas as Record<string, unknown>;
    if (Array.isArray(c.objects)) return c.objects;
    if (Array.isArray(c.layers)) return c.layers;
    return [];
  }

  private shallowEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
      return false;
    }
    const keysA = Object.keys(a as object).sort();
    const keysB = Object.keys(b as object).sort();
    if (keysA.length !== keysB.length) return false;
    for (let i = 0; i < keysA.length; i++) {
      if (keysA[i] !== keysB[i]) return false;
    }
    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;
    for (const k of keysA) {
      const va = objA[k];
      const vb = objB[k];
      if (va !== vb && JSON.stringify(va) !== JSON.stringify(vb)) return false;
    }
    return true;
  }
}
