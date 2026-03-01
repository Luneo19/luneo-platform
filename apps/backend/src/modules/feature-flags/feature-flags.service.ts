import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFlagsForBrand(brandId: string | null): Promise<Record<string, boolean>> {
    const flags = await this.prisma.featureFlag.findMany({
      where: {
        enabled: true,
      },
      select: { key: true, enabled: true },
    });
    const map: Record<string, boolean> = {};
    for (const f of flags) {
      map[f.key] = f.enabled;
    }
    return map;
  }

  async getFlagByKey(key: string) {
    return this.prisma.featureFlag.findUnique({ where: { key } });
  }

  async setRolloutPercentage(key: string, rolloutPercentage: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(rolloutPercentage)));
    return this.prisma.featureFlag.update({
      where: { key },
      data: { rolloutPercentage: clamped },
    });
  }

  isEnabledForOrganization(flag: { enabled: boolean; rolloutPercentage: number }, orgId: string): boolean {
    if (!flag.enabled) return false;
    if (flag.rolloutPercentage >= 100) return true;
    const bucket = this.hashToBucket(orgId);
    return bucket < flag.rolloutPercentage;
  }

  private hashToBucket(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 100);
  }
}
