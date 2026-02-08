import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Put,
  Body,
  Request,
  Query,
  UseGuards,
  NotFoundException,
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
import { JsonValue } from '@/common/types/utility-types';
import { Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('brands')
@Controller('brands')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get brand settings for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Brand settings' })
  @ApiResponse({ status: 404, description: 'User has no brand' })
  async getSettings(@Request() req) {
    if (!req.user.brandId) {
      throw new NotFoundException('No brand associated with this user');
    }
    return this.brandsService.findOne(req.user.brandId, req.user);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update brand settings for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Brand settings updated' })
  @ApiResponse({ status: 404, description: 'User has no brand' })
  async updateSettings(@Request() req, @Body() updateBrandDto: UpdateBrandDto) {
    if (!req.user.brandId) {
      throw new NotFoundException('No brand associated with this user');
    }
    return this.brandsService.update(req.user.brandId, updateBrandDto as unknown as Record<string, JsonValue>, req.user);
  }

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
      filters as unknown as Record<string, JsonValue>,
    );
  }

  @Post()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Créer une nouvelle marque' })
  @ApiResponse({ status: 201, description: 'Marque créée avec succès' })
  async create(@Body() createBrandDto: CreateBrandDto, @Request() req) {
    return this.brandsService.create(createBrandDto as unknown as Record<string, JsonValue>, req.user.id);
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
    return this.brandsService.update(id, updateBrandDto as unknown as Record<string, JsonValue>, req.user);
  }

  @Post(':id/webhooks')
  @ApiOperation({ summary: 'Ajouter un webhook pour une marque' })
  @ApiParam({ name: 'id', description: 'ID de la marque' })
  @ApiResponse({ status: 201, description: 'Webhook ajouté' })
  async addWebhook(@Param('id') id: string, @Body() webhookData: AddWebhookDto, @Request() req) {
    return this.brandsService.addWebhook(id, webhookData as unknown as Record<string, JsonValue>, req.user);
  }
}
