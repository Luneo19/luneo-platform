/**
 * Public API Service
 * brandId is passed explicitly to each method (no global state).
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { CreateDesignDto, UpdateDesignDto, CreateOrderDto, GetAnalyticsDto, WebhookEvent } from './dto';
import { WebhookService } from './webhooks/webhooks.service';
import { AnalyticsService } from './analytics/analytics.service';
import * as crypto from 'crypto';

@Injectable()
export class PublicApiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly webhookService: WebhookService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async getBrandInfo(brandId: string) {
    const cacheKey = `brand:info:${brandId}`;
    return this.cache.getOrSet(cacheKey, async () => {
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          website: true,
          status: true,
          plan: true,
          settings: true,
        },
      });

      if (!brand) {
        throw new NotFoundException('Brand not found');
      }

      return brand;
    }, 300); // Cache for 5 minutes
  }

  async getProducts(brandId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { brandId },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          sku: true,
          price: true,
          currency: true,
          images: true,
          model3dUrl: true,
          customizationOptions: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where: { brandId } }),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getProduct(brandId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { 
        id,
        brandId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        sku: true,
        price: true,
        currency: true,
        images: true,
        model3dUrl: true,
        modelConfig: true,
        customizationOptions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async createDesign(brandId: string, createDesignDto: CreateDesignDto) {
    // Validate product exists and belongs to brand
    const product = await this.prisma.product.findFirst({
      where: { 
        id: createDesignDto.productId,
        brandId,
        isActive: true,
      },
    });

    if (!product) {
      throw new BadRequestException('Product not found or not accessible');
    }

    const design = await this.prisma.design.create({
      data: {
        name: createDesignDto.name,
        description: createDesignDto.description,
        prompt: createDesignDto.prompt,
        status: 'PENDING',
        productId: createDesignDto.productId,
        brandId,
        options: (createDesignDto.customizationData || {}) as Prisma.InputJsonValue,
        metadata: (createDesignDto.metadata || undefined) as Prisma.InputJsonValue | undefined,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Trigger webhook for design creation
    await this.webhookService.sendWebhook(WebhookEvent.DESIGN_CREATED, {
      designId: design.id,
      brandId,
      status: design.status,
    }, brandId);

    return design;
  }

  async listDesigns(brandId: string, page: number = 1, limit: number = 10, status?: string) {
    const skip = (page - 1) * limit;
    const where: { brandId: string; status?: string } = { brandId };
    if (status) {
      where.status = status;
    }

    const [designs, total] = await Promise.all([
      this.prisma.design.findMany({
        where: where as Prisma.DesignWhereInput,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          previewUrl: true,
          createdAt: true,
          updatedAt: true,
          product: {
            select: { id: true, name: true, price: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.design.count({ where: where as Prisma.DesignWhereInput }),
    ]);

    return {
      data: designs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getDesign(brandId: string, id: string) {
    const design = await this.prisma.design.findFirst({
      where: { 
        id,
        brandId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        prompt: true,
        status: true,
        highResUrl: true,
        previewUrl: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });

    if (!design) {
      throw new NotFoundException('Design not found');
    }

    return design;
  }

  async updateDesign(brandId: string, id: string, dto: UpdateDesignDto) {
    const design = await this.prisma.design.findFirst({
      where: { id, brandId },
    });
    if (!design) {
      throw new NotFoundException('Design not found');
    }
    const updated = await this.prisma.design.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.customizationData !== undefined && { options: dto.customizationData as Prisma.InputJsonValue }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata as Prisma.InputJsonValue }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        highResUrl: true,
        previewUrl: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return updated;
  }

  async deleteDesign(brandId: string, id: string): Promise<void> {
    const design = await this.prisma.design.findFirst({
      where: { id, brandId },
    });
    if (!design) {
      throw new NotFoundException('Design not found');
    }
    await this.prisma.design.delete({
      where: { id },
    });
  }

  async createOrder(brandId: string, createOrderDto: CreateOrderDto) {
    // Validate design exists and belongs to brand
    const design = await this.prisma.design.findFirst({
      where: { 
        id: createOrderDto.designId,
        brandId,
        status: 'COMPLETED',
      },
      include: {
        product: true,
      },
    });

    if (!design) {
      throw new BadRequestException('Design not found or not completed');
    }

    const order = await this.prisma.order.create({
      data: {
        orderNumber: crypto.randomBytes(8).toString('hex'),
        status: 'CREATED',
        totalCents: Math.round(Number(design.product.price) * 100),
        subtotalCents: Math.round(Number(design.product.price) * 100),
        currency: design.product.currency,
        design: {
          connect: { id: createOrderDto.designId }
        },
        brand: {
          connect: { id: brandId }
        },
        product: {
          connect: { id: design.productId }
        },
        customerEmail: createOrderDto.customerEmail,
        customerName: createOrderDto.customerName,
        shippingAddress: createOrderDto.shippingAddress as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        status: true,
        totalCents: true,
        currency: true,
        createdAt: true,
        design: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Trigger webhook for order creation
    await this.webhookService.sendWebhook(WebhookEvent.ORDER_CREATED, {
      orderId: order.id,
      brandId,
      status: order.status,
      totalAmount: order.totalCents / 100,
    }, brandId);

    return order;
  }

  async getOrder(brandId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { 
        id,
        brandId,
      },
      select: {
        id: true,
        status: true,
        totalCents: true,
        currency: true,
        customerEmail: true,
        customerName: true,
        shippingAddress: true,
        createdAt: true,
        updatedAt: true,
        design: {
          select: {
            id: true,
            name: true,
            highResUrl: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getOrders(brandId: string, page: number = 1, limit: number = 10, status?: string) {
    const skip = (page - 1) * limit;

    const where: { brandId: string; status?: string } = { brandId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: where as Prisma.OrderWhereInput,
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          totalCents: true,
          currency: true,
          customerEmail: true,
          customerName: true,
          createdAt: true,
          design: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where: where as Prisma.OrderWhereInput }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getAnalytics(brandId: string, query: GetAnalyticsDto) {
    return this.analyticsService.getAnalytics(brandId, query);
  }

  async testWebhook(brandId: string, payload: Record<string, unknown>) {
    return this.webhookService.sendWebhook(WebhookEvent.TEST, payload, brandId);
  }
}
