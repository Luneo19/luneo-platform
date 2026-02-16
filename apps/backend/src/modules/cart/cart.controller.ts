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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { BrandOwnershipGuard } from '@/common/guards/brand-ownership.guard';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CheckoutCartDto } from './dto/checkout-cart.dto';
import { Request as ExpressRequest } from 'express';

@ApiTags('cart')
@Controller('cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BrandOwnershipGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current cart' })
  async getCart(@Request() req: ExpressRequest, @Query('brandId') brandId: string) {
    if (!brandId) {
      brandId = (req.user as { brandId?: string })?.brandId ?? '';
    }
    return this.cartService.getOrCreateCart((req.user as { id: string })?.id ?? '', brandId);
  }

  @Post('items')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Add item to cart' })
  async addItem(
    @Request() req: ExpressRequest,
    @Body() body: AddCartItemDto,
  ) {
    return this.cartService.addItem((req.user as { id: string }).id, body.brandId, {
      productId: body.productId,
      quantity: body.quantity || 1,
      priceCents: body.priceCents,
      designId: body.designId,
      customizationId: body.customizationId,
      metadata: body.metadata,
    });
  }

  @Put('items/:itemId')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Update item quantity' })
  async updateItem(
    @Request() req: ExpressRequest,
    @Param('itemId') itemId: string,
    @Body() body: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity((req.user as { id: string }).id, itemId, body.quantity);
  }

  @Delete('items/:itemId')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(@Request() req: ExpressRequest, @Param('itemId') itemId: string) {
    return this.cartService.removeItem((req.user as { id: string }).id, itemId);
  }

  @Delete()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Clear cart' })
  async clearCart(@Request() req: ExpressRequest, @Query('brandId') brandId: string) {
    let bid = brandId;
    if (!bid) {
      bid = (req.user as { brandId?: string })?.brandId ?? '';
    }
    return this.cartService.clearCart((req.user as { id: string }).id, bid);
  }

  @Post('checkout')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Convert cart to order data for checkout' })
  async checkout(@Request() req: ExpressRequest, @Body() body: CheckoutCartDto) {
    return this.cartService.cartToOrderData((req.user as { id: string }).id, body.brandId);
  }
}
