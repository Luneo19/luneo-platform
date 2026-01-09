import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Request,
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
import { CollectionsService } from './collections.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('collections')
@Controller('collections')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister toutes les collections de l\'utilisateur' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'includePublic', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Liste des collections' })
  async findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includePublic') includePublic?: string,
  ) {
    return this.collectionsService.findAll(req.user.id, req.user.brandId || '', {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      includePublic: includePublic === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une collection avec ses items' })
  @ApiParam({ name: 'id', description: 'ID de la collection' })
  @ApiResponse({ status: 200, description: 'Détails de la collection' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.collectionsService.findOne(id, req.user.id, req.user.brandId || '');
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle collection' })
  @ApiResponse({ status: 201, description: 'Collection créée' })
  async create(@Body() createCollectionDto: any, @Request() req) {
    return this.collectionsService.create(createCollectionDto, req.user.id, req.user.brandId || '');
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une collection' })
  @ApiParam({ name: 'id', description: 'ID de la collection' })
  @ApiResponse({ status: 200, description: 'Collection mise à jour' })
  async update(@Param('id') id: string, @Body() updateCollectionDto: any, @Request() req) {
    return this.collectionsService.update(id, updateCollectionDto, req.user.id, req.user.brandId || '');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une collection' })
  @ApiParam({ name: 'id', description: 'ID de la collection' })
  @ApiResponse({ status: 200, description: 'Collection supprimée' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.collectionsService.delete(id, req.user.id, req.user.brandId || '');
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Ajouter un design à une collection' })
  @ApiParam({ name: 'id', description: 'ID de la collection' })
  @ApiResponse({ status: 201, description: 'Design ajouté à la collection' })
  async addItem(@Param('id') id: string, @Body() body: { designId: string; notes?: string }, @Request() req) {
    return this.collectionsService.addItem(id, body.designId, body.notes, req.user.id, req.user.brandId || '');
  }

  @Delete(':id/items')
  @ApiOperation({ summary: 'Retirer un design d\'une collection' })
  @ApiParam({ name: 'id', description: 'ID de la collection' })
  @ApiQuery({ name: 'designId', description: 'ID du design à retirer' })
  @ApiResponse({ status: 200, description: 'Design retiré de la collection' })
  async removeItem(@Param('id') id: string, @Query('designId') designId: string, @Request() req) {
    return this.collectionsService.removeItem(id, designId, req.user.id, req.user.brandId || '');
  }
}
