import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any = {}) {
    const { brandId, isPublic, isActive } = query;
    
    return this.prisma.product.findMany({
      where: {
        ...(brandId && { brandId }),
        ...(isPublic !== undefined && { isPublic }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        brand: true,
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(brandId: string, createProductDto: any, currentUser: any) {
    // Check if user has access to this brand
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== brandId) {
      throw new ForbiddenException('Access denied to this brand');
    }

    return this.prisma.product.create({
      data: {
        ...createProductDto,
        brandId,
      },
      include: {
        brand: true,
      },
    });
  }

  async update(brandId: string, id: string, updateProductDto: any, currentUser: any) {
    // Check if user has access to this brand
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== brandId) {
      throw new ForbiddenException('Access denied to this brand');
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        brand: true,
      },
    });
  }
}
