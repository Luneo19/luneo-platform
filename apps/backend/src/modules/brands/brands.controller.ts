import {
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Body,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('brands')
@Controller('brands')
@ApiBearerAuth()
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Créer une nouvelle marque' })
  @ApiResponse({
    status: 201,
    description: 'Marque créée avec succès',
  })
  async create(@Body() createBrandDto: any, @Request() req) {
    return this.brandsService.create(createBrandDto, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'une marque' })
  @ApiParam({ name: 'id', description: 'ID de la marque' })
  @ApiResponse({
    status: 200,
    description: 'Détails de la marque',
  })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.brandsService.findOne(id, req.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une marque' })
  @ApiParam({ name: 'id', description: 'ID de la marque' })
  @ApiResponse({
    status: 200,
    description: 'Marque mise à jour',
  })
  async update(@Param('id') id: string, @Body() updateBrandDto: any, @Request() req) {
    return this.brandsService.update(id, updateBrandDto, req.user);
  }

  @Post(':id/webhooks')
  @ApiOperation({ summary: 'Ajouter un webhook pour une marque' })
  @ApiParam({ name: 'id', description: 'ID de la marque' })
  @ApiResponse({
    status: 201,
    description: 'Webhook ajouté',
  })
  async addWebhook(@Param('id') id: string, @Body() webhookData: any, @Request() req) {
    return this.brandsService.addWebhook(id, webhookData, req.user);
  }
}
