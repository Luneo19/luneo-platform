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
import { OrdersService } from './orders.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('orders')
@Controller('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.ordersService.findAll(req.user, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      search,
    });
  }

  @Post()
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
  async create(@Body() createOrderDto: any, @Request() req) {
    return this.ordersService.create(createOrderDto, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'une commande' })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la commande',
  })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.ordersService.findOne(id, req.user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une commande' })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({
    status: 200,
    description: 'Commande mise à jour',
  })
  async update(@Param('id') id: string, @Body() updateDto: any, @Request() req) {
    return this.ordersService.update(id, updateDto, req.user);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Annuler une commande' })
  @ApiParam({ name: 'id', description: 'ID de la commande' })
  @ApiResponse({
    status: 200,
    description: 'Commande annulée',
  })
  async cancel(@Param('id') id: string, @Request() req) {
    return this.ordersService.cancel(id, req.user);
  }
}
