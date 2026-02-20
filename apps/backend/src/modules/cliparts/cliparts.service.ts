import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class ClipartsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, brandId: string | null, options?: { page?: number; limit?: number; category?: string; search?: string; publicOnly?: boolean }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: import('@prisma/client').Prisma.ClipartWhereInput = {};

    // Filter by public or user's cliparts
    if (options?.publicOnly) {
      where.isPublic = true;
    } else {
      where.OR = [
        { isPublic: true },
        { userId },
        ...(brandId ? [{ brandId }] : []),
      ];
    }

    // Filter by category
    if (options?.category) {
      where.category = options.category;
    }

    // Search filter
    if (options?.search) {
      where.OR = [
        ...(where.OR || []),
        { name: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
        { tags: { has: options.search } },
      ];
    }

    const [cliparts, total] = await Promise.all([
      this.prisma.clipart.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.clipart.count({ where }),
    ]);

    return {
      cliparts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string, userId: string, brandId: string | null) {
    const clipart = await this.prisma.clipart.findUnique({
      where: { id },
    });

    if (!clipart) {
      throw new NotFoundException('Clipart not found');
    }

    // Check access: public, user's, or brand's
    if (!clipart.isPublic && clipart.userId !== userId && clipart.brandId !== brandId) {
      throw new ForbiddenException('Access denied to this clipart');
    }

    return clipart;
  }

  async create(data: {
    name: string;
    description?: string;
    category: string;
    tags?: string[];
    url: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    fileSize?: number;
    isPublic?: boolean;
  }, userId: string, brandId: string | null) {
    return this.prisma.clipart.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        tags: data.tags || [],
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        width: data.width,
        height: data.height,
        fileSize: data.fileSize,
        isPublic: data.isPublic || false,
        userId,
        brandId,
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    description?: string;
    category?: string;
    tags?: string[];
    isPublic?: boolean;
  }, userId: string, brandId: string | null) {
    const clipart = await this.findOne(id, userId, brandId);

    // Check ownership
    if (clipart.userId !== userId && clipart.brandId !== brandId) {
      throw new ForbiddenException('Only owner can update clipart');
    }

    return this.prisma.clipart.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      },
    });
  }

  async delete(id: string, userId: string, brandId: string | null) {
    const clipart = await this.findOne(id, userId, brandId);

    // Check ownership
    if (clipart.userId !== userId && clipart.brandId !== brandId) {
      throw new ForbiddenException('Only owner can delete clipart');
    }

    await this.prisma.clipart.delete({
      where: { id },
    });

    return { success: true, message: 'Clipart deleted successfully' };
  }
}
