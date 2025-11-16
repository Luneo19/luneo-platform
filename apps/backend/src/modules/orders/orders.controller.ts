import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import type { Request } from 'express';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('orders')
@Controller('orders')
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle commande' })
  @ApiResponse({
    status: 201,
    description: 'Commande créée avec URL de paiement',
  })
  @ApiBody({ type: CreateOrderDto })
  async create(@Body() createOrderDto: CreateOrderDto, @Req() req: Request) {
    return this.ordersService.create(createOrderDto, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'une commande' })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la commande',
  })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    return this.ordersService.findOne(id, req.user);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Annuler une commande' })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({
    status: 200,
    description: 'Commande annulée',
  })
  async cancel(@Param('id') id: string, @Req() req: Request) {
    return this.ordersService.cancel(id, req.user);
  }
}
