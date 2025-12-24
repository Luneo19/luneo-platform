import { CurrentUser } from '@/common/types/user.types';
import { Cacheable } from '@/libs/cache/cacheable.decorator';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DesignStatus, UserRole } from '@prisma/client';
import { Queue } from 'bullmq';

@Injectable()
export class DesignsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('ai-generation') private aiQueue: Queue,
  ) {}

  async create(createDesignDto: { productId: string; prompt: string; options?: Record<string, unknown> }, currentUser: { id: string; role: UserRole; brandId?: string | null }) {
    const { productId, prompt, options } = createDesignDto;

    // Optimisé: select au lieu de include
    // Check if product exists and user has access
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        brandId: true,
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== product.brandId) {
      throw new ForbiddenException('Access denied to this product');
    }

    // Optimisé: select au lieu de include
    // Create design record (cache invalidé automatiquement)
    const design = await this.prisma.design.create({
      data: {
        prompt,
        options: options as any,
        status: DesignStatus.PENDING,
        userId: currentUser.id,
        brandId: product.brandId,
        productId,
      },
      select: {
        id: true,
        prompt: true,
        options: true,
        status: true,
        userId: true,
        brandId: true,
        productId: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Add to AI generation queue
    await this.aiQueue.add('generate-design', {
      designId: design.id,
      prompt,
      options,
      userId: currentUser.id,
      brandId: product.brandId,
    });

    return design;
  }

  // Optimisé: select au lieu de include, cache automatique
  @Cacheable({ 
    type: 'design', 
    ttl: 900,
    keyGenerator: (args) => `design:${args[0]}`,
    tags: () => ['designs:list'],
  })
  async findOne(id: string, currentUser: { id: string; role: UserRole; brandId?: string | null }) {
    const design = await this.prisma.design.findUnique({
      where: { id },
      select: {
        id: true,
        prompt: true,
        options: true,
        status: true,
        previewUrl: true,
        highResUrl: true,
        userId: true,
        brandId: true,
        productId: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            description: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!design) {
      throw new NotFoundException('Design not found');
    }

    // Check permissions
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== design.brandId) {
      throw new ForbiddenException('Access denied to this design');
    }

    return design;
  }

  async upgradeToHighRes(id: string, currentUser: CurrentUser) {
    const design = await this.findOne(id, currentUser);

    if (design.status !== DesignStatus.COMPLETED) {
      throw new ForbiddenException('Design must be completed to upgrade to high-res');
    }

    // Add to high-res generation queue
    await this.aiQueue.add('generate-high-res', {
      designId: design.id,
      prompt: design.prompt,
      options: design.options,
      userId: currentUser.id,
    });

    return { message: 'High-res generation started' };
  }
}
