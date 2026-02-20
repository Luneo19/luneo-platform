import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';

@Injectable()
export class SnapshotsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un snapshot (idempotent via specHash)
   */
  @CacheInvalidate({ type: 'snapshot', tags: () => ['snapshots:list'] })
  async create(dto: CreateSnapshotDto, brandId: string, userId?: string): Promise<import('@prisma/client').Snapshot> {
    // 1. Vérifier que le spec existe et appartient au brand
    const spec = await this.prisma.designSpec.findUnique({
      where: { specHash: dto.specHash },
      include: {
        product: {
          select: {
            id: true,
            brandId: true,
          },
        },
      },
    });

    if (!spec || spec.product.brandId !== brandId) {
      throw new NotFoundException('Spec not found');
    }

    // 2. Vérifier si snapshot existe déjà (idempotency)
    const existing = await this.prisma.snapshot.findFirst({
      where: {
        specHash: dto.specHash,
        isValidated: dto.isValidated || false,
      },
      include: {
        spec: {
          include: {
            product: true,
          },
        },
      },
    });

    if (existing) {
      return existing;
    }

    // 3. Créer nouveau snapshot
    return this.prisma.snapshot.create({
      data: {
        specId: spec.id,
        specHash: dto.specHash,
        specData: (spec.spec ?? {}) as import('@prisma/client').Prisma.InputJsonValue,
        previewUrl: dto.previewUrl,
        preview3dUrl: dto.preview3dUrl,
        thumbnailUrl: dto.thumbnailUrl,
        productionBundleUrl: dto.productionBundleUrl,
        arModelUrl: dto.arModelUrl,
        gltfModelUrl: dto.gltfModelUrl,
        assetVersions: dto.assetVersions as import('@prisma/client').Prisma.InputJsonValue,
        isValidated: dto.isValidated || false,
        validatedBy: dto.isValidated ? userId : null,
        validatedAt: dto.isValidated ? new Date() : null,
        isLocked: dto.isLocked || false,
        lockedAt: dto.isLocked ? new Date() : null,
        createdBy: userId || dto.createdBy || 'api',
        provenance: (dto.provenance || {}) as import('@prisma/client').Prisma.InputJsonValue,
      },
      include: {
        spec: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer un snapshot (cacheable)
   */
  @Cacheable({ 
    type: 'snapshot', 
    ttl: 3600,
    keyGenerator: (args) => `snapshot:${args[0]}`,
  })
  async findOne(id: string, brandId: string): Promise<import('@prisma/client').Snapshot> {
    const snapshot = await this.prisma.snapshot.findUnique({
      where: { id },
      include: {
        spec: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                brandId: true,
              },
            },
          },
        },
      },
    });

    if (!snapshot) {
      throw new NotFoundException('Snapshot not found');
    }

    // Vérifier brand scoping
    if (snapshot.spec.product.brandId !== brandId) {
      throw new NotFoundException('Snapshot not found');
    }

    return snapshot;
  }

  /**
   * Verrouiller un snapshot
   */
  @CacheInvalidate({ type: 'snapshot', pattern: (args) => `snapshot:${args[0]}` })
  async lock(id: string, brandId: string, _userId: string): Promise<import('@prisma/client').Snapshot> {
    const snapshot = await this.findOne(id, brandId);

    if (snapshot.isLocked) {
      throw new ForbiddenException('Snapshot already locked');
    }

    return this.prisma.snapshot.update({
      where: { id },
      data: {
        isLocked: true,
        lockedAt: new Date(),
      },
    });
  }
}

