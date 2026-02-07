import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Request,
  Query,
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
import { DesignsService } from './designs.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CreateDesignDto } from './dto/create-design.dto';
import { FindAllDesignsQueryDto } from './dto/find-all-designs-query.dto';
import { GetVersionsQueryDto } from './dto/get-versions-query.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateDesignDto } from './dto/update-design.dto';
import { ExportForPrintDto } from './dto/export-for-print.dto';

@ApiTags('designs')
@Controller('designs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DesignsController {
  constructor(private readonly designsService: DesignsService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Lister tous les designs de l\'utilisateur',
    description: 'Récupère une liste paginée des designs créés par l\'utilisateur authentifié, avec filtres optionnels par statut et recherche textuelle. Les designs sont triés par date de création (plus récents en premier).',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des designs récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'design_123' },
              name: { type: 'string', example: 'Collier personnalisé' },
              status: { type: 'string', example: 'COMPLETED' },
              imageUrl: { type: 'string', example: 'https://cdn.luneo.app/designs/123.png' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 150 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Non authentifié - Token JWT manquant ou invalide' })
  @ApiResponse({ status: 400, description: 'Paramètres de requête invalides' })
  async findAll(
    @Request() req,
    @Query() query: FindAllDesignsQueryDto,
  ) {
    return this.designsService.findAll(req.user, {
      page: query.page,
      limit: query.limit,
      status: query.status,
      search: query.search,
    });
  }

  @Post()
  @ApiOperation({ 
    summary: 'Créer un nouveau design avec IA',
    description: 'Crée un nouveau design et lance la génération avec IA. Le design est créé avec le statut PENDING et la génération est traitée de manière asynchrone via une queue BullMQ. Retourne l\'ID du design et le statut initial.',
  })
  @ApiResponse({
    status: 201,
    description: 'Design créé avec succès. Génération IA lancée en arrière-plan.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'design_123' },
        status: { type: 'string', example: 'PENDING' },
        productId: { type: 'string', example: 'prod_456' },
        prompt: { type: 'string', example: 'Collier minimaliste or 18k' },
        estimatedTime: { type: 'number', example: 30 },
        message: { type: 'string', example: 'Génération en cours...' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Données invalides - Vérifier le prompt, productId et options' })
  @ApiResponse({ status: 401, description: 'Non authentifié - Token JWT manquant ou invalide' })
  @ApiResponse({ status: 402, description: 'Crédits insuffisants - L\'utilisateur n\'a pas assez de crédits pour cette génération' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé - Le productId fourni n\'existe pas' })
  @ApiResponse({ status: 429, description: 'Trop de requêtes - Limite de générations par minute atteinte' })
  async create(@Body() createDesignDto: CreateDesignDto, @Request() req) {
    return this.designsService.create(createDesignDto, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir les détails d\'un design' })
  @ApiParam({ name: 'id', description: 'ID du design' })
  @ApiResponse({
    status: 200,
    description: 'Détails du design',
  })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.designsService.findOne(id, req.user);
  }

  @Post(':id/upgrade-highres')
  @ApiOperation({ summary: 'Générer une version haute résolution' })
  @ApiParam({ name: 'id', description: 'ID du design' })
  @ApiResponse({
    status: 200,
    description: 'Génération haute résolution lancée',
  })
  async upgradeToHighRes(@Param('id') id: string, @Request() req) {
    return this.designsService.upgradeToHighRes(id, req.user);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Obtenir l\'historique des versions d\'un design' })
  @ApiParam({ name: 'id', description: 'ID du design' })
  @ApiResponse({ status: 200, description: 'Liste des versions' })
  async getVersions(
    @Param('id') id: string,
    @Request() req,
    @Query() query: GetVersionsQueryDto,
  ) {
    return this.designsService.getVersions(id, req.user, {
      page: query.page,
      limit: query.limit,
      autoOnly: query.autoOnly,
    });
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Créer une nouvelle version d\'un design' })
  @ApiParam({ name: 'id', description: 'ID du design' })
  @ApiResponse({ status: 201, description: 'Version créée' })
  async createVersion(@Param('id') id: string, @Body() createVersionDto: CreateVersionDto, @Request() req) {
    return this.designsService.createVersion(id, createVersionDto, req.user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un design' })
  @ApiParam({ name: 'id', description: 'ID du design' })
  @ApiResponse({ status: 200, description: 'Design mis à jour' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateDesignDto, @Request() req) {
    return this.designsService.update(id, updateDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un design' })
  @ApiParam({ name: 'id', description: 'ID du design' })
  @ApiResponse({ status: 200, description: 'Design supprimé' })
  async delete(@Param('id') id: string, @Request() req) {
    return this.designsService.delete(id, req.user);
  }

  @Post(':id/export-print')
  @ApiOperation({ summary: 'Exporter un design pour l\'impression (PDF, PNG, JPG, SVG)' })
  @ApiParam({ name: 'id', description: 'ID du design' })
  @ApiResponse({
    status: 200,
    description: 'Design exporté avec succès',
  })
  async exportForPrint(
    @Param('id') id: string,
    @Body() exportDto: ExportForPrintDto,
    @Request() req,
  ) {
    return this.designsService.exportForPrint(
      id,
      {
        format: exportDto.format || 'pdf',
        quality: exportDto.quality || 'high',
        dimensions: exportDto.dimensions,
        imageUrl: exportDto.imageUrl,
        designData: exportDto.designData,
      },
      req.user,
    );
  }

  // Alias pour la route /designs/export-print (sans :id)
  @Post('export-print')
  @ApiOperation({ summary: 'Exporter un design pour l\'impression (alias)' })
  @ApiResponse({
    status: 200,
    description: 'Design exporté avec succès',
  })
  async exportForPrintAlias(
    @Body() exportDto: ExportForPrintDto,
    @Request() req,
  ) {
    if (!exportDto.designId) {
      throw new BadRequestException('designId is required for this endpoint');
    }
    return this.designsService.exportForPrint(
      exportDto.designId,
      {
        format: exportDto.format || 'pdf',
        quality: exportDto.quality || 'high',
        dimensions: exportDto.dimensions,
        imageUrl: exportDto.imageUrl,
        designData: exportDto.designData,
      },
      req.user,
    );
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Create share link for a design' })
  @ApiParam({ name: 'id', description: 'Design ID' })
  @ApiResponse({ status: 201, description: 'Share link created' })
  async createShare(
    @Param('id') id: string,
    @Body() body: { expires_in_days?: number; password?: string },
    @Request() req,
  ) {
    const result = await this.designsService.share(
      id,
      { expiresInDays: body.expires_in_days ?? 30 },
      req.user,
    );
    return {
      share: {
        token: result.shareToken,
        shareUrl: result.shareUrl,
        expires_at: result.expiresAt,
        created_at: new Date().toISOString(),
      },
    };
  }

  @Get(':id/share')
  @ApiOperation({ summary: 'Get share status for a design' })
  @ApiParam({ name: 'id', description: 'Design ID' })
  @ApiResponse({ status: 200, description: 'Share status' })
  async getShareStatus(@Param('id') id: string, @Request() req) {
    return this.designsService.getShareStatus(id, req.user);
  }
}
