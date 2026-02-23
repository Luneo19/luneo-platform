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
}
