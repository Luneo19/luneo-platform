import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get feature flags for the authenticated brand (brand-specific overrides global).
   * Returns a map of flag key -> enabled.
   */
  async getFlagsForBrand(brandId: string | null): Promise<Record<string, boolean>> {
    const flags = await this.prisma.featureFlag.findMany({
      where: {
        isEnabled: true,
        OR: brandId ? [{ brandId: null }, { brandId }] : [{ brandId: null }],
      },
      select: { key: true, isEnabled: true, brandId: true },
    });
    const map: Record<string, boolean> = {};
    for (const f of flags) {
      if (f.brandId) {
        map[f.key] = f.isEnabled;
      } else if (map[f.key] === undefined) {
        map[f.key] = f.isEnabled;
      }
    }
    for (const f of flags) {
      if (f.brandId === null && map[f.key] === undefined) {
        map[f.key] = f.isEnabled;
      }
    }
    return map;
  }
}
