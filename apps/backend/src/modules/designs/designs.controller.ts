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

@ApiTags('designs')
@Controller('designs')
@ApiBearerAuth()
export class DesignsController {
  constructor(private readonly designsService: DesignsService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Lister tous les designs de l\'utilisateur',
    description: 'Récupère une liste paginée des designs créés par l\'utilisateur authentifié, avec filtres optionnels par statut et recherche textuelle. Les designs sont triés par date de création (plus récents en premier).',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page (défaut: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'éléments par page (défaut: 20, max: 100)', example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], description: 'Filtrer par statut de génération', example: 'COMPLETED' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Recherche textuelle dans les noms et descriptions de designs', example: 'collier' })
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
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.designsService.findAll(req.user, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      search,
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
  async create(@Body() createDesignDto: any, @Request() req) {
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
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('autoOnly') autoOnly?: string,
  ) {
    return this.designsService.getVersions(id, req.user, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      autoOnly: autoOnly === 'true',
    });
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Créer une nouvelle version d\'un design' })
  @ApiParam({ name: 'id', description: 'ID du design' })
  @ApiResponse({ status: 201, description: 'Version créée' })
  async createVersion(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.designsService.createVersion(id, body, req.user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un design' })
  @ApiParam({ name: 'id', description: 'ID du design' })
  @ApiResponse({ status: 200, description: 'Design mis à jour' })
  async update(@Param('id') id: string, @Body() updateDto: any, @Request() req) {
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
    @Body() body: {
      format?: 'pdf' | 'png' | 'jpg' | 'svg';
      quality?: 'low' | 'medium' | 'high' | 'ultra';
      dimensions?: { width: number; height: number };
      imageUrl?: string;
      designData?: any;
    },
    @Request() req,
  ) {
    return this.designsService.exportForPrint(
      id,
      {
        format: body.format || 'pdf',
        quality: body.quality || 'high',
        dimensions: body.dimensions,
        imageUrl: body.imageUrl,
        designData: body.designData,
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
    @Body() body: {
      designId: string;
      format?: 'pdf' | 'png' | 'jpg' | 'svg';
      quality?: 'low' | 'medium' | 'high' | 'ultra';
      dimensions?: { width: number; height: number };
      imageUrl?: string;
      designData?: any;
    },
    @Request() req,
  ) {
    return this.designsService.exportForPrint(
      body.designId,
      {
        format: body.format || 'pdf',
        quality: body.quality || 'high',
        dimensions: body.dimensions,
        imageUrl: body.imageUrl,
        designData: body.designData,
      },
      req.user,
    );
  }
}
