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
import { PlatformRole } from '@prisma/client';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/types/user.types';
import { Request as ExpressRequest } from 'express';

@ApiTags('brands')
@Controller('brands')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get organization settings for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Organization settings' })
  @ApiResponse({ status: 404, description: 'User has no organization' })
  async getSettings(@Request() req: ExpressRequest) {
    const user = req.user as CurrentUser | undefined;
    if (!user?.organizationId) {
      throw new NotFoundException('No organization associated with this user');
    }
    return this.brandsService.findOne(user.organizationId, user);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update organization settings for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Organization settings updated' })
  @ApiResponse({ status: 404, description: 'User has no organization' })
  async updateSettings(
    @Request() req: ExpressRequest,
    @Body() updateBrandDto: UpdateBrandDto,
  ) {
    const user = req.user as CurrentUser | undefined;
    if (!user?.organizationId) {
      throw new NotFoundException('No organization associated with this user');
    }
    return this.brandsService.update(
      user.organizationId,
      updateBrandDto as unknown as Record<string, JsonValue>,
      user,
    );
  }

  @Get()
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Lister toutes les organisations (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Liste des organisations' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const filters = search
      ? { name: { contains: search, mode: 'insensitive' } }
      : {};
    return this.brandsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      filters as unknown as Record<string, JsonValue>,
    );
  }

  @Post()
  @Roles(PlatformRole.ADMIN)
  @ApiOperation({ summary: 'Créer une nouvelle organisation' })
  @ApiResponse({ status: 201, description: 'Organisation créée avec succès' })
  async create(
    @Body() createBrandDto: CreateBrandDto,
    @Request() req: ExpressRequest,
  ) {
    const user = req.user as CurrentUser | undefined;
    if (!user) throw new NotFoundException('User not found');
    return this.brandsService.create(
      createBrandDto as unknown as Record<string, JsonValue>,
      user.id,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: "Obtenir les détails d'une organisation" })
  @ApiParam({ name: 'id', description: "ID de l'organisation" })
  @ApiResponse({ status: 200, description: "Détails de l'organisation" })
  async findOne(@Param('id') id: string, @Request() req: ExpressRequest) {
    const user = req.user as CurrentUser | undefined;
    if (!user) throw new NotFoundException('User not found');
    return this.brandsService.findOne(id, user);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: "Obtenir les statistiques d'une organisation" })
  @ApiParam({ name: 'id', description: "ID de l'organisation" })
  @ApiResponse({ status: 200, description: "Statistiques de l'organisation" })
  async getStats(@Param('id') id: string, @Request() req: ExpressRequest) {
    const user = req.user as CurrentUser | undefined;
    if (!user) throw new NotFoundException('User not found');
    return this.brandsService.getBrandStats(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une organisation' })
  @ApiParam({ name: 'id', description: "ID de l'organisation" })
  @ApiResponse({ status: 200, description: 'Organisation mise à jour' })
  async update(
    @Param('id') id: string,
    @Body() updateBrandDto: UpdateBrandDto,
    @Request() req: ExpressRequest,
  ) {
    const user = req.user as CurrentUser | undefined;
    if (!user) throw new NotFoundException('User not found');
    return this.brandsService.update(
      id,
      updateBrandDto as unknown as Record<string, JsonValue>,
      user,
    );
  }

  @Post(':id/webhooks')
  @ApiOperation({ summary: "Ajouter un webhook pour une organisation" })
  @ApiParam({ name: 'id', description: "ID de l'organisation" })
  @ApiResponse({ status: 201, description: 'Webhook ajouté' })
  async addWebhook(
    @Param('id') id: string,
    @Body() webhookData: AddWebhookDto,
    @Request() req: ExpressRequest,
  ) {
    const user = req.user as CurrentUser | undefined;
    if (!user) throw new NotFoundException('User not found');
    return this.brandsService.addWebhook(
      id,
      webhookData as unknown as Record<string, JsonValue>,
      user,
    );
  }
}
