import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Render2DService } from './services/render-2d.service';
import { Render3DService } from './services/render-3d.service';
import { ExportService } from './services/export.service';
import { RenderRequest, RenderOptions } from './interfaces/render.interface';

@ApiTags('Render Engine')
@Controller('render')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RenderController {
  constructor(
    private readonly render2DService: Render2DService,
    private readonly render3DService: Render3DService,
    private readonly exportService: ExportService,
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
}


