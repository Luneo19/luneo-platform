import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole, DesignStatus } from '@prisma/client';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class DesignsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('ai-generation') private aiQueue: Queue,
  ) {}

  async create(createDesignDto: any, currentUser: any) {
    const { productId, prompt, options } = createDesignDto;

    // Check if product exists and user has access
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { brand: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== product.brandId) {
      throw new ForbiddenException('Access denied to this product');
    }

    // Create design record
    const design = await this.prisma.design.create({
      data: {
        prompt,
        options,
        status: DesignStatus.PENDING,
        userId: currentUser.id,
        brandId: product.brandId,
        productId,
      },
      include: {
        product: true,
        brand: true,
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

  async findOne(id: string, currentUser: any) {
    const design = await this.prisma.design.findUnique({
      where: { id },
      include: {
        product: true,
        brand: true,
        user: true,
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

  async upgradeToHighRes(id: string, currentUser: any) {
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
