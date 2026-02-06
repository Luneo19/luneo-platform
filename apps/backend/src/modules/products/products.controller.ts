import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Delete,
  Body,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { ProductsService } from './products.service';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/types/user.types';
import { JsonValue } from '@/common/types/utility-types';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Public()
  @ApiOperation({ 
    summary: 'Liste des produits avec filtres avancés',
    description: 'Récupère une liste paginée de produits avec filtres optionnels (catégorie, prix, disponibilité, etc.). Route publique accessible sans authentification.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page (défaut: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page (défaut: 50, max: 100)', example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Liste des produits récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'prod_123' },
              name: { type: 'string', example: 'Collier personnalisé' },
              price: { type: 'number', example: 49.99 },
              category: { type: 'string', example: 'jewelry' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 50 },
            total: { type: 'number', example: 150 },
            totalPages: { type: 'number', example: 3 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Paramètres de requête invalides' })
  async findAll(@Query() query: ProductQueryDto) {
    const { page = 1, limit = 50, ...filters } = query;
    return this.productsService.findAll(filters, { page, limit });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ 
    summary: 'Obtenir un produit par ID',
    description: 'Récupère les détails complets d\'un produit spécifique, incluant ses variantes, options de personnalisation, et métadonnées. Route publique.',
  })
  @ApiParam({ name: 'id', description: 'ID unique du produit', example: 'prod_123' })
  @ApiResponse({
    status: 200,
    description: 'Détails du produit récupérés avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'prod_123' },
        name: { type: 'string', example: 'Collier personnalisé' },
        description: { type: 'string', example: 'Collier en or 18k avec pendentif personnalisable' },
        price: { type: 'number', example: 49.99 },
        category: { type: 'string', example: 'jewelry' },
        variants: { type: 'array', items: { type: 'object' } },
        customizationOptions: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Produit non trouvé - L\'ID fourni n\'existe pas' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Créer un nouveau produit',
    description: 'Crée un nouveau produit pour la marque de l\'utilisateur authentifié. Nécessite les permissions Brand Admin. Le produit est créé avec les options de personnalisation et variantes spécifiées.',
  })
  @ApiResponse({
    status: 201,
    description: 'Produit créé avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'prod_123' },
        name: { type: 'string', example: 'Collier personnalisé' },
        brandId: { type: 'string', example: 'brand_456' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Données invalides - Vérifier le format des données envoyées' })
  @ApiResponse({ status: 401, description: 'Non authentifié - Token JWT manquant ou invalide' })
  @ApiResponse({ status: 403, description: 'Non autorisé - L\'utilisateur n\'a pas les permissions Brand Admin' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    if (!req.user.brandId) {
      throw new BadRequestException('User must have a brandId');
    }
    return this.productsService.create(req.user.brandId, createProductDto as any, req.user);
  }

  @Post('brands/:brandId/products')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouveau produit (legacy)' })
  @ApiParam({ name: 'brandId', description: 'ID de la marque' })
  @ApiResponse({
    status: 201,
    description: 'Produit créé',
  })
  async createLegacy(
    @Param('brandId') brandId: string,
    @Body() createProductDto: CreateProductDto,
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.productsService.create(brandId, createProductDto as any, req.user);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour un produit' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Produit mis à jour',
  })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    if (!req.user.brandId) {
      throw new BadRequestException('User must have a brandId');
    }
    return this.productsService.update(req.user.brandId, id, updateProductDto as any, req.user);
  }

  @Patch('brands/:brandId/products/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour un produit (legacy)' })
  @ApiParam({ name: 'brandId', description: 'ID de la marque' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Produit mis à jour',
  })
  async updateLegacy(
    @Param('brandId') brandId: string,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.productsService.update(brandId, id, updateProductDto as any, req.user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un produit' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({
    status: 204,
    description: 'Produit supprimé',
  })
  async delete(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    if (!req.user.brandId) {
      throw new BadRequestException('User must have a brandId');
    }
    await this.productsService.remove(id, req.user.brandId, req.user);
    return { success: true };
  }

  @Post('bulk')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actions en masse sur les produits' })
  @ApiResponse({
    status: 200,
    description: 'Actions effectuées',
  })
  async bulkAction(
    @Body() body: { productIds: string[]; action: 'delete' | 'archive' | 'activate' | 'deactivate' },
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    if (!req.user.brandId) {
      throw new BadRequestException('User must have a brandId');
    }
    return this.productsService.bulkAction(req.user.brandId, body.productIds, body.action, req.user);
  }

  @Get('export')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Exporter les produits' })
  @ApiResponse({
    status: 200,
    description: 'Fichier d\'export',
  })
  async export(
    @Query() query: ProductQueryDto,
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    if (!req.user.brandId) {
      throw new BadRequestException('User must have a brandId');
    }
    return this.productsService.export(req.user.brandId, query as Record<string, unknown>, req.user);
  }

  @Post('import')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Importer des produits depuis CSV' })
  @ApiResponse({
    status: 200,
    description: 'Produits importés',
  })
  async import(
    @Body() body: { csvData: string },
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    if (!req.user.brandId) {
      throw new BadRequestException('User must have a brandId');
    }
    return this.productsService.import(req.user.brandId, body.csvData, req.user);
  }

  @Get(':id/analytics')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analytics d\'un produit' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Analytics du produit',
  })
  async getAnalytics(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.productsService.getAnalytics(id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Post(':id/upload-model')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload un modèle 3D pour un produit' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Modèle uploadé avec succès',
  })
  async uploadModel(
    @Param('id') id: string,
    @Body() body: { fileUrl: string; fileName: string; fileSize: number; fileType: string },
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.productsService.uploadModel(id, body, req.user);
  }
}