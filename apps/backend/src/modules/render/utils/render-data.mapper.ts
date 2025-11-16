import {
  AssetInfo,
  RenderBlendMode,
  RenderColorZone,
  RenderDesignData,
  RenderDesignOptions,
  RenderEffect,
  RenderFit,
  RenderImageZone,
  RenderTextZone,
  RenderZone,
  RenderZoneBase,
} from '../interfaces/render.interface';

interface PrismaAsset {
  id: string;
  url: string;
  type: string;
  format: string;
  size: number;
  width: number | null;
  height: number | null;
  metadata: unknown;
}

interface PrismaDesignRecord {
  optionsJson?: unknown;
  assets?: PrismaAsset[];
}

export function parseDesignOptions(options: unknown): RenderDesignOptions | undefined {
  if (!isRecord(options)) {
    return undefined;
  }

  const zonesInput = options.zones;
  const effectsInput = options.effects;
  const metadataInput = options.metadata;

  const zones =
    isRecord(zonesInput) ? normalizeZones(zonesInput as Record<string, unknown>) : undefined;

  const effects = Array.isArray(effectsInput)
    ? normalizeEffects(effectsInput as unknown[])
    : undefined;

  const metadata = isRecord(metadataInput)
    ? (metadataInput as Record<string, unknown>)
    : undefined;

  if (!zones && !effects && !metadata) {
    return undefined;
  }

  return {
    zones,
    effects,
    metadata,
  };
}

export function mapDesignAssets(assets: PrismaAsset[] | undefined): AssetInfo[] | undefined {
  if (!assets || assets.length === 0) {
    return undefined;
  }

  return assets.map((asset) => ({
    id: asset.id,
    url: asset.url,
    type: normalizeAssetType(asset.type),
    format: asset.format,
    size: asset.size,
    width: asset.width ?? undefined,
    height: asset.height ?? undefined,
    metadata: isRecord(asset.metadata) ? (asset.metadata as Record<string, unknown>) : undefined,
  }));
}

export function mapDesignRecord(design: PrismaDesignRecord): RenderDesignData {
  return {
    options: parseDesignOptions(design.optionsJson),
    assets: mapDesignAssets(design.assets),
  };
}

function normalizeZones(zonesInput: Record<string, unknown>): Record<string, RenderZone> {
  const zones: Record<string, RenderZone> = {};

  for (const [zoneId, zoneValue] of Object.entries(zonesInput)) {
    if (!isRecord(zoneValue)) {
      continue;
    }

    const base = mapBaseZone(zoneValue);
    const type = zoneValue.type;

    if (type === 'image' && typeof zoneValue.imageUrl === 'string') {
      const zone: RenderImageZone = {
        type: 'image',
        imageUrl: zoneValue.imageUrl,
        fit: isRenderFit(zoneValue.fit) ? zoneValue.fit : undefined,
        blend: isBlendMode(zoneValue.blend) ? zoneValue.blend : undefined,
        ...base,
      };
      zones[zoneId] = zone;
      continue;
    }

    if (type === 'text' && typeof zoneValue.text === 'string') {
      const align =
        typeof zoneValue.align === 'string' && ['left', 'center', 'right'].includes(zoneValue.align)
          ? (zoneValue.align as 'left' | 'center' | 'right')
          : undefined;

      const fontWeight =
        typeof zoneValue.fontWeight === 'string' || typeof zoneValue.fontWeight === 'number'
          ? zoneValue.fontWeight
          : undefined;

      const zone: RenderTextZone = {
        type: 'text',
        text: zoneValue.text,
        font: typeof zoneValue.font === 'string' ? zoneValue.font : undefined,
        fontSize: toOptionalNumber(zoneValue.fontSize),
        color: typeof zoneValue.color === 'string' ? zoneValue.color : undefined,
        align,
        fontWeight,
        letterSpacing: toOptionalNumber(zoneValue.letterSpacing),
        lineHeight: toOptionalNumber(zoneValue.lineHeight),
        backgroundColor: typeof zoneValue.backgroundColor === 'string' ? zoneValue.backgroundColor : undefined,
        ...base,
      };
      zones[zoneId] = zone;
      continue;
    }

    if (type === 'color' && typeof zoneValue.color === 'string') {
      const zone: RenderColorZone = {
        type: 'color',
        color: zoneValue.color,
        blend: isBlendMode(zoneValue.blend) ? zoneValue.blend : undefined,
        ...base,
      };
      zones[zoneId] = zone;
    }
  }

  return zones;
}

function mapBaseZone(zone: Record<string, unknown>): RenderZoneBase {
  return {
    x: toOptionalNumber(zone.x),
    y: toOptionalNumber(zone.y),
    width: toOptionalNumber(zone.width),
    height: toOptionalNumber(zone.height),
    rotation: toOptionalNumber(zone.rotation),
    opacity: toOptionalNumber(zone.opacity),
    zIndex: toOptionalNumber(zone.zIndex),
  };
}

function normalizeEffects(effectsInput: unknown[]): RenderEffect[] {
  const supportedTypes: RenderEffect['type'][] = [
    'blur',
    'sharpen',
    'brightness',
    'contrast',
    'hue',
    'grayscale',
    'sepia',
    'vintage',
  ];

  const effects: RenderEffect[] = [];

  for (const effect of effectsInput) {
    if (!isRecord(effect)) {
      continue;
    }

    const type = effect.type;
    if (typeof type === 'string' && supportedTypes.includes(type as RenderEffect['type'])) {
      effects.push({
        type: type as RenderEffect['type'],
        intensity: toOptionalNumber(effect.intensity),
        value: toOptionalNumber(effect.value),
      });
    }
  }

  return effects;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function isBlendMode(value: unknown): value is RenderBlendMode {
  const blendModes: RenderBlendMode[] = [
    'clear',
    'source',
    'over',
    'in',
    'out',
    'atop',
    'dest',
    'dest-over',
    'dest-in',
    'dest-out',
    'dest-atop',
    'xor',
    'add',
    'saturate',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
  ];
  return typeof value === 'string' && blendModes.includes(value as RenderBlendMode);
}

function isRenderFit(value: unknown): value is RenderFit {
  const fits: RenderFit[] = ['cover', 'contain', 'fill', 'inside', 'outside'];
  return typeof value === 'string' && fits.includes(value as RenderFit);
}

function normalizeAssetType(type: string): AssetInfo['type'] {
  const allowed: AssetInfo['type'][] = ['image', 'model', 'texture', 'video'];
  return allowed.includes(type as AssetInfo['type']) ? (type as AssetInfo['type']) : 'image';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}


