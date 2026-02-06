import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrentUser } from '@/common/types/user.types';

@Injectable()
export class CollectionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, brandId: string, options?: { includePublic?: boolean; page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      brandId,
    };

    if (!options?.includePublic) {
      where.isPublic = false;
    }

    const [collections, total] = await Promise.all([
      this.prisma.designCollection.findMany({
        where,
        include: {
          items: {
            take: 5, // Limit items for list view
            include: {
              design: {
                select: {
                  id: true,
                  name: true,
                  previewUrl: true,
                  imageUrl: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.designCollection.count({ where }),
    ]);

    return {
      collections,
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

  /**
   * PERF-02: Pagination ajoutée sur les items de collection
   * Les collections avec beaucoup d'items ne chargent plus tout d'un coup
   */
  async findOne(
    id: string, 
    userId: string, 
    brandId: string,
    options?: {
      itemsPage?: number;
      itemsLimit?: number;
    }
  ) {
    const itemsPage = options?.itemsPage || 1;
    const itemsLimit = Math.min(options?.itemsLimit || 50, 100);
    const itemsSkip = (itemsPage - 1) * itemsLimit;

    const collection = await this.prisma.designCollection.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            design: {
              select: {
                id: true,
                name: true,
                description: true,
                previewUrl: true,
                imageUrl: true,
                status: true,
                createdAt: true,
              },
            },
            addedByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { order: 'asc' },
          skip: itemsSkip,
          take: itemsLimit,
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    if (collection.userId !== userId || collection.brandId !== brandId) {
      throw new ForbiddenException('Access denied to this collection');
    }

    // PERF-02: Retourner les infos de pagination
    return {
      ...collection,
      pagination: {
        items: {
          page: itemsPage,
          limit: itemsLimit,
          total: collection._count.items,
          totalPages: Math.ceil(collection._count.items / itemsLimit),
          hasNext: itemsPage * itemsLimit < collection._count.items,
          hasPrev: itemsPage > 1,
        },
      },
    };
  }

  async create(data: { name: string; description?: string; isPublic?: boolean; coverImage?: string }, userId: string, brandId: string) {
    return this.prisma.designCollection.create({
      data: {
        name: data.name,
        description: data.description,
        isPublic: data.isPublic || false,
        coverImage: data.coverImage,
        userId,
        brandId,
      },
      include: {
        items: true,
      },
    });
  }

  async update(id: string, data: { name?: string; description?: string; isPublic?: boolean; coverImage?: string }, userId: string, brandId: string) {
    const collection = await this.findOne(id, userId, brandId);

    return this.prisma.designCollection.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
      },
      include: {
        items: {
          take: 5,
          include: {
            design: {
              select: {
                id: true,
                name: true,
                previewUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async delete(id: string, userId: string, brandId: string) {
    const collection = await this.findOne(id, userId, brandId);

    await this.prisma.designCollection.delete({
      where: { id },
    });

    return { success: true, message: 'Collection deleted successfully' };
  }

  async addItem(collectionId: string, designId: string, notes: string | undefined, userId: string, brandId: string) {
    const collection = await this.findOne(collectionId, userId, brandId);

    // Check if design exists and belongs to brand
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      select: { id: true, brandId: true },
    });

    if (!design) {
      throw new NotFoundException('Design not found');
    }

    if (design.brandId !== brandId) {
      throw new ForbiddenException('Design does not belong to this brand');
    }

    // Check if item already exists
    const existingItem = await this.prisma.designCollectionItem.findUnique({
      where: {
        collectionId_designId: {
          collectionId,
          designId,
        },
      },
    });

    if (existingItem) {
      throw new BadRequestException('Design already in collection');
    }

    // Get max order
    const maxOrder = await this.prisma.designCollectionItem.findFirst({
      where: { collectionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const item = await this.prisma.designCollectionItem.create({
      data: {
        collectionId,
        designId,
        notes: notes || null,
        addedBy: userId,
        order: (maxOrder?.order || 0) + 1,
      },
      include: {
        design: {
          select: {
            id: true,
            name: true,
            previewUrl: true,
            imageUrl: true,
          },
        },
      },
    });

    // Update collection item count
    await this.prisma.designCollection.update({
      where: { id: collectionId },
      data: {
        itemCount: {
          increment: 1,
        },
      },
    });

    return item;
  }

  async removeItem(collectionId: string, designId: string, userId: string, brandId: string) {
    const collection = await this.findOne(collectionId, userId, brandId);

    const item = await this.prisma.designCollectionItem.findUnique({
      where: {
        collectionId_designId: {
          collectionId,
          designId,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found in collection');
    }

    await this.prisma.designCollectionItem.delete({
      where: {
        collectionId_designId: {
          collectionId,
          designId,
        },
      },
    });

    // Update collection item count
    await this.prisma.designCollection.update({
      where: { id: collectionId },
      data: {
        itemCount: {
          decrement: 1,
        },
      },
    });

    return { success: true, message: 'Item removed from collection' };
  }
}
