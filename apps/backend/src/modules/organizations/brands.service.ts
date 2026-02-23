import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { PlatformRole, OrgStatus, Prisma } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';
import { JsonValue } from '@/common/types/utility-types';

@Injectable()
export class BrandsService {
  constructor(
    private prisma: PrismaOptimizedService,
    private cache: SmartCacheService,
  ) {}

  async create(createBrandDto: Record<string, JsonValue>, userId: string) {
    const user = await this.cache.get(
      `user:${userId}`,
      'user',
      () =>
        this.prisma.user.findUnique({
          where: { id: userId },
        }),
    );

    if (!user || user.role !== PlatformRole.ADMIN) {
      throw new ForbiddenException('Only admins can create organizations');
    }

    const name = (createBrandDto.name as string) || 'organization';
    const baseSlug =
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 60) || 'organization';
    const slug =
      (createBrandDto.slug as string) || `${baseSlug}-${Date.now().toString(36)}`;

    const { contactEmail: _contactEmail, ...rest } = createBrandDto;

    const organization = await this.prisma.organization.create({
      data: {
        ...rest,
        slug,
        name: name,
      } as unknown as Prisma.OrganizationCreateInput,
    });

    await this.cache.invalidate('organizations:list', 'organization');

    return organization;
  }

  async findOne(id: string, currentUser: CurrentUser) {
    if (
      currentUser.role !== PlatformRole.ADMIN &&
      currentUser.organizationId !== id
    ) {
      throw new ForbiddenException('Access denied to this organization');
    }

    const organization = await this.cache.get(
      `organization:${id}`,
      'organization',
      () =>
        this.prisma.organization.findUnique({
          where: { id },
          include: {
            members: {
              include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
            },
          },
        }),
      { tags: [`organization:${id}`, 'organizations:list'] },
    );

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(
    id: string,
    updateBrandDto: Record<string, JsonValue>,
    currentUser: CurrentUser,
  ) {
    if (
      currentUser.role !== PlatformRole.ADMIN &&
      currentUser.organizationId !== id
    ) {
      throw new ForbiddenException('Access denied to this organization');
    }

    const organization = await this.prisma.organization.update({
      where: { id },
      data: updateBrandDto as unknown as Prisma.OrganizationUpdateInput,
    });

    await this.cache.invalidate(`organization:${id}`, 'organization');

    return organization;
  }

  async addWebhook(
    organizationId: string,
    webhookData: Record<string, JsonValue>,
    currentUser: CurrentUser,
  ) {
    if (
      currentUser.role !== PlatformRole.ADMIN &&
      currentUser.organizationId !== organizationId
    ) {
      throw new ForbiddenException('Access denied to this organization');
    }

    const webhook = await this.prisma.webhook.create({
      data: {
        ...webhookData,
        organizationId,
      } as unknown as Prisma.WebhookCreateInput,
    });

    await this.cache.invalidate(
      `webhooks:${organizationId}`,
      'organization',
    );

    return webhook;
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    filters: Record<string, JsonValue> = {},
  ) {
    const cacheKey = `organizations:list:${page}:${limit}:${JSON.stringify(filters)}`;

    return this.cache.get(
      cacheKey,
      'organization',
      () =>
        this.prisma.organization.findMany({
          where: filters as unknown as Prisma.OrganizationWhereInput,
          select: {
            id: true,
            name: true,
            logo: true,
            website: true,
            status: true,
            plan: true,
            createdAt: true,
            updatedAt: true,
            members: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      { ttl: 1800, tags: ['organizations:list'] },
    );
  }

  async getBrandStats(organizationId: string, currentUser: CurrentUser) {
    if (
      currentUser.role !== PlatformRole.ADMIN &&
      currentUser.organizationId !== organizationId
    ) {
      throw new ForbiddenException('Access denied to this organization');
    }

    return this.cache.get(
      `organization:${organizationId}:stats`,
      'analytics',
      () => this.prisma.getDashboardMetrics(organizationId),
      { ttl: 300, tags: [`organization:${organizationId}`] },
    );
  }

  async searchBrands(query: string, limit: number = 10) {
    const cacheKey = `organizations:search:${query}:${limit}`;

    return this.cache.get(
      cacheKey,
      'organization',
      () =>
        this.prisma.organization.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { website: { contains: query, mode: 'insensitive' } },
            ],
            status: OrgStatus.ACTIVE,
          },
          select: {
            id: true,
            name: true,
            logo: true,
            website: true,
            status: true,
          },
          take: limit,
          orderBy: { name: 'asc' },
        }),
      { ttl: 600, tags: ['organizations:search'] },
    );
  }
}
