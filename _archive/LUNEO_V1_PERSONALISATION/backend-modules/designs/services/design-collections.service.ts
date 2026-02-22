import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type { CreateDesignCollectionDto } from '../dto/create-design-collection.dto';
import type { UpdateDesignCollectionDto } from '../dto/update-design-collection.dto';

@Injectable()
export class DesignCollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(brandId: string, userId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    const where = { brandId, userId };

    const [collections, total] = await Promise.all([
      this.prisma.designCollection.findMany({
        where,
        include: {
          items: {
            take: 5,
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

  async findOne(id: string, userId: string, brandId: string) {
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
          },
          orderBy: { order: 'asc' },
        },
        _count: { select: { items: true } },
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }
    if (collection.userId !== userId || collection.brandId !== brandId) {
      throw new ForbiddenException('Access denied to this collection');
    }

    return collection;
  }

  async create(
    dto: CreateDesignCollectionDto,
    userId: string,
    brandId: string,
  ) {
    return this.prisma.designCollection.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        coverImage: dto.coverImage ?? null,
        isPublic: dto.isPublic ?? false,
        userId,
        brandId,
      },
      include: { items: true },
    });
  }

  async update(
    id: string,
    dto: UpdateDesignCollectionDto,
    userId: string,
    brandId: string,
  ) {
    await this.findOne(id, userId, brandId);

    return this.prisma.designCollection.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.coverImage !== undefined && { coverImage: dto.coverImage }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
      include: {
        items: {
          take: 5,
          include: {
            design: {
              select: { id: true, name: true, previewUrl: true },
            },
          },
        },
      },
    });
  }

  async delete(id: string, userId: string, brandId: string) {
    await this.findOne(id, userId, brandId);
    await this.prisma.designCollection.delete({ where: { id } });
    return { success: true, message: 'Collection deleted successfully' };
  }

  async addDesign(
    collectionId: string,
    designId: string,
    userId: string,
    brandId: string,
    notes?: string,
  ) {
    await this.findOne(collectionId, userId, brandId);

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

    const existing = await this.prisma.designCollectionItem.findUnique({
      where: {
        collectionId_designId: { collectionId, designId },
      },
    });
    if (existing) {
      throw new BadRequestException('Design already in collection');
    }

    const maxOrder = await this.prisma.designCollectionItem.findFirst({
      where: { collectionId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const item = await this.prisma.designCollectionItem.create({
      data: {
        collectionId,
        designId,
        notes: notes ?? null,
        addedBy: userId,
        order: (maxOrder?.order ?? 0) + 1,
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

    await this.prisma.designCollection.update({
      where: { id: collectionId },
      data: { itemCount: { increment: 1 } },
    });

    return item;
  }

  async removeDesign(
    collectionId: string,
    designId: string,
    userId: string,
    brandId: string,
  ) {
    await this.findOne(collectionId, userId, brandId);

    const item = await this.prisma.designCollectionItem.findUnique({
      where: {
        collectionId_designId: { collectionId, designId },
      },
    });
    if (!item) {
      throw new NotFoundException('Item not found in collection');
    }

    await this.prisma.designCollectionItem.delete({
      where: {
        collectionId_designId: { collectionId, designId },
      },
    });

    await this.prisma.designCollection.update({
      where: { id: collectionId },
      data: { itemCount: { decrement: 1 } },
    });

    return { success: true, message: 'Item removed from collection' };
  }
}
