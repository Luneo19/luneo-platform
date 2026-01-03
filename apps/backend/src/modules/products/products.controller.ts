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
import { Public } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/types/user.types';
import { JsonValue } from '@/common/types/utility-types';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Liste des produits avec filtres avancés' })
  @ApiResponse({
    status: 200,
    description: 'Liste des produits',
  })
  async findAll(@Query() query: ProductQueryDto) {
    const { page = 1, limit = 50, ...filters } = query;
    return this.productsService.findAll(filters, { page, limit });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtenir un produit par ID' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Détails du produit',
  })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouveau produit' })
  @ApiResponse({
    status: 201,
    description: 'Produit créé',
  })
  async create(
    @Body() createProductDto: CreateProductDto,
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    if (!req.user.brandId) {
      throw new Error('User must have a brandId');
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
      throw new Error('User must have a brandId');
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
      throw new Error('User must have a brandId');
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
      throw new Error('User must have a brandId');
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
      throw new Error('User must have a brandId');
    }
    return this.productsService.export(req.user.brandId, query, req.user);
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
      throw new Error('User must have a brandId');
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
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.productsService.getAnalytics(id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }
}