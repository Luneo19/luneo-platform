import { Controller, Post, Get, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Render2DService } from './services/render-2d.service';
import { Render3DService } from './services/render-3d.service';
import { ExportService } from './services/export.service';
import { CADIntegrationService } from './services/cad-integration.service';
import { RenderRequest, RenderOptions } from './interfaces/render.interface';
import { ValidateCADDto } from './dto/validate-cad.dto';
import { GenerateLODDto } from './dto/generate-lod.dto';
import { GenerateMarketingRenderDto } from './dto/generate-marketing-render.dto';
import { GenerateVariantDto, GenerateVariantsBatchDto } from './dto/generate-variant.dto';

@ApiTags('Render Engine')
@Controller('render')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RenderController {
  constructor(
    private readonly render2DService: Render2DService,
    private readonly render3DService: Render3DService,
    private readonly exportService: ExportService,
    private readonly cadIntegration: CADIntegrationService,
  ) {}

  @Post('2d')
  @ApiOperation({ summary: 'Génère un rendu 2D' })
  @ApiResponse({ status: 200, description: 'Rendu généré avec succès' })
  async render2D(@Body() request: RenderRequest) {
    return this.render2DService.render2D(request);
  }

  @Post('3d')
  @ApiOperation({ summary: 'Génère un rendu 3D' })
  @ApiResponse({ status: 200, description: 'Rendu généré avec succès' })
  async render3D(@Body() request: RenderRequest) {
    return this.render3DService.render3D(request);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Obtient les métriques de rendu' })
  @ApiResponse({ status: 200, description: 'Métriques récupérées' })
  async getMetrics() {
    return this.render2DService.getRenderMetrics();
  }

  @Post('cad/validate')
  @ApiOperation({ summary: 'Valide un design CAD pour la production' })
  @ApiResponse({ status: 200, description: 'Validation CAD effectuée' })
  async validateCAD(@Body() dto: ValidateCADDto) {
    return this.cadIntegration.validateForProduction(dto as any);
  }

  @Post('lod/generate')
  @ApiOperation({ summary: 'Génère les niveaux LOD pour un design' })
  @ApiResponse({ status: 200, description: 'LODs générés' })
  async generateLODs(@Body() dto: GenerateLODDto) {
    return this.cadIntegration.generateLODs(dto.designId, dto.sourceModelUrl);
  }

  @Get('lod/:designId')
  @ApiOperation({ summary: 'Récupère l\'URL LOD appropriée' })
  @ApiResponse({ status: 200, description: 'URL LOD récupérée' })
  async getLOD(
    @Param('designId') designId: string,
    @Query('device') device: 'mobile' | 'desktop' = 'desktop',
  ) {
    // Utiliser LODService directement via CADIntegration
    // Pour l'instant, retourner une URL par défaut
    return { url: null, device };
  }

  @Post('marketing')
  @ApiOperation({ summary: 'Génère un rendu marketing' })
  @ApiResponse({ status: 200, description: 'Rendu marketing généré' })
  async generateMarketingRender(@Body() dto: GenerateMarketingRenderDto) {
    return this.cadIntegration.generateMarketingRender(dto as any);
  }

  @Post('variant')
  @ApiOperation({ summary: 'Génère un variant (matériau/pierre) sans re-export' })
  @ApiResponse({ status: 200, description: 'Variant généré' })
  async generateVariant(@Body() dto: GenerateVariantDto) {
    return this.cadIntegration.generateVariant(
      dto.designId,
      dto.baseModelUrl,
      dto.material as any,
    );
  }

  @Post('variants/batch')
  @ApiOperation({ summary: 'Génère plusieurs variants en batch' })
  @ApiResponse({ status: 200, description: 'Variants générés' })
  async generateVariantsBatch(@Body() dto: GenerateVariantsBatchDto) {
    return this.cadIntegration.generateVariantsBatch(
      dto.designId,
      dto.baseModelUrl,
      dto.materials as any,
    );
  }
}


