import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export type DownloadResourceType = 'design' | 'template' | 'clipart' | 'product';

export interface CreateDownloadInput {
  resourceId: string;
  resourceType: DownloadResourceType;
  fileUrl?: string;
  fileSize?: number;
  format?: string;
}

export interface ListDownloadsQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  type?: DownloadResourceType;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class DownloadsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, query: ListDownloadsQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const sortBy = query.sortBy ?? 'downloadedAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const where: any = { userId };
    if (query.type) {
      where.resourceType = query.type;
    }
    if (query.startDate) {
      where.downloadedAt = { ...where.downloadedAt, gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      where.downloadedAt = { ...where.downloadedAt, lte: new Date(query.endDate) };
    }

    const [downloads, total] = await Promise.all([
      this.prisma.download.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.download.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      downloads,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async record(userId: string, input: CreateDownloadInput) {
    const download = await this.prisma.download.create({
      data: {
        userId,
        resourceId: input.resourceId,
        resourceType: input.resourceType,
        fileUrl: input.fileUrl ?? null,
        fileSize: input.fileSize ?? null,
        format: input.format ?? null,
      },
    });
    return { download };
  }
}
