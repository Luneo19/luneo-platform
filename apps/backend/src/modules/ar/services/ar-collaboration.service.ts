/**
 * ★★★ SERVICE - AR COLLABORATION ★★★
 * Service NestJS pour la collaboration AR (projets, commentaires, permissions)
 * Respecte la Bible Luneo : pas de any, types stricts, logging professionnel
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

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

      // Pour l'instant, utiliser la table Brand.metadata pour stocker les projets
      // TODO: Créer une table dédiée ARProject dans Prisma
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        throw new NotFoundException(`Brand ${brandId} not found`);
      }

      const metadata = ((brand as unknown as { metadata?: Record<string, unknown> }).metadata) || {};
      const projects = (metadata.arProjects as ARProject[]) || [];

      // Filtrer par utilisateur si spécifié
      if (userId) {
        return projects.filter((p) =>
          p.members.some((m) => m.userId === userId),
        );
      }

      return projects;
    } catch (error) {
      this.logger.error(`Failed to list projects: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Récupère un projet par ID
   */
  async getProject(id: string, brandId: string): Promise<ARProject> {
    try {
      this.logger.log(`Getting AR project: ${id}`);

      const projects = await this.listProjects(brandId);
      const project = projects.find((p) => p.id === id);

      if (!project) {
        throw new NotFoundException(`Project ${id} not found`);
      }

      return project;
    } catch (error) {
      this.logger.error(`Failed to get project: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Crée un nouveau projet
   */
  async createProject(brandId: string, userId: string, data: Omit<ARProject, 'id' | 'brandId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'members' | 'comments'>): Promise<ARProject> {
    try {
      this.logger.log(`Creating AR project for brand: ${brandId}`);

      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        throw new NotFoundException(`Brand ${brandId} not found`);
      }

      const metadata = ((brand as unknown as { metadata?: Record<string, unknown> }).metadata) || {};
      const projects = (metadata.arProjects as ARProject[]) || [];

      const newProject: ARProject = {
        id: `project-${Date.now()}`,
        ...data,
        members: [
          {
            userId,
            role: 'owner',
            joinedAt: new Date(),
          },
        ],
        comments: [],
        brandId,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      projects.push(newProject);

      await this.prisma.brand.update({
        where: { id: brandId },
        data: {
          metadata: {
            ...metadata,
            arProjects: projects,
          } as Record<string, unknown>,
        },
      });

      return newProject;
    } catch (error) {
      this.logger.error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Met à jour un projet
   */
  async updateProject(id: string, brandId: string, userId: string, data: Partial<Omit<ARProject, 'id' | 'brandId' | 'createdBy' | 'createdAt' | 'members' | 'comments'>>): Promise<ARProject> {
    try {
      this.logger.log(`Updating AR project: ${id}`);

      const project = await this.getProject(id, brandId);

      // Vérifier les permissions
      const member = project.members.find((m) => m.userId === userId);
      if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
        throw new Error('Insufficient permissions');
      }

      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        throw new NotFoundException(`Brand ${brandId} not found`);
      }

      const metadata = ((brand as unknown as { metadata?: Record<string, unknown> }).metadata) || {};
      const projects = (metadata.arProjects as ARProject[]) || [];

      const index = projects.findIndex((p) => p.id === id);
      if (index === -1) {
        throw new NotFoundException(`Project ${id} not found`);
      }

      projects[index] = {
        ...projects[index],
        ...data,
        updatedAt: new Date(),
      };

      await this.prisma.brand.update({
        where: { id: brandId },
        data: {
          metadata: {
            ...metadata,
            arProjects: projects,
          } as Record<string, unknown>,
        },
      });

      return projects[index];
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

      const project = await this.getProject(id, brandId);

      // Vérifier les permissions (seul le owner peut supprimer)
      const member = project.members.find((m) => m.userId === userId);
      if (!member || member.role !== 'owner') {
        throw new Error('Only project owner can delete the project');
      }

      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        throw new NotFoundException(`Brand ${brandId} not found`);
      }

      const metadata = ((brand as unknown as { metadata?: Record<string, unknown> }).metadata) || {};
      const projects = (metadata.arProjects as ARProject[]) || [];

      const filtered = projects.filter((p) => p.id !== id);

      if (filtered.length === projects.length) {
        throw new NotFoundException(`Project ${id} not found`);
      }

      await this.prisma.brand.update({
        where: { id: brandId },
        data: {
          metadata: {
            ...metadata,
            arProjects: filtered,
          } as Record<string, unknown>,
        },
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

      const project = await this.getProject(projectId, brandId);

      // Vérifier les permissions (seul owner/editor peut inviter)
      const member = project.members.find((m) => m.userId === userId);
      if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
        throw new Error('Insufficient permissions to invite members');
      }

      // Vérifier que le membre n'existe pas déjà
      if (project.members.some((m) => m.userId === newMember.userId)) {
        throw new Error('Member already exists in project');
      }

      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        throw new NotFoundException(`Brand ${brandId} not found`);
      }

      const metadata = ((brand as unknown as { metadata?: Record<string, unknown> }).metadata) || {};
      const projects = (metadata.arProjects as ARProject[]) || [];

      const index = projects.findIndex((p) => p.id === projectId);
      if (index === -1) {
        throw new NotFoundException(`Project ${projectId} not found`);
      }

      projects[index].members.push({
        ...newMember,
        joinedAt: new Date(),
      });

      await this.prisma.brand.update({
        where: { id: brandId },
        data: {
          metadata: {
            ...metadata,
            arProjects: projects,
          } as Record<string, unknown>,
        },
      });

      return projects[index];
    } catch (error) {
      this.logger.error(`Failed to add member: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Ajoute un commentaire à un projet
   */
  async addComment(projectId: string, brandId: string, userId: string, data: Omit<ARComment, 'id' | 'projectId' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<ARComment> {
    try {
      this.logger.log(`Adding comment to project: ${projectId}`);

      const project = await this.getProject(projectId, brandId);

      // Vérifier que l'utilisateur est membre
      const member = project.members.find((m) => m.userId === userId);
      if (!member) {
        throw new Error('User is not a member of this project');
      }

      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        throw new NotFoundException(`Brand ${brandId} not found`);
      }

      const metadata = ((brand as unknown as { metadata?: Record<string, unknown> }).metadata) || {};
      const projects = (metadata.arProjects as ARProject[]) || [];

      const index = projects.findIndex((p) => p.id === projectId);
      if (index === -1) {
        throw new NotFoundException(`Project ${projectId} not found`);
      }

      const newComment: ARComment = {
        id: `comment-${Date.now()}`,
        projectId,
        userId,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      projects[index].comments.push(newComment);

      await this.prisma.brand.update({
        where: { id: brandId },
        data: {
          metadata: {
            ...metadata,
            arProjects: projects,
          } as Record<string, unknown>,
        },
      });

      return newComment;
    } catch (error) {
      this.logger.error(`Failed to add comment: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}


