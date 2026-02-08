import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Liste tous les workspaces d'un projet
   */
  @Cacheable({
    type: 'workspace',
    ttl: 3600,
    keyGenerator: (args) => `workspaces:findAll:${args[0]}`,
    tags: (args) => [`project:${args[0]}`, 'workspaces:list'],
  })
  async findAll(brandId: string) {
    return this.prisma.workspace.findMany({
      where: { brandId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        environment: true,
        isDefault: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { environment: 'asc' },
    });
  }

  /**
   * Récupère un workspace par son ID
   */
  @Cacheable({
    type: 'workspace',
    ttl: 7200,
    keyGenerator: (args) => `workspace:${args[0]}`,
    tags: (args) => [`workspace:${args[0]}`],
  })
  async findOne(id: string, brandId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id,
        brandId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        environment: true,
        isDefault: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
        projects: {
          select: {
            id: true,
            name: true,
            type: true,
          },
          take: 10,
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }

    return workspace;
  }

  /**
   * Crée un nouveau workspace
   */
  @CacheInvalidate({
    tags: (args) => [`project:${args[0]}`, 'workspaces:list'],
  })
  async create(brandId: string, dto: CreateWorkspaceDto) {
    // Vérifier qu'il n'existe pas déjà un workspace avec ce slug pour ce brand
    const existing = await this.prisma.workspace.findUnique({
      where: {
        brandId_slug: {
          brandId,
          slug: dto.slug || dto.name.toLowerCase().replace(/\s+/g, '-'),
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Un workspace avec ce slug existe déjà`,
      );
    }

    const workspace = await this.prisma.workspace.create({
      data: {
        brandId,
        name: dto.name,
        slug: dto.slug || dto.name.toLowerCase().replace(/\s+/g, '-'),
        description: dto.description,
        environment: dto.environment,
        settings: (dto.settings || dto.config || {}) as Record<string, unknown>,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        environment: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(
      `Workspace created: ${workspace.id} for brand ${brandId}`,
    );

    return workspace;
  }

  /**
   * Met à jour un workspace
   */
  @CacheInvalidate({
    tags: (args) => [`workspace:${args[0]}`, 'workspaces:list'],
  })
  async update(
    id: string,
    brandId: string,
    dto: Partial<CreateWorkspaceDto>,
  ) {
    await this.findOne(id, brandId);

    const workspace = await this.prisma.workspace.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.environment && { environment: dto.environment }),
        ...(dto.settings && { settings: dto.settings as Record<string, unknown> }),
        ...(dto.config && { settings: dto.config as Record<string, unknown> }), // Backward compat
      },
      select: {
        id: true,
        name: true,
        slug: true,
        environment: true,
        settings: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Workspace updated: ${id}`);

    return workspace;
  }

  /**
   * Supprime un workspace
   */
  @CacheInvalidate({
    tags: (args) => [`workspace:${args[0]}`, 'workspaces:list'],
  })
  async remove(id: string, brandId: string) {
    await this.findOne(id, brandId);

    const deleted = await this.prisma.workspace.delete({
      where: { id },
      select: { id: true, name: true, brandId: true },
    });

    this.logger.log(`Workspace deleted: ${id}`);

    return {
      success: true,
      id: deleted.id,
      name: deleted.name,
      brandId: deleted.brandId,
      deletedAt: new Date().toISOString(),
    };
  }
}
