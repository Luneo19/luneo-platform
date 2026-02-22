import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { DiscountService } from './services/discount.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { ValidateDiscountCodeDto } from './dto/validate-discount-code.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Public controller for discount code validation
 */
@ApiTags('discount-codes')
@Controller('discount-codes')
@UseGuards(JwtAuthGuard)
export class DiscountCodesPublicController {
  constructor(private readonly discountService: DiscountService) {}

  @Post('validate')
  @Public()
  @ApiBearerAuth()
  // SECURITY FIX: Reduced rate limit to prevent discount code enumeration (was 30, now 10/min)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Validate a discount code' })
  @ApiResponse({ status: 200, description: 'Discount code validation result' })
  @ApiResponse({ status: 400, description: 'Invalid or expired discount code' })
  async validateDiscountCode(
    @Body() dto: ValidateDiscountCodeDto,
    @Request() req: { user?: { id: string } },
  ) {
    const subtotal = dto.subtotalCents ?? 0;
    return this.discountService.validateAndApplyDiscount(
      dto.code,
      subtotal,
      dto.brandId,
      req.user?.id ?? undefined,
    );
  }
}

@ApiTags('admin-discounts')
@ApiBearerAuth()
@Controller('admin/discounts')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing
@Roles(UserRole.PLATFORM_ADMIN)
export class DiscountController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all discount codes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'expired'] })
  @ApiResponse({ status: 200, description: 'Paginated list of discounts' })
  async listDiscounts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = Math.max(1, parseInt(String(page), 10) || DEFAULT_PAGE);
    const limitNum = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(String(limit), 10) || DEFAULT_LIMIT),
    );
    const skip = (pageNum - 1) * limitNum;

    const now = new Date();
    const where: Record<string, unknown> = {};

    if (status === 'active') {
      where.isActive = true;
      where.validFrom = { lte: now };
      where.validUntil = { gte: now };
    } else if (status === 'inactive') {
      where.isActive = false;
    } else if (status === 'expired') {
      where.validUntil = { lt: now };
    }

    const [items, total] = await Promise.all([
      this.prisma.discount.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          brand: { select: { id: true, name: true } },
        },
      }),
      this.prisma.discount.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get discount details' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({ status: 200, description: 'Discount details' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  async getDiscount(@Param('id') id: string) {
    const discount = await this.prisma.discount.findUnique({
      where: { id },
      include: {
        brand: { select: { id: true, name: true } },
        _count: { select: { discountUsages: true } },
      },
    });
    if (!discount) {
      throw new NotFoundException(`Discount with id ${id} not found`);
    }
    return discount;
  }

  @Post()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a new discount code' })
  @ApiResponse({ status: 201, description: 'Discount created' })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  async createDiscount(@Body() dto: CreateDiscountDto) {
    const normalizedCode = dto.code.toUpperCase().trim();
    if (!normalizedCode) {
      throw new BadRequestException('Code is required');
    }

    const existing = await this.prisma.discount.findUnique({
      where: { code: normalizedCode },
    });
    if (existing) {
      throw new ConflictException(`Discount code "${normalizedCode}" already exists`);
    }

    const validFrom = dto.validFrom ? new Date(dto.validFrom) : new Date();
    const validUntil = dto.validTo ? new Date(dto.validTo) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    if (validUntil <= validFrom) {
      throw new BadRequestException('validTo must be after validFrom');
    }

    const discount = await this.prisma.discount.create({
      data: {
        code: normalizedCode,
        type: dto.type,
        value: dto.value,
        minPurchaseCents: dto.minPurchaseCents ?? undefined,
        maxDiscountCents: dto.maxDiscountCents ?? undefined,
        validFrom,
        validUntil,
        usageLimit: dto.usageLimit ?? undefined,
        isActive: dto.isActive ?? true,
        description: dto.description ?? undefined,
        brandId: dto.brandId ?? undefined,
      },
      include: {
        brand: { select: { id: true, name: true } },
      },
    });
    return discount;
  }

  @Put(':id')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Update a discount code' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({ status: 200, description: 'Discount updated' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  @ApiResponse({ status: 409, description: 'Code already in use by another discount' })
  async updateDiscount(@Param('id') id: string, @Body() dto: UpdateDiscountDto) {
    const existing = await this.prisma.discount.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Discount with id ${id} not found`);
    }

    if (dto.code !== undefined) {
      const normalizedCode = dto.code.toUpperCase().trim();
      if (!normalizedCode) {
        throw new BadRequestException('Code cannot be empty');
      }
      const duplicate = await this.prisma.discount.findFirst({
        where: { code: normalizedCode, id: { not: id } },
      });
      if (duplicate) {
        throw new ConflictException(`Discount code "${normalizedCode}" already exists`);
      }
    }

    const validFrom = dto.validFrom !== undefined ? new Date(dto.validFrom) : undefined;
    const validUntil = dto.validTo !== undefined ? new Date(dto.validTo) : undefined;
    if (
      (validFrom ?? existing.validFrom) >= (validUntil ?? existing.validUntil)
    ) {
      throw new BadRequestException('validTo must be after validFrom');
    }

    const updateData: Record<string, unknown> = {};
    if (dto.code !== undefined) updateData.code = dto.code.toUpperCase().trim();
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.value !== undefined) updateData.value = dto.value;
    if (dto.minPurchaseCents !== undefined) updateData.minPurchaseCents = dto.minPurchaseCents;
    if (dto.maxDiscountCents !== undefined) updateData.maxDiscountCents = dto.maxDiscountCents;
    if (validFrom !== undefined) updateData.validFrom = validFrom;
    if (validUntil !== undefined) updateData.validUntil = validUntil;
    if (dto.usageLimit !== undefined) updateData.usageLimit = dto.usageLimit;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.brandId !== undefined) updateData.brandId = dto.brandId;

    const discount = await this.prisma.discount.update({
      where: { id },
      data: updateData,
      include: {
        brand: { select: { id: true, name: true } },
      },
    });
    return discount;
  }

  @Delete(':id')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Delete a discount code' })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({ status: 200, description: 'Discount deleted' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  async deleteDiscount(@Param('id') id: string) {
    const existing = await this.prisma.discount.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Discount with id ${id} not found`);
    }
    await this.prisma.discount.delete({ where: { id } });
    return { success: true, message: 'Discount deleted' };
  }
}
