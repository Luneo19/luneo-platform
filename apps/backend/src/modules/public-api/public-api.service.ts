import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { CreateDesignDto, CreateOrderDto, GetAnalyticsDto } from './dto';
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

  async getBrandInfo() {
    const cacheKey = 'brand:info';
    return this.cache.getOrSet(cacheKey, async () => {
      // Get brand info from request context (set by API key guard)
      const brandId = this.getCurrentBrandId();
      if (!brandId) {
        throw new UnauthorizedException('Brand context not found');
      }

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

  async getProducts(page: number = 1, limit: number = 10) {
    const brandId = this.getCurrentBrandId();
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

  async getProduct(id: string) {
    const brandId = this.getCurrentBrandId();
    
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

  async createDesign(createDesignDto: CreateDesignDto) {
    const brandId = this.getCurrentBrandId();
    
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
        options: createDesignDto.customizationData || {},
        metadata: createDesignDto.metadata,
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
    await this.webhookService.sendWebhook('design.created' as any, {
      designId: design.id,
      brandId,
      status: design.status,
    });

    return design;
  }

  async getDesign(id: string) {
    const brandId = this.getCurrentBrandId();
    
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

  async createOrder(createOrderDto: CreateOrderDto) {
    const brandId = this.getCurrentBrandId();
    
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
        shippingAddress: createOrderDto.shippingAddress as any,
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
    await this.webhookService.sendWebhook('order.created' as any, {
      orderId: order.id,
      brandId,
      status: order.status,
      totalAmount: order.totalCents / 100,
    });

    return order;
  }

  async getOrder(id: string) {
    const brandId = this.getCurrentBrandId();
    
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

  async getOrders(page: number = 1, limit: number = 10, status?: string) {
    const brandId = this.getCurrentBrandId();
    const skip = (page - 1) * limit;
    
    const where: any = { brandId };
    if (status) {
      where.status = status;
    }
    
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
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
      this.prisma.order.count({ where }),
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

  async getAnalytics(query: GetAnalyticsDto) {
    const brandId = this.getCurrentBrandId();
    return this.analyticsService.getAnalytics(brandId, query);
  }

  async testWebhook(payload: any) {
    const brandId = this.getCurrentBrandId();
    return this.webhookService.sendWebhook('test' as any, payload, brandId);
  }

  private getCurrentBrandId(): string | null {
    // This would be set by the API key guard
    // For now, we'll extract it from the request context
    // In a real implementation, this would come from the authenticated API key
    return (global as any).currentBrandId || null;
  }
}
