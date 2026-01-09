import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, options?: { page?: number; limit?: number; type?: string }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (options?.type) {
      where.resourceType = options.type;
    }

    const [favorites, total] = await Promise.all([
      this.prisma.libraryFavorite.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.libraryFavorite.count({ where }),
    ]);

    return {
      favorites,
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

  async create(data: { resourceId: string; resourceType: string }, userId: string) {
    // Check if favorite already exists
    const existing = await this.prisma.libraryFavorite.findUnique({
      where: {
        userId_resourceId_resourceType: {
          userId,
          resourceId: data.resourceId,
          resourceType: data.resourceType,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Resource already in favorites');
    }

    return this.prisma.libraryFavorite.create({
      data: {
        userId,
        resourceId: data.resourceId,
        resourceType: data.resourceType,
      },
    });
  }

  async delete(id: string, userId: string) {
    const favorite = await this.prisma.libraryFavorite.findUnique({
      where: { id },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    if (favorite.userId !== userId) {
      throw new NotFoundException('Favorite not found');
    }

    await this.prisma.libraryFavorite.delete({
      where: { id },
    });

    return { success: true, message: 'Favorite deleted successfully' };
  }
}
