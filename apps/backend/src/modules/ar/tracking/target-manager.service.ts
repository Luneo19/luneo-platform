/**
 * Target Manager - Manage image target library per project.
 */

import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { TrackingQuality } from '@prisma/client';

export interface ListTargetsOptions {
  projectId: string;
  brandId: string;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}

@Injectable()
export class TargetManagerService {
  private readonly logger = new Logger(TargetManagerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async assertProjectAccess(projectId: string, brandId: string): Promise<void> {
    const project = await this.prisma.aRProject.findFirst({
      where: { id: projectId, brandId },
    });
    if (!project) {
      throw new ForbiddenException('Project not found or access denied');
    }
  }

  async listTargets(options: ListTargetsOptions) {
    await this.assertProjectAccess(options.projectId, options.brandId);

    const where: { projectId: string; isActive?: boolean } = {
      projectId: options.projectId,
    };
    if (!options.includeInactive) {
      where.isActive = true;
    }

    const limit = Math.min(options.limit ?? 50, 100);
    const offset = options.offset ?? 0;

    const [targets, total] = await Promise.all([
      this.prisma.aRImageTarget.findMany({
        where,
        include: {
          linkedModel: { select: { id: true, name: true, thumbnailURL: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.aRImageTarget.count({ where }),
    ]);

    return {
      targets,
      pagination: { total, limit, offset, totalPages: Math.ceil(total / limit) },
    };
  }

  async getTargetById(id: string, brandId: string) {
    const target = await this.prisma.aRImageTarget.findFirst({
      where: {
        id,
        project: { brandId },
      },
      include: {
        linkedModel: { select: { id: true, name: true, thumbnailURL: true, originalFormat: true } },
        project: { select: { id: true, name: true } },
      },
    });
    if (!target) {
      throw new NotFoundException('Image target not found');
    }
    return target;
  }

  async countByProject(projectId: string, brandId: string): Promise<number> {
    await this.assertProjectAccess(projectId, brandId);
    return this.prisma.aRImageTarget.count({
      where: { projectId, isActive: true },
    });
  }

  mapQualityToEnum(quality: TrackingQuality): TrackingQuality {
    return quality;
  }
}
