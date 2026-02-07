/**
 * SERVICE - COLLABORATION
 * Service pour la collaboration (partage, commentaires)
 * Uses Prisma SharedResource and Comment models
 */

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import {
  SharedResource,
  ResourceType,
  Permission,
  Comment,
} from '../interfaces/collaboration.interface';
import { randomBytes } from 'crypto';

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ========================================
  // RESSOURCES PARTAGÉES
  // ========================================

  /**
   * Partage une ressource avec d'autres utilisateurs
   */
  async shareResource(
    createdBy: string,
    brandId: string,
    resourceType: ResourceType,
    resourceId: string,
    sharedWith: string[],
    permissions: Record<string, Permission[]>,
    isPublic: boolean = false,
  ): Promise<SharedResource> {
    this.logger.log(`Sharing resource ${resourceType}:${resourceId} by user: ${createdBy}`);

    const publicToken = isPublic ? randomBytes(32).toString('hex') : null;

    const record = await this.prisma.sharedResource.create({
      data: {
        resourceType: resourceType as any,
        resourceId,
        sharedWith,
        permissions: permissions as any,
        isPublic,
        publicToken,
        createdBy,
        brandId,
      },
    });

    return this.mapToSharedResource(record);
  }

  /**
   * Récupère les ressources partagées avec un utilisateur
   */
  async getSharedResources(userId: string, brandId: string): Promise<SharedResource[]> {
    this.logger.log(`Getting shared resources for user: ${userId}, brand: ${brandId}`);

    const records = await this.prisma.sharedResource.findMany({
      where: {
        brandId,
        OR: [
          { sharedWith: { has: userId } },
          { createdBy: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.mapToSharedResource(r));
  }

  /**
   * Met à jour les permissions d'une ressource partagée
   */
  async updatePermissions(
    resourceId: string,
    userId: string,
    brandId: string,
    permissions: Record<string, Permission[]>,
  ): Promise<SharedResource> {
    this.logger.log(`Updating permissions for resource: ${resourceId}`);

    // Verify ownership
    const existing = await this.prisma.sharedResource.findFirst({
      where: { id: resourceId, brandId },
    });

    if (!existing) {
      throw new NotFoundException(`Shared resource ${resourceId} not found`);
    }

    if (existing.createdBy !== userId) {
      throw new ForbiddenException('Only the resource owner can update permissions');
    }

    const record = await this.prisma.sharedResource.update({
      where: { id: resourceId },
      data: {
        sharedWith: Object.keys(permissions),
        permissions: permissions as any,
      },
    });

    return this.mapToSharedResource(record);
  }

  /**
   * Vérifie si un utilisateur a accès à une ressource
   */
  async checkAccess(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    requiredPermission: Permission,
  ): Promise<boolean> {
    const record = await this.prisma.sharedResource.findFirst({
      where: {
        resourceType: resourceType as any,
        resourceId,
        OR: [
          { sharedWith: { has: userId } },
          { createdBy: userId },
          { isPublic: true },
        ],
      },
    });

    if (!record) return false;

    // Owner always has full access
    if (record.createdBy === userId) return true;

    // Public resources grant view access
    if (record.isPublic && requiredPermission === 'view') return true;

    // Check specific permissions
    const perms = record.permissions as Record<string, string[]>;
    const userPerms = perms[userId] || [];
    return userPerms.includes(requiredPermission);
  }

  // ========================================
  // COMMENTAIRES
  // ========================================

  /**
   * Ajoute un commentaire sur une ressource
   */
  async addComment(
    authorId: string,
    resourceType: ResourceType,
    resourceId: string,
    content: string,
    parentId?: string,
    sharedResourceId?: string,
  ): Promise<Comment> {
    this.logger.log(`Adding comment on ${resourceType}:${resourceId} by user: ${authorId}`);

    // Validate parent exists if provided
    if (parentId) {
      const parent = await this.prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent) {
        throw new NotFoundException(`Parent comment ${parentId} not found`);
      }
    }

    const record = await this.prisma.comment.create({
      data: {
        resourceType: resourceType as any,
        resourceId,
        content,
        parentId,
        authorId,
        sharedResourceId,
      },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return this.mapToComment(record);
  }

  /**
   * Récupère les commentaires d'une ressource
   */
  async getComments(
    resourceType: ResourceType,
    resourceId: string,
    sharedResourceId?: string,
  ): Promise<Comment[]> {
    this.logger.log(`Getting comments for ${resourceType}:${resourceId}`);

    const where: any = {
      resourceType: resourceType as any,
      resourceId,
      parentId: null, // Only top-level comments
    };

    if (sharedResourceId) {
      where.sharedResourceId = sharedResourceId;
    }

    const records = await this.prisma.comment.findMany({
      where,
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.mapToComment(r));
  }

  /**
   * Supprime un commentaire
   */
  async deleteComment(commentId: string, userId: string): Promise<void> {
    this.logger.log(`Deleting comment: ${commentId} by user: ${userId}`);

    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(`Comment ${commentId} not found`);
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('Only the comment author can delete it');
    }

    // Cascade deletes replies via Prisma relation config
    await this.prisma.comment.delete({
      where: { id: commentId },
    });
  }

  // ========================================
  // MAPPERS
  // ========================================

  private mapToSharedResource(record: any): SharedResource {
    return {
      id: record.id,
      resourceType: record.resourceType as ResourceType,
      resourceId: record.resourceId,
      sharedWith: record.sharedWith || [],
      permissions: (record.permissions as Record<string, Permission[]>) || {},
      isPublic: record.isPublic,
      publicToken: record.publicToken || undefined,
      createdBy: record.createdBy,
      brandId: record.brandId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private mapToComment(record: any): Comment {
    const comment: Comment = {
      id: record.id,
      resourceType: record.resourceType as ResourceType,
      resourceId: record.resourceId,
      content: record.content,
      parentId: record.parentId || undefined,
      authorId: record.authorId,
      author: {
        id: record.author.id,
        name: `${record.author.firstName || ''} ${record.author.lastName || ''}`.trim() || 'Unknown',
        email: record.author.email,
      },
      sharedResourceId: record.sharedResourceId || undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    if (record.replies?.length > 0) {
      comment.replies = record.replies.map((r: any) => this.mapToComment(r));
    }

    return comment;
  }
}
