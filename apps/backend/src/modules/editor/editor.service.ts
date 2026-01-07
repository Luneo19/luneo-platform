/**
 * ★★★ SERVICE - EDITOR ★★★
 * Service NestJS pour l'éditeur de designs
 * Respecte la Bible Luneo : pas de any, types stricts, logging professionnel
 */

import { PrismaService } from '@/libs/prisma/prisma.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export interface EditorProject {
  id: string;
  name: string;
  description?: string;
  canvas: EditorCanvas;
  layers: EditorLayer[];
  history: EditorHistoryEntry[];
  brandId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EditorCanvas {
  width: number;
  height: number;
  backgroundColor?: string;
  units: 'px' | 'mm' | 'in';
}

export interface EditorLayer {
  id: string;
  type: 'text' | 'image' | 'shape' | 'group';
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  transform: {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
  };
  properties: Record<string, unknown>;
  children?: EditorLayer[];
}

export interface EditorHistoryEntry {
  id: string;
  action: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

@Injectable()
export class EditorService {
  private readonly logger = new Logger(EditorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liste tous les projets d'édition d'une marque
   */
  async listProjects(brandId: string, userId?: string): Promise<EditorProject[]> {
    try {
      this.logger.log(`Listing editor projects for brand: ${brandId}`);

      // Pour l'instant, utiliser la table Brand.metadata pour stocker les projets
      // TODO: Créer une table dédiée EditorProject dans Prisma
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        throw new NotFoundException(`Brand ${brandId} not found`);
      }

      const metadata = ((brand as unknown as { metadata?: Record<string, unknown> }).metadata) || {};
      const projects = (metadata.editorProjects as EditorProject[]) || [];

      // Filtrer par utilisateur si spécifié
      if (userId) {
        return projects.filter((p) => p.userId === userId);
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
  async getProject(id: string, brandId: string): Promise<EditorProject> {
    try {
      this.logger.log(`Getting editor project: ${id}`);

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
  async createProject(brandId: string, userId: string, data: Omit<EditorProject, 'id' | 'brandId' | 'userId' | 'createdAt' | 'updatedAt' | 'history' | 'layers'> & { layers?: EditorLayer[] }): Promise<EditorProject> {
    try {
      this.logger.log(`Creating editor project for brand: ${brandId}`);

      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        throw new NotFoundException(`Brand ${brandId} not found`);
      }

      const metadata = ((brand as unknown as { metadata?: Record<string, unknown> }).metadata) || {};
      const projects = (metadata.editorProjects as EditorProject[]) || [];

      const newProject: EditorProject = {
        id: `editor-project-${Date.now()}`,
        ...data,
        layers: data.layers || [],
        history: [],
        brandId,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      projects.push(newProject);

      await this.prisma.brand.update({
        where: { id: brandId },
        data: {
          metadata: {
            ...metadata,
            editorProjects: projects,
          } as Record<string, unknown>,
        } as unknown as Prisma.BrandUpdateInput,
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
  async updateProject(id: string, brandId: string, userId: string, data: Partial<Omit<EditorProject, 'id' | 'brandId' | 'userId' | 'createdAt' | 'history'>>): Promise<EditorProject> {
    try {
      this.logger.log(`Updating editor project: ${id}`);

      const project = await this.getProject(id, brandId);

      // Vérifier que l'utilisateur est le propriétaire
      if (project.userId !== userId) {
        throw new Error('User is not the owner of this project');
      }

      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        throw new NotFoundException(`Brand ${brandId} not found`);
      }

      const metadata = ((brand as unknown as { metadata?: Record<string, unknown> }).metadata) || {};
      const projects = (metadata.editorProjects as EditorProject[]) || [];

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
            editorProjects: projects,
          } as Record<string, unknown>,
        } as unknown as Prisma.BrandUpdateInput,
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
      this.logger.log(`Deleting editor project: ${id}`);

      const project = await this.getProject(id, brandId);

      // Vérifier que l'utilisateur est le propriétaire
      if (project.userId !== userId) {
        throw new Error('User is not the owner of this project');
      }

      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        throw new NotFoundException(`Brand ${brandId} not found`);
      }

      const metadata = ((brand as unknown as { metadata?: Record<string, unknown> }).metadata) || {};
      const projects = (metadata.editorProjects as EditorProject[]) || [];

      const filtered = projects.filter((p) => p.id !== id);

      if (filtered.length === projects.length) {
        throw new NotFoundException(`Project ${id} not found`);
      }

      await this.prisma.brand.update({
        where: { id: brandId },
        data: {
          metadata: {
            ...metadata,
            editorProjects: filtered,
          },
        } as unknown as Prisma.BrandUpdateInput,
      });
    } catch (error) {
      this.logger.error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Exporte un projet dans un format spécifique
   */
  async exportProject(id: string, brandId: string, format: 'png' | 'jpg' | 'svg' | 'pdf'): Promise<{ url: string; format: string }> {
    try {
      this.logger.log(`Exporting editor project: ${id} as ${format}`);

      const project = await this.getProject(id, brandId);

      // TODO: Implémenter l'export réel (rendering canvas, conversion, upload)
      // Pour l'instant, retourner une URL mockée
      const exportUrl = `https://storage.example.com/exports/${project.id}.${format}`;

      return {
        url: exportUrl,
        format,
      };
    } catch (error) {
      this.logger.error(`Failed to export project: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Ajoute une entrée à l'historique (pour undo/redo)
   */
  async addHistoryEntry(id: string, brandId: string, userId: string, entry: Omit<EditorHistoryEntry, 'id' | 'timestamp'>): Promise<EditorProject> {
    try {
      this.logger.log(`Adding history entry to project: ${id}`);

      const project = await this.getProject(id, brandId);

      if (project.userId !== userId) {
        throw new Error('User is not the owner of this project');
      }

      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        throw new NotFoundException(`Brand ${brandId} not found`);
      }

      const metadata = ((brand as unknown as { metadata?: Record<string, unknown> }).metadata) || {};
      const projects = (metadata.editorProjects as EditorProject[]) || [];

      const index = projects.findIndex((p) => p.id === id);
      if (index === -1) {
        throw new NotFoundException(`Project ${id} not found`);
      }

      const newEntry: EditorHistoryEntry = {
        id: `history-${Date.now()}`,
        ...entry,
        timestamp: new Date(),
      };

      // Limiter l'historique à 50 entrées
      projects[index].history.push(newEntry);
      if (projects[index].history.length > 50) {
        projects[index].history = projects[index].history.slice(-50);
      }

      await this.prisma.brand.update({
        where: { id: brandId },
        data: {
          metadata: {
            ...metadata,
            editorProjects: projects,
          } as Record<string, unknown>,
        } as unknown as Prisma.BrandUpdateInput,
      });

      return projects[index];
    } catch (error) {
      this.logger.error(`Failed to add history entry: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}

