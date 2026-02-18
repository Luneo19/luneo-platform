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
import { Throttle } from '@nestjs/throttler';
import { ProductsService } from './products.service';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { BrandOwnershipGuard } from '@/common/guards/brand-ownership.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';
import { JsonValue } from '@/common/types/utility-types';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { BulkActionProductsDto, ImportProductsDto, UploadProductModelDto } from './dto/products-extra.dto';
import { CreateVariantDto, UpdateVariantDto, BulkCreateVariantsDto, UpdateStockDto } from './dto/product-variant.dto';
import { CacheTTL } from '@/common/interceptors/cache-control.interceptor';

@ApiTags('products')
@Controller('products')
// SECURITY FIX P1-4: Added RolesGuard for RBAC on mutations
@UseGuards(JwtAuthGuard, BrandOwnershipGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  /** @Public: product catalog for storefront */
  @Public()
  @CacheTTL(300)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
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
    return this.productsService.findAll(filters, {
      page: page != null ? Number(page) : undefined,
      limit: limit != null ? Number(limit) : undefined,
    });
  }

  @Get('brand/:slug')
  /** @Public: Get brand info + products by slug (storefront catalog) */
  @Public()
  @CacheTTL(300)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get brand and products by brand slug' })
  @ApiParam({ name: 'slug', description: 'Brand slug', example: 'my-brand' })
  async findByBrandSlug(
    @Param('slug') slug: string,
    @Query() query: ProductQueryDto,
  ) {
    return this.productsService.findByBrandSlug(slug, query as Record<string, unknown>);
  }

  @Get(':id/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get product stats (orders, designs, revenue, customizations)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product stats' })
  async getProductStats(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user?.brandId;
    if (!brandId) {
      throw new BadRequestException('User must have a brandId');
    }
    return this.productsService.getProductStats(id, brandId);
  }

  @Get(':id')
  /** @Public: product details for storefront */
  @Public()
  @CacheTTL(300)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
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
  async findOne(@Param('id') id: string, @Request() req: ExpressRequest & { user?: CurrentUser }) {
    // SECURITY FIX: Pass brandId so users can only access products from their own brand (MED-001)
    return this.productsService.findOne(id, req.user?.brandId ?? undefined);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
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
    return this.productsService.create(req.user.brandId, createProductDto as unknown as Record<string, JsonValue>, req.user);
  }

  @Post('brands/:brandId/products')
  @ApiBearerAuth()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
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
    return this.productsService.create(brandId, createProductDto as unknown as Record<string, JsonValue>, req.user);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
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
    return this.productsService.update(req.user.brandId, id, updateProductDto as unknown as Record<string, JsonValue>, req.user);
  }

  @Patch('brands/:brandId/products/:id')
  @ApiBearerAuth()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
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
    return this.productsService.update(brandId, id, updateProductDto as unknown as Record<string, JsonValue>, req.user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Supprimer un produit' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Produit supprimé avec données du produit supprimé',
  })
  async delete(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    if (!req.user.brandId) {
      throw new BadRequestException('User must have a brandId');
    }
    const product = await this.productsService.remove(id, req.user.brandId, req.user);
    return { success: true, product };
  }

  @Post('bulk')
  @ApiBearerAuth()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Actions en masse sur les produits' })
  @ApiResponse({
    status: 200,
    description: 'Actions effectuées',
  })
  async bulkAction(
    @Body() body: BulkActionProductsDto,
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
    return this.productsService.export(req.user.brandId, query as unknown as Record<string, unknown>, req.user);
  }

  @Post('import')
  @ApiBearerAuth()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Importer des produits depuis CSV' })
  @ApiResponse({
    status: 200,
    description: 'Produits importés',
  })
  async import(
    @Body() body: ImportProductsDto,
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
    // SECURITY FIX: Pass brandId to verify product ownership (prevent IDOR)
    return this.productsService.getAnalytics(id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      brandId: req.user?.brandId || undefined,
      isAdmin: req.user?.role === 'PLATFORM_ADMIN',
    });
  }

  @Post(':id/upload-model')
  @ApiBearerAuth()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Upload un modèle 3D pour un produit' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Modèle uploadé avec succès',
  })
  async uploadModel(
    @Param('id') id: string,
    @Body() body: UploadProductModelDto,
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.productsService.uploadModel(id, body, req.user);
  }

  @Get(':id/variants')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List product variants' })
  async getVariants(
    @Param('id') productId: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user?.brandId ?? '';
    return this.productsService.getVariants(productId, brandId);
  }

  @Post(':id/variants')
  @ApiBearerAuth()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a product variant' })
  async createVariant(
    @Param('id') productId: string,
    @Body() dto: CreateVariantDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user?.brandId ?? '';
    return this.productsService.createVariant(productId, brandId, dto);
  }

  @Post(':id/variants/bulk')
  @ApiBearerAuth()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Bulk create variants from attribute matrix' })
  async bulkCreateVariants(
    @Param('id') productId: string,
    @Body() dto: BulkCreateVariantsDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user?.brandId ?? '';
    return this.productsService.bulkCreateVariants(productId, brandId, dto);
  }

  @Patch(':id/variants/:variantId')
  @ApiBearerAuth()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Update a product variant' })
  async updateVariant(
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user?.brandId ?? '';
    return this.productsService.updateVariant(productId, variantId, brandId, dto);
  }

  @Patch(':id/variants/:variantId/stock')
  @ApiBearerAuth()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Update variant stock' })
  async updateStock(
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateStockDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user?.brandId ?? '';
    return this.productsService.updateStock(productId, variantId, brandId, dto.stock);
  }

  @Delete(':id/variants/:variantId')
  @ApiBearerAuth()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Delete a product variant' })
  async deleteVariant(
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const brandId = req.user?.brandId ?? '';
    return this.productsService.deleteVariant(productId, variantId, brandId);
  }
}