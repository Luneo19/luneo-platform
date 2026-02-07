/**
 * ★★★ SERVICE - AR COLLABORATION ★★★
 * Service NestJS pour la collaboration AR (projets, commentaires, permissions)
 * Respecte la Bible Luneo : pas de any, types stricts, logging professionnel
 */

import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type { ARProject as PrismaARProject, ARProjectMember as PrismaARProjectMember, ARProjectComment as PrismaARProjectComment } from '@prisma/client';

export interface ARProject {
  id: string;
  name: string;
  description?: string;
  modelIds: string[];
  members: ARProjectMember[];
  comments: ARComment[];
  permissions: ARPermission;
  brandId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ARProjectMember {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: Date;
}

export interface ARComment {
  id: string;
  projectId: string;
  modelId?: string;
  userId: string;
  content: string;
  position?: { x: number; y: number; z: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface ARPermission {
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canComment: boolean;
}

type ProjectWithRelations = PrismaARProject & {
  members: (PrismaARProjectMember & { user?: { id: string } })[];
  comments?: (PrismaARProjectComment & { user?: { id: string } })[];
  _count?: { comments: number };
};

function projectSettingsModelIds(settings: unknown): string[] {
  if (settings && typeof settings === 'object' && Array.isArray((settings as { modelIds?: string[] }).modelIds)) {
    return (settings as { modelIds: string[] }).modelIds;
  }
  return [];
}

function permissionsFromRole(role: string): ARPermission {
  switch (role) {
    case 'owner':
      return { canEdit: true, canDelete: true, canInvite: true, canComment: true };
    case 'editor':
      return { canEdit: true, canDelete: false, canInvite: true, canComment: true };
    case 'viewer':
    default:
      return { canEdit: false, canDelete: false, canInvite: false, canComment: true };
  }
}

function mapToARProject(row: ProjectWithRelations, currentUserId?: string): ARProject {
  const modelIds = projectSettingsModelIds(row.settings);
  const memberList: ARProjectMember[] = row.members.map((m) => ({
    userId: m.userId,
    role: m.role as 'owner' | 'editor' | 'viewer',
    joinedAt: m.joinedAt,
  }));
  const currentMember = currentUserId ? memberList.find((m) => m.userId === currentUserId) : undefined;
  const permissions = currentMember ? permissionsFromRole(currentMember.role) : { canEdit: false, canDelete: false, canInvite: false, canComment: false };

  const comments: ARComment[] = (row.comments ?? []).map((c) => ({
    id: c.id,
    projectId: c.projectId,
    userId: c.userId,
    content: c.content,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    modelIds,
    members: memberList,
    comments,
    permissions,
    brandId: row.brandId,
    createdBy: row.ownerId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapToARComment(c: PrismaARProjectComment): ARComment {
  return {
    id: c.id,
    projectId: c.projectId,
    userId: c.userId,
    content: c.content,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

@Injectable()
export class ArCollaborationService {
  private readonly logger = new Logger(ArCollaborationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste tous les projets AR d'une marque
   */
  async listProjects(brandId: string, userId?: string): Promise<ARProject[]> {
    try {
      this.logger.log(`Listing AR projects for brand: ${brandId}`);

      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        throw new NotFoundException(`Brand ${brandId} not found`);
      }

      const where = userId
        ? { brandId, members: { some: { userId } } }
        : { brandId };

      const rows = await this.prisma.aRProject.findMany({
        where,
        include: {
          members: { include: { user: { select: { id: true } } } },
          comments: true,
          _count: { select: { comments: true } },
        },
      });

      return rows.map((row) => mapToARProject(row as ProjectWithRelations, userId));
    } catch (error) {
      this.logger.error(`Failed to list projects: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Récupère un projet par ID
   */
  async getProject(id: string, brandId: string, userId?: string): Promise<ARProject> {
    try {
      this.logger.log(`Getting AR project: ${id}`);

      const row = await this.prisma.aRProject.findFirst({
        where: { id, brandId },
        include: {
          members: { include: { user: { select: { id: true } } } },
          comments: true,
          _count: { select: { comments: true } },
        },
      });

      if (!row) {
        throw new NotFoundException(`Project ${id} not found`);
      }

      return mapToARProject(row as ProjectWithRelations, userId);
    } catch (error) {
      this.logger.error(`Failed to get project: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Crée un nouveau projet
   */
  async createProject(
    brandId: string,
    userId: string,
    data: Omit<ARProject, 'id' | 'brandId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'members' | 'comments'>,
  ): Promise<ARProject> {
    try {
      this.logger.log(`Creating AR project for brand: ${brandId}`);

      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        throw new NotFoundException(`Brand ${brandId} not found`);
      }

      const settings = data.modelIds?.length ? { modelIds: data.modelIds } : undefined;

      const project = await this.prisma.aRProject.create({
        data: {
          name: data.name,
          description: data.description ?? null,
          brandId,
          ownerId: userId,
          status: 'active',
          settings: settings ?? undefined,
          members: {
            create: { userId, role: 'owner' },
          },
        },
        include: {
          members: { include: { user: { select: { id: true } } } },
          comments: true,
          _count: { select: { comments: true } },
        },
      });

      return mapToARProject(project as ProjectWithRelations, userId);
    } catch (error) {
      this.logger.error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Met à jour un projet
   */
  async updateProject(
    id: string,
    brandId: string,
    userId: string,
    data: Partial<Omit<ARProject, 'id' | 'brandId' | 'createdBy' | 'createdAt' | 'members' | 'comments'>>,
  ): Promise<ARProject> {
    try {
      this.logger.log(`Updating AR project: ${id}`);

      const project = await this.getProject(id, brandId, userId);

      const member = project.members.find((m) => m.userId === userId);
      if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
        throw new ForbiddenException('Insufficient permissions');
      }

      const settings = data.modelIds !== undefined ? { modelIds: data.modelIds } : undefined;

      await this.prisma.aRProject.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description ?? null }),
          ...(settings !== undefined && { settings }),
        },
      });

      return this.getProject(id, brandId, userId);
    } catch (error) {
      this.logger.error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Supprime un projet
   */
  async deleteProject(id: string, brandId: string, userId: string): Promise<void> {
    try {
      this.logger.log(`Deleting AR project: ${id}`);

      const project = await this.getProject(id, brandId, userId);

      const member = project.members.find((m) => m.userId === userId);
      if (!member || member.role !== 'owner') {
        throw new ForbiddenException('Only project owner can delete the project');
      }

      await this.prisma.aRProject.delete({
        where: { id },
      });
    } catch (error) {
      this.logger.error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Ajoute un membre à un projet
   */
  async addMember(projectId: string, brandId: string, userId: string, newMember: { userId: string; role: 'editor' | 'viewer' }): Promise<ARProject> {
    try {
      this.logger.log(`Adding member to project: ${projectId}`);

      const project = await this.getProject(projectId, brandId, userId);

      const member = project.members.find((m) => m.userId === userId);
      if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
        throw new ForbiddenException('Insufficient permissions to invite members');
      }

      const existing = await this.prisma.aRProjectMember.findUnique({
        where: { projectId_userId: { projectId, userId: newMember.userId } },
      });
      if (existing) {
        throw new BadRequestException('Member already exists in project');
      }

      await this.prisma.aRProjectMember.create({
        data: {
          projectId,
          userId: newMember.userId,
          role: newMember.role,
        },
      });

      return this.getProject(projectId, brandId, userId);
    } catch (error) {
      this.logger.error(`Failed to add member: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Retire un membre d'un projet
   */
  async removeMember(projectId: string, brandId: string, userId: string, memberUserId: string): Promise<ARProject> {
    try {
      this.logger.log(`Removing member from project: ${projectId}`);

      const project = await this.getProject(projectId, brandId, userId);

      const member = project.members.find((m) => m.userId === userId);
      if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
        throw new ForbiddenException('Insufficient permissions to remove members');
      }

      const toRemove = project.members.find((m) => m.userId === memberUserId);
      if (!toRemove) {
        throw new NotFoundException('Member not found in project');
      }
      if (toRemove.role === 'owner') {
        throw new ForbiddenException('Cannot remove project owner');
      }

      await this.prisma.aRProjectMember.delete({
        where: { projectId_userId: { projectId, userId: memberUserId } },
      });

      return this.getProject(projectId, brandId, userId);
    } catch (error) {
      this.logger.error(`Failed to remove member: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Liste les commentaires d'un projet
   */
  async getComments(projectId: string, brandId: string): Promise<ARComment[]> {
    try {
      this.logger.log(`Getting comments for project: ${projectId}`);

      const project = await this.prisma.aRProject.findFirst({
        where: { id: projectId, brandId },
        select: { id: true },
      });

      if (!project) {
        throw new NotFoundException(`Project ${projectId} not found`);
      }

      const comments = await this.prisma.aRProjectComment.findMany({
        where: { projectId },
        include: { user: { select: { id: true } } },
        orderBy: { createdAt: 'asc' },
      });

      return comments.map(mapToARComment);
    } catch (error) {
      this.logger.error(`Failed to get comments: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Ajoute un commentaire à un projet
   */
  async addComment(
    projectId: string,
    brandId: string,
    userId: string,
    data: Omit<ARComment, 'id' | 'projectId' | 'userId' | 'createdAt' | 'updatedAt'>,
  ): Promise<ARComment> {
    try {
      this.logger.log(`Adding comment to project: ${projectId}`);

      const project = await this.getProject(projectId, brandId, userId);

      const member = project.members.find((m) => m.userId === userId);
      if (!member) {
        throw new ForbiddenException('User is not a member of this project');
      }

      const comment = await this.prisma.aRProjectComment.create({
        data: {
          projectId,
          userId,
          content: data.content,
        },
      });

      return mapToARComment(comment);
    } catch (error) {
      this.logger.error(`Failed to add comment: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}
