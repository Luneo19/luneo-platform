/**
 * ★★★ SERVICE - EDITOR ★★★
 * Service NestJS pour l'éditeur de designs
 * Respecte la Bible Luneo : pas de any, types stricts, logging professionnel
 * Projects are stored in Project table (type DESIGN), not in Brand.metadata.
 */

import { PrismaService } from '@/libs/prisma/prisma.service';
import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProjectType, ProjectStatus } from '@prisma/client';

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

/** Stored in Project.settings */
interface EditorProjectSettings {
  canvas?: EditorCanvas;
  layers?: EditorLayer[];
}

/** Stored in Project.metadata for editor projects */
interface EditorProjectMetadata {
  userId?: string;
  history?: EditorHistoryEntry[];
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

const DEFAULT_CANVAS: EditorCanvas = {
  width: 800,
  height: 600,
  units: 'px',
};

@Injectable()
export class EditorService {
  private readonly logger = new Logger(EditorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Maps a Prisma Project (type DESIGN) to EditorProject
   */
  private toEditorProject(p: {
    id: string;
    name: string;
    description: string | null;
    settings: unknown;
    metadata: unknown;
    brandId: string;
    createdAt: Date;
    updatedAt: Date;
  }): EditorProject {
    const settings = (p.settings as EditorProjectSettings) || {};
    const meta = (p.metadata as EditorProjectMetadata) || {};
    return {
      id: p.id,
      name: p.name,
      description: p.description ?? undefined,
      canvas: settings.canvas ?? DEFAULT_CANVAS,
      layers: settings.layers ?? [],
      history: meta.history ?? [],
      brandId: p.brandId,
      userId: meta.userId ?? '',
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  /**
   * Liste tous les projets d'édition d'une marque
   */
  async listProjects(brandId: string, userId?: string): Promise<EditorProject[]> {
    try {
      this.logger.log(`Listing editor projects for brand: ${brandId}`);

      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
      });
      if (!brand) {
        throw new NotFoundException(`Brand ${brandId} not found`);
      }

      const projects = await this.prisma.project.findMany({
        where: {
          brandId,
          type: ProjectType.DESIGN,
          deletedAt: null,
        },
        orderBy: { updatedAt: 'desc' },
      });

      const mapped = projects.map((p) => this.toEditorProject(p));

      if (userId) {
        return mapped.filter((p) => p.userId === userId);
      }
      return mapped;
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

      const project = await this.prisma.project.findFirst({
        where: {
          id,
          brandId,
          type: ProjectType.DESIGN,
          deletedAt: null,
        },
      });

      if (!project) {
        throw new NotFoundException(`Project ${id} not found`);
      }

      return this.toEditorProject(project);
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

      const slug = `editor-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const project = await this.prisma.project.create({
        data: {
          brandId,
          name: data.name,
          slug,
          description: data.description ?? null,
          type: ProjectType.DESIGN,
          status: ProjectStatus.DRAFT,
          settings: {
            canvas: data.canvas ?? DEFAULT_CANVAS,
            layers: data.layers ?? [],
          } as object,
          metadata: {
            userId,
            history: [],
          } as object,
        },
      });

      return this.toEditorProject(project);
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

      if (project.userId !== userId) {
        throw new ForbiddenException('User is not the owner of this project');
      }

      const settings: EditorProjectSettings = {
        canvas: data.canvas ?? project.canvas,
        layers: data.layers ?? project.layers,
      };
      const updateData: {
        name?: string;
        description?: string | null;
        settings?: object;
      } = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description ?? null;
      updateData.settings = settings as object;

      const updated = await this.prisma.project.update({
        where: { id },
        data: updateData,
      });

      return this.toEditorProject(updated);
    } catch (error) {
      this.logger.error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Supprime un projet (soft delete)
   */
  async deleteProject(id: string, brandId: string, userId: string): Promise<void> {
    try {
      this.logger.log(`Deleting editor project: ${id}`);

      const project = await this.getProject(id, brandId);

      if (project.userId !== userId) {
        throw new ForbiddenException('User is not the owner of this project');
      }

      await this.prisma.project.update({
        where: { id },
        data: { deletedAt: new Date(), status: ProjectStatus.DELETED },
      });
    } catch (error) {
      this.logger.error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  /**
   * Exporte un projet. Pour l'instant retourne le JSON du projet (téléchargeable).
   * PDF/image (png, jpg, svg, pdf) pourront être ajoutés plus tard (rendering canvas, conversion, upload).
   */
  async exportProject(
    id: string,
    brandId: string,
    format: 'png' | 'jpg' | 'svg' | 'pdf',
  ): Promise<{ format: string; data: EditorProject; filename: string }> {
    try {
      this.logger.log(`Exporting editor project: ${id} as ${format}`);

      const project = await this.getProject(id, brandId);

      // Basic export: return project as JSON for download (PDF/image export can be added later)
      const safeName = project.name.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 80);
      const filename = `${safeName}-export.json`;

      return {
        format: 'json',
        data: project,
        filename,
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
        throw new ForbiddenException('User is not the owner of this project');
      }

      const newEntry: EditorHistoryEntry = {
        id: `history-${Date.now()}`,
        ...entry,
        timestamp: new Date(),
      };

      const history = [...project.history, newEntry].slice(-50);

      const updated = await this.prisma.project.update({
        where: { id },
        data: {
          metadata: {
            userId: project.userId,
            history,
          } as object,
        },
      });

      return this.toEditorProject(updated);
    } catch (error) {
      this.logger.error(`Failed to add history entry: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }
}

