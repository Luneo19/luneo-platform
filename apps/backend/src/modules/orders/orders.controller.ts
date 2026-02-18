import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { RequestRefundDto } from './dto/request-refund.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { BrandOwnershipGuard } from '@/common/guards/brand-ownership.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole, OrderStatus } from '@prisma/client';
import { Request as ExpressRequest } from 'express';

@ApiTags('orders')
@Controller('orders')
@ApiBearerAuth()
// SECURITY FIX: Added BrandOwnershipGuard for brand-level data isolation
@UseGuards(JwtAuthGuard, BrandOwnershipGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Lister toutes les commandes de l\'utilisateur',
    description: 'Récupère une liste paginée des commandes de l\'utilisateur authentifié, avec filtres optionnels par statut et recherche textuelle. Les commandes sont triées par date de création (plus récentes en premier).',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page (défaut: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page (défaut: 20, max: 100)', example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'], description: 'Filtrer par statut de commande', example: 'PAID' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Recherche textuelle dans les numéros de commande et produits', example: 'ORD-123' })
  @ApiResponse({
    status: 200,
    description: 'Liste des commandes récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'order_123' },
              orderNumber: { type: 'string', example: 'ORD-2025-001' },
              status: { type: 'string', example: 'PAID' },
              totalCents: { type: 'number', example: 4999 },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 45 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié - Token JWT manquant ou invalide' })
  @ApiResponse({ status: 400, description: 'Paramètres de requête invalides' })
  async findAll(
    @Request() req: ExpressRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.ordersService.findAll(req.user! as import('@/common/types/user.types').CurrentUser, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      search,
    });
  }

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ 
    summary: 'Créer une nouvelle commande',
    description: 'Crée une nouvelle commande avec les items spécifiés. Génère automatiquement une session de paiement Stripe et retourne l\'URL de paiement. Les items doivent inclure productId, designId, quantité et prix unitaire.',
  })
  @ApiResponse({
    status: 201,
    description: 'Commande créée avec succès. URL de paiement Stripe générée.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'order_123' },
        orderNumber: { type: 'string', example: 'ORD-2025-001' },
        status: { type: 'string', example: 'PENDING' },
        paymentUrl: { type: 'string', example: 'https://checkout.stripe.com/pay/cs_test_...' },
        totalCents: { type: 'number', example: 4999 },
        items: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Données invalides - Vérifier les items, quantités et prix' })
  @ApiResponse({ status: 401, description: 'Non authentifié - Token JWT manquant ou invalide' })
  @ApiResponse({ status: 404, description: 'Produit ou design non trouvé - Un des IDs fournis n\'existe pas' })
  @ApiResponse({ status: 500, description: 'Erreur lors de la création de la session Stripe' })
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req: ExpressRequest) {
    return this.ordersService.create(createOrderDto, req.user! as import('@/common/types/user.types').CurrentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'une commande' })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la commande',
  })
  async findOne(@Param('id') id: string, @Request() req: ExpressRequest) {
    return this.ordersService.findOne(id, req.user! as import('@/common/types/user.types').CurrentUser);
  }

  @Put(':id')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Mettre à jour une commande' })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({
    status: 200,
    description: 'Commande mise à jour',
  })
  async update(@Param('id') id: string, @Body() updateDto: UpdateOrderDto, @Request() req: ExpressRequest) {
    return this.ordersService.update(
      id,
      updateDto as unknown as { status?: OrderStatus; trackingNumber?: string; notes?: string },
      req.user! as import('@/common/types/user.types').CurrentUser,
    );
  }

  @Post(':id/cancel')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Annuler une commande' })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({ status: 200, description: 'Commande annulée' })
  @ApiResponse({ status: 400, description: 'Commande non annulable (statut invalide)' })
  async cancel(
    @Param('id') id: string,
    @Body() body: CancelOrderDto,
    @Request() req: ExpressRequest,
  ) {
    return this.ordersService.cancel(
      id,
      req.user! as import('@/common/types/user.types').CurrentUser,
      body?.reason,
    );
  }

  @Put(':id/status')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une commande' })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req: ExpressRequest,
  ) {
    return this.ordersService.updateStatus(id, dto.status, req.user! as import('@/common/types/user.types').CurrentUser);
  }

  @Get(':id/tracking')
  @ApiOperation({ summary: 'Obtenir le suivi d\'une commande' })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({ status: 200, description: 'Informations de suivi' })
  async getTracking(@Param('id') id: string, @Request() req: ExpressRequest) {
    return this.ordersService.getTracking(id, req.user! as import('@/common/types/user.types').CurrentUser);
  }

  @Post(':id/refund')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Demander un remboursement' })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({ status: 200, description: 'Demande de remboursement créée' })
  async requestRefund(
    @Param('id') id: string,
    @Body() dto: RequestRefundDto,
    @Request() req: ExpressRequest,
  ) {
    return this.ordersService.requestRefund(id, dto.reason ?? '', req.user! as import('@/common/types/user.types').CurrentUser);
  }

  @Post(':id/refund/process')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Traiter un remboursement (admin)' })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({ status: 200, description: 'Remboursement traité' })
  async processRefund(@Param('id') id: string, @Request() req: ExpressRequest) {
    return this.ordersService.processRefund(id, req.user! as import('@/common/types/user.types').CurrentUser);
  }
}
