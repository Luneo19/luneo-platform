import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type { Prisma } from '@prisma/client';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { ProjectQueryDto } from '../dto/project-query.dto';
import {
  normalizePagination,
  createPaginationResult,
  PaginationParams,
  PaginationResult,
} from '@/libs/prisma/pagination.helper';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';
import { CurrentUser } from '@/common/types/user.types';
import { randomBytes } from 'crypto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Génère une clé API unique pour un projet
   */
  private generateApiKey(): string {
    return `pk_${randomBytes(32).toString('hex')}`;
  }

  /**
   * Liste tous les projets d'une organisation avec pagination
   */
  @Cacheable({
    type: 'project',
    ttl: 3600,
    keyGenerator: (args) =>
      `projects:findAll:${JSON.stringify(args[0])}:${JSON.stringify(args[1])}`,
    tags: (args) =>
      [
        'projects:list',
        args[0]?.organizationId ? `organization:${args[0].organizationId}` : null,
      ].filter(Boolean) as string[],
  })
  async findAll(
    organizationId: string,
    query: ProjectQueryDto = {},
    pagination: PaginationParams = {},
  ): Promise<PaginationResult<unknown>> {
    const { type, status, search } = query;
    const { skip, take, page, limit } = normalizePagination(pagination);

    const where = {
      brandId: organizationId, // Utiliser brandId pour compatibilité
      ...(type && { type }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { slug: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          slug: true,
          status: true,
          apiKey: true,
          thumbnail: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.project.count({ where }),
    ]);

    return createPaginationResult(data, total, { page, limit });
  }

  /**
   * Récupère un projet par son ID
   */
  @Cacheable({
    type: 'project',
    ttl: 7200,
    keyGenerator: (args) => `project:${args[0]}`,
    tags: () => ['projects:list'],
  })
  async findOne(id: string, organizationId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        id,
        brandId: organizationId, // Utiliser brandId pour compatibilité
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        slug: true,
        status: true,
        settings: true,
        apiKey: true,
        thumbnail: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        workspace: {
          select: {
            id: true,
            name: true,
            environment: true,
            settings: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  /**
   * Crée un nouveau projet
   */
  @CacheInvalidate({ tags: ['projects:list'] })
  async create(
    organizationId: string,
    dto: CreateProjectDto,
    user: CurrentUser,
  ) {
    // Vérifier que le slug est unique pour ce brand
    const existing = await this.prisma.project.findUnique({
      where: {
        brandId_slug: {
          brandId: organizationId,
          slug: dto.slug,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Un projet avec le slug "${dto.slug}" existe déjà`);
    }

    const apiKey = this.generateApiKey();

    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        type: dto.type,
        status: 'DRAFT', // Statut par défaut
        brandId: organizationId, // Utiliser brandId pour compatibilité
        apiKey,
        settings: (dto.settings || {}) as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        slug: true,
        status: true,
        apiKey: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Project created: ${project.id} by user ${user.id}`);

    return project;
  }

  /**
   * Met à jour un projet
   */
  @CacheInvalidate({
    tags: (args) => ['projects:list', `project:${args[0]}`],
  })
  async update(
    id: string,
    organizationId: string,
    dto: UpdateProjectDto,
  ) {
    // Vérifier que le projet existe et appartient à l'organisation
    await this.findOne(id, organizationId);

    // Si le slug est modifié, vérifier l'unicité
    if (dto.slug) {
      const existing = await this.prisma.project.findFirst({
        where: {
          brandId: organizationId,
          slug: dto.slug,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException(`Un projet avec le slug "${dto.slug}" existe déjà`);
      }
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type && { type: dto.type }),
        ...(dto.status && { status: dto.status }),
        ...(dto.settings && { settings: dto.settings as Prisma.InputJsonValue }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        slug: true,
        status: true,
        settings: true,
        apiKey: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Project updated: ${id}`);

    return project;
  }

  /**
   * Supprime un projet (soft delete en changeant le statut)
   */
  @CacheInvalidate({
    tags: (args) => ['projects:list', `project:${args[0]}`],
  })
  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    const project = await this.prisma.project.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    this.logger.log(`Project archived: ${id}`);

    return project;
  }

  /**
   * Régénère la clé API d'un projet
   */
  @CacheInvalidate({
    tags: (args) => ['projects:list', `project:${args[0]}`],
  })
  async regenerateApiKey(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    const newApiKey = this.generateApiKey();

    const project = await this.prisma.project.update({
      where: { id },
      data: { apiKey: newApiKey },
      select: {
        id: true,
        apiKey: true,
        updatedAt: true,
      },
    });

    this.logger.log(`API key regenerated for project: ${id}`);

    return project;
  }
}
