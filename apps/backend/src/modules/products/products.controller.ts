import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Body,
  Query,
  Request,
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

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Liste des produits publics' })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'isPublic', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiResponse({
    status: 200,
    description: 'Liste des produits',
  })
  async findAll(@Query() query: Record<string, string | undefined>) {
    return this.productsService.findAll(query, {});
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

  @Post('brands/:brandId/products')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un nouveau produit' })
  @ApiParam({ name: 'brandId', description: 'ID de la marque' })
  @ApiResponse({
    status: 201,
    description: 'Produit créé',
  })
  async create(
    @Param('brandId') brandId: string,
    @Body() createProductDto: Record<string, JsonValue>,
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.productsService.create(brandId, createProductDto, req.user);
  }

  @Patch('brands/:brandId/products/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour un produit' })
  @ApiParam({ name: 'brandId', description: 'ID de la marque' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Produit mis à jour',
  })
  async update(
    @Param('brandId') brandId: string,
    @Param('id') id: string,
    @Body() updateProductDto: Record<string, JsonValue>,
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.productsService.update(brandId, id, updateProductDto, req.user);
  }
}
