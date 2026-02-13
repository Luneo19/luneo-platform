import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SpecBuilderService } from './services/spec-builder.service';
import { SpecCanonicalizerService } from './services/spec-canonicalizer.service';
import { SpecHasherService } from './services/spec-hasher.service';
import { CreateSpecDto } from './dto/create-spec.dto';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';

@Injectable()
export class SpecsService {
  constructor(
    private prisma: PrismaService,
    private specBuilder: SpecBuilderService,
    private canonicalizer: SpecCanonicalizerService,
    private hasher: SpecHasherService,
  ) {}

  /**
   * Créer ou récupérer un DesignSpec (idempotent via specHash)
   */
  @CacheInvalidate({ type: 'spec', tags: () => ['specs:list'] })
  async createOrGet(dto: CreateSpecDto, brandId: string): Promise<import('@prisma/client').DesignSpec> {
    // 1. Builder le spec depuis zone inputs
    const spec = await this.specBuilder.build(dto.productId, dto.zoneInputs);

    // 2. Canonicalizer (normaliser JSON)
    const canonicalSpec = this.canonicalizer.canonicalize(spec);

    // 3. Hasher (SHA256)
    const specHash = this.hasher.hash(canonicalSpec);

    // 4. Vérifier si existe déjà (idempotency)
    const existing = await this.prisma.designSpec.findUnique({
      where: { specHash },
      include: { 
        product: {
          select: {
            id: true,
            name: true,
            brandId: true,
          },
        },
      },
    });

    if (existing) {
      // Vérifier que le product appartient au brand
      if (existing.product.brandId !== brandId) {
        throw new NotFoundException('Spec not found');
      }
      return existing;
    }

    // 5. Vérifier que le product appartient au brand
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { id: true, brandId: true },
    });

    if (!product || product.brandId !== brandId) {
      throw new NotFoundException('Product not found');
    }

    // 6. Créer nouveau spec
    return this.prisma.designSpec.create({
      data: {
        specVersion: dto.specVersion || '1.0.0',
        specHash,
        spec: canonicalSpec as import('@prisma/client').Prisma.InputJsonValue,
        productId: dto.productId,
        zoneInputs: dto.zoneInputs,
        metadata: dto.metadata || {},
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brandId: true,
          },
        },
      },
    });
  }

  /**
   * Récupérer un spec par hash (cacheable)
   */
  @Cacheable({ 
    type: 'spec', 
    ttl: 3600,
    keyGenerator: (args) => `spec:hash:${args[0]}`,
  })
  async findByHash(specHash: string, brandId: string): Promise<import('@prisma/client').DesignSpec> {
    const spec = await this.prisma.designSpec.findUnique({
      where: { specHash },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brandId: true,
          },
        },
      },
    });

    if (!spec) {
      throw new NotFoundException('Spec not found');
    }

    // Vérifier brand scoping
    if (spec.product.brandId !== brandId) {
      throw new NotFoundException('Spec not found');
    }

    return spec;
  }

  /**
   * Valider un spec JSON contre le schema
   */
  async validate(spec: unknown): Promise<{ valid: boolean; errors?: string[] }> {
    // Validation JSON Schema (à implémenter si nécessaire)
    // Pour l'instant, validation basique
    if (!spec || typeof spec !== 'object') {
      return { valid: false, errors: ['Spec must be an object'] };
    }

    const specObj = spec as { productId?: string; zones?: unknown };
    if (!specObj.productId || !specObj.zones) {
      return { valid: false, errors: ['Spec must have productId and zones'] };
    }

    return { valid: true };
  }
}











