import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
  async findAll(projectId: string) {
    return this.prisma.workspace.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        environment: true,
        config: true,
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
  async findOne(id: string, projectId: string) {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id,
        projectId,
      },
      select: {
        id: true,
        name: true,
        environment: true,
        config: true,
        project: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        createdAt: true,
        updatedAt: true,
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
  async create(projectId: string, dto: CreateWorkspaceDto) {
    // Vérifier que le projet existe
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Vérifier qu'il n'existe pas déjà un workspace avec cet environnement
    const existing = await this.prisma.workspace.findUnique({
      where: {
        projectId_environment: {
          projectId,
          environment: dto.environment,
        },
      },
    });

    if (existing) {
      throw new Error(
        `Un workspace avec l'environnement "${dto.environment}" existe déjà pour ce projet`,
      );
    }

    const workspace = await this.prisma.workspace.create({
      data: {
        ...dto,
        projectId,
        config: (dto.config || {}) as any,
      },
      select: {
        id: true,
        name: true,
        environment: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(
      `Workspace created: ${workspace.id} for project ${projectId}`,
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
    projectId: string,
    dto: Partial<CreateWorkspaceDto>,
  ) {
    await this.findOne(id, projectId);

    const workspace = await this.prisma.workspace.update({
      where: { id },
      data: dto as any,
      select: {
        id: true,
        name: true,
        environment: true,
        config: true,
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
  async remove(id: string, projectId: string) {
    await this.findOne(id, projectId);

    await this.prisma.workspace.delete({
      where: { id },
    });

    this.logger.log(`Workspace deleted: ${id}`);

    return { success: true };
  }
}
