import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ProviderStatus } from '@prisma/client';
import { BasePODProvider, BasePODProviderConfig } from '@/modules/production-commerce-engine/manufacturing/providers/base-pod.provider';
import { PrintfulProvider } from '@/modules/production-commerce-engine/manufacturing/providers/printful.provider';
import { GelatoProvider } from '@/modules/production-commerce-engine/manufacturing/providers/gelato.provider';
import { PrintifyProvider } from '@/modules/production-commerce-engine/manufacturing/providers/printify.provider';
import { POD_PROVIDERS, type PODProviderType } from '../../pce.constants';
import type { PODProviderRequirements } from '@/modules/production-commerce-engine/manufacturing/interfaces/manufacturing.interface';

export interface RegisterProviderParams {
  brandId: string;
  name: string;
  slug: string;
  providerType: string;
  credentials: Record<string, unknown>;
  settings?: Record<string, unknown>;
  priority?: number;
  capabilities?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ProviderManagerService {
  private readonly logger = new Logger(ProviderManagerService.name);
  private readonly instanceCache = new Map<string, BasePODProvider>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Register (create or update) a POD provider for a brand.
   */
  async registerProvider(params: RegisterProviderParams): Promise<{ id: string }> {
    const slug = params.slug.toLowerCase().replace(/\s+/g, '-');
    if (!POD_PROVIDERS.includes(params.providerType as PODProviderType)) {
      throw new Error(`Invalid providerType: ${params.providerType}`);
    }
    const existing = await this.prisma.pODProvider.findUnique({
      where: { brandId_slug: { brandId: params.brandId, slug } },
    });
    const data = {
      name: params.name,
      slug,
      providerType: params.providerType,
      credentials: params.credentials as object,
      settings: (params.settings ?? {}) as object,
      status: ProviderStatus.INACTIVE,
      priority: params.priority ?? 0,
      capabilities: (params.capabilities ?? {}) as object,
      metadata: (params.metadata ?? {}) as object,
    };
    if (existing) {
      await this.prisma.pODProvider.update({
        where: { id: existing.id },
        data,
      });
      this.instanceCache.delete(existing.id);
      this.logger.log(`Updated POD provider ${existing.id} for brand ${params.brandId}`);
      return { id: existing.id };
    }
    const created = await this.prisma.pODProvider.create({
      data: {
        brandId: params.brandId,
        ...data,
      },
    });
    this.logger.log(`Registered POD provider ${created.id} for brand ${params.brandId}`);
    return { id: created.id };
  }

  /**
   * Get a provider by ID (with optional instance for API calls).
   */
  async getProvider(providerId: string): Promise<{
    id: string;
    brandId: string;
    name: string;
    slug: string;
    providerType: string;
    status: ProviderStatus;
    priority: number;
    capabilities: unknown;
  }> {
    const provider = await this.prisma.pODProvider.findUnique({
      where: { id: providerId },
    });
    if (!provider) {
      throw new NotFoundException(`POD provider not found: ${providerId}`);
    }
    return {
      id: provider.id,
      brandId: provider.brandId,
      name: provider.name,
      slug: provider.slug,
      providerType: provider.providerType,
      status: provider.status,
      priority: provider.priority,
      capabilities: provider.capabilities,
    };
  }

  /**
   * Get a runnable provider instance for API calls. Cached per providerId.
   */
  async getProviderInstance(providerId: string): Promise<BasePODProvider> {
    let instance = this.instanceCache.get(providerId);
    if (instance) return instance;
    const row = await this.prisma.pODProvider.findUnique({
      where: { id: providerId },
    });
    if (!row) {
      throw new NotFoundException(`POD provider not found: ${providerId}`);
    }
    const config: BasePODProviderConfig = {
      providerId: row.id,
      credentials: (row.credentials as Record<string, unknown>) ?? {},
      settings: (row.settings as Record<string, unknown>) ?? {},
    };
    instance = this.createProviderInstance(row.providerType, config);
    this.instanceCache.set(providerId, instance);
    return instance;
  }

  private createProviderInstance(
    providerType: string,
    config: BasePODProviderConfig,
  ): BasePODProvider {
    switch (providerType) {
      case 'printful':
        return new PrintfulProvider(config, this.httpService);
      case 'gelato':
        return new GelatoProvider(config, this.httpService);
      case 'printify':
        return new PrintifyProvider(config, this.httpService);
      default:
        throw new Error(`Unsupported POD provider type: ${providerType}`);
    }
  }

  /**
   * List all providers for a brand.
   */
  async listProviders(brandId: string): Promise<
    Array<{
      id: string;
      name: string;
      slug: string;
      providerType: string;
      status: ProviderStatus;
      priority: number;
    }>
  > {
    const list = await this.prisma.pODProvider.findMany({
      where: { brandId },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });
    return list.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      providerType: p.providerType,
      status: p.status,
      priority: p.priority,
    }));
  }

  /**
   * Get providers that are active and available for orders.
   */
  async getAvailableProviders(brandId: string): Promise<
    Array<{
      id: string;
      name: string;
      slug: string;
      providerType: string;
      priority: number;
    }>
  > {
    const list = await this.prisma.pODProvider.findMany({
      where: {
        brandId,
        status: { in: [ProviderStatus.ACTIVE, ProviderStatus.TESTING] },
      },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });
    return list.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      providerType: p.providerType,
      priority: p.priority,
    }));
  }

  /**
   * Select the best provider for the given requirements (priority, capabilities, status).
   */
  async selectOptimalProvider(
    brandId: string,
    requirements?: PODProviderRequirements,
  ): Promise<{ id: string; name: string; slug: string } | null> {
    const available = await this.getAvailableProviders(brandId);
    if (available.length === 0) return null;
    // Prefer by priority (already sorted desc). Optionally filter by capabilities later.
    const first = available[0];
    return first ? { id: first.id, name: first.name, slug: first.slug } : null;
  }
}
