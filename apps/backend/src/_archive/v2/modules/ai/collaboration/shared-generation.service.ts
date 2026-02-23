import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface SharedWorkspace {
  id: string;
  name: string;
  ownerId: string;
  brandId: string;
  collaboratorIds: string[];
  generationIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SharedGenerationService {
  private readonly logger = new Logger(SharedGenerationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createWorkspace(params: {
    name: string;
    ownerId: string;
    brandId: string;
  }): Promise<SharedWorkspace> {
    const workspace = await this.prisma.aICollaborationWorkspace.create({
      data: {
        name: params.name,
        ownerId: params.ownerId,
        brandId: params.brandId,
        collaboratorIds: [],
        generationIds: [],
        isActive: true,
      },
    });
    this.logger.log(
      `Shared workspace created: ${workspace.id} by user ${params.ownerId}`,
    );
    return workspace;
  }

  async joinWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<SharedWorkspace> {
    const workspace = await this.prisma.aICollaborationWorkspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new BadRequestException('Workspace not found');
    if (!workspace.isActive)
      throw new BadRequestException('Workspace is no longer active');

    if (!workspace.collaboratorIds.includes(userId)) {
      const updated = await this.prisma.aICollaborationWorkspace.update({
        where: { id: workspaceId },
        data: {
          collaboratorIds: { push: userId },
        },
      });
      this.logger.log(
        `User ${userId} joined workspace ${workspaceId}`,
      );
      return updated;
    }
    return workspace;
  }

  async leaveWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const workspace = await this.prisma.aICollaborationWorkspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) return;

    const updatedCollaborators = workspace.collaboratorIds.filter(
      (id) => id !== userId,
    );
    await this.prisma.aICollaborationWorkspace.update({
      where: { id: workspaceId },
      data: {
        collaboratorIds: updatedCollaborators,
      },
    });
    this.logger.log(`User ${userId} left workspace ${workspaceId}`);
  }

  async addGeneration(
    workspaceId: string,
    generationId: string,
    userId: string,
  ): Promise<void> {
    const workspace = await this.prisma.aICollaborationWorkspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new BadRequestException('Workspace not found');
    if (
      workspace.ownerId !== userId &&
      !workspace.collaboratorIds.includes(userId)
    ) {
      throw new BadRequestException(
        'Not authorized to add generations to this workspace',
      );
    }

    await this.prisma.aICollaborationWorkspace.update({
      where: { id: workspaceId },
      data: {
        generationIds: { push: generationId },
      },
    });
  }

  async getWorkspace(workspaceId: string): Promise<SharedWorkspace> {
    const workspace = await this.prisma.aICollaborationWorkspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new BadRequestException('Workspace not found');
    return workspace;
  }

  async listWorkspaces(userId: string): Promise<SharedWorkspace[]> {
    return this.prisma.aICollaborationWorkspace.findMany({
      where: {
        isActive: true,
        OR: [
          { ownerId: userId },
          { collaboratorIds: { has: userId } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
  }

  async closeWorkspace(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const workspace = await this.prisma.aICollaborationWorkspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new BadRequestException('Workspace not found');
    if (workspace.ownerId !== userId)
      throw new BadRequestException('Only the owner can close a workspace');

    await this.prisma.aICollaborationWorkspace.update({
      where: { id: workspaceId },
      data: { isActive: false },
    });
    this.logger.log(`Workspace ${workspaceId} closed by owner ${userId}`);
  }
}
