import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Body,
  Request,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { CreateBrandDto, UpdateBrandDto, AddWebhookDto } from './dto/create-brand.dto';
import { Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('brands')
@Controller('brands')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Lister toutes les marques (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Liste des marques' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const filters = search ? { name: { contains: search, mode: 'insensitive' } } : {};
    return this.brandsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      filters as any,
    );
  }

  @Post()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Créer une nouvelle marque' })
  @ApiResponse({ status: 201, description: 'Marque créée avec succès' })
  async create(@Body() createBrandDto: CreateBrandDto, @Request() req) {
    return this.brandsService.create(createBrandDto, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'une marque' })
  @ApiParam({ name: 'id', description: 'ID de la marque' })
  @ApiResponse({ status: 200, description: 'Détails de la marque' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.brandsService.findOne(id, req.user);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Obtenir les statistiques d\'une marque' })
  @ApiParam({ name: 'id', description: 'ID de la marque' })
  @ApiResponse({ status: 200, description: 'Statistiques de la marque' })
  async getStats(@Param('id') id: string, @Request() req) {
    return this.brandsService.getBrandStats(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une marque' })
  @ApiParam({ name: 'id', description: 'ID de la marque' })
  @ApiResponse({ status: 200, description: 'Marque mise à jour' })
  async update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto, @Request() req) {
    return this.brandsService.update(id, updateBrandDto, req.user);
  }

  @Post(':id/webhooks')
  @ApiOperation({ summary: 'Ajouter un webhook pour une marque' })
  @ApiParam({ name: 'id', description: 'ID de la marque' })
  @ApiResponse({ status: 201, description: 'Webhook ajouté' })
  async addWebhook(@Param('id') id: string, @Body() webhookData: AddWebhookDto, @Request() req) {
    return this.brandsService.addWebhook(id, webhookData, req.user);
  }
}
