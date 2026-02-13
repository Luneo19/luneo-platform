import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { CurrentUser } from '@/common/types/user.types';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { TryOnConfigurationService } from '../services/try-on-configuration.service';
import { TryOnSessionService } from '../services/try-on-session.service';
import { TryOnScreenshotService } from '../services/try-on-screenshot.service';
import { CreateTryOnConfigurationDto } from '../dto/create-try-on-configuration.dto';
import { UpdateTryOnConfigurationDto } from '../dto/update-try-on-configuration.dto';
import { AddProductMappingDto } from '../dto/add-product-mapping.dto';

@ApiTags('try-on')
@ApiBearerAuth()
@Controller('try-on')
@UseGuards(JwtAuthGuard)
export class TryOnController {
  constructor(
    private readonly configurationService: TryOnConfigurationService,
    private readonly sessionService: TryOnSessionService,
    private readonly screenshotService: TryOnScreenshotService,
  ) {}

  // ========================================
  // CONFIGURATIONS ENDPOINTS
  // ========================================

  @Get('configurations')
  @ApiOperation({
    summary: 'Liste les configurations try-on d\'un projet',
  })
  @ApiParam({ name: 'projectId', description: 'ID du projet' })
  @ApiResponse({
    status: 200,
    description: 'Liste des configurations récupérée avec succès',
  })
  async findAllConfigurations(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Query('projectId') projectId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.configurationService.findAll(projectId, { page, limit }, req.user?.brandId);
  }

  @Get('configurations/:id')
  @ApiOperation({
    summary: 'Récupère une configuration par son ID',
  })
  @ApiParam({ name: 'id', description: 'ID de la configuration' })
  @ApiResponse({
    status: 200,
    description: 'Configuration récupérée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Configuration non trouvée' })
  async findOneConfiguration(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('id') id: string,
    @Query('projectId') projectId: string,
  ) {
    return this.configurationService.findOne(id, projectId, req.user?.brandId);
  }

  @Post('configurations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crée une nouvelle configuration try-on',
  })
  @ApiResponse({
    status: 201,
    description: 'Configuration créée avec succès',
  })
  async createConfiguration(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Body() dto: CreateTryOnConfigurationDto,
    @Query('projectId') projectId: string,
  ) {
    return this.configurationService.create(projectId, dto, req.user?.brandId);
  }

  @Patch('configurations/:id')
  @ApiOperation({
    summary: 'Met à jour une configuration',
  })
  @ApiParam({ name: 'id', description: 'ID de la configuration' })
  async updateConfiguration(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('id') id: string,
    @Query('projectId') projectId: string,
    @Body() dto: UpdateTryOnConfigurationDto,
  ) {
    return this.configurationService.update(id, projectId, dto, req.user?.brandId);
  }

  @Delete('configurations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprime une configuration',
  })
  @ApiParam({ name: 'id', description: 'ID de la configuration' })
  async removeConfiguration(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('id') id: string,
    @Query('projectId') projectId: string,
  ) {
    return this.configurationService.remove(id, projectId, req.user?.brandId);
  }

  @Post('configurations/:id/products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ajoute un produit à une configuration',
  })
  @ApiParam({ name: 'id', description: 'ID de la configuration' })
  async addProduct(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('id') configId: string,
    @Query('projectId') projectId: string,
    @Body() dto: AddProductMappingDto,
  ) {
    return this.configurationService.addProduct(configId, projectId, dto, req.user?.brandId);
  }

  @Delete('configurations/:id/products/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retire un produit d\'une configuration',
  })
  async removeProduct(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Param('id') configId: string,
    @Query('projectId') projectId: string,
    @Param('productId') productId: string,
  ) {
    return this.configurationService.removeProduct(
      configId,
      projectId,
      productId,
      req.user?.brandId,
    );
  }

  // ========================================
  // SESSIONS ENDPOINTS
  // ========================================

  @Get('analytics')
  @ApiOperation({ summary: 'Get try-on analytics' })
  async getAnalytics(
    @Request() req: ExpressRequest & { user?: CurrentUser },
    @Query('days') days?: number,
  ) {
    const user = req.user;
    const brandId = user?.brandId;
    return this.sessionService.getAnalytics(brandId, days ?? 30);
  }

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Démarre une nouvelle session try-on',
  })
  @ApiResponse({
    status: 201,
    description: 'Session démarrée avec succès',
  })
  async startSession(
    @Body()
    body: {
      configurationId: string;
      visitorId: string;
      deviceInfo?: Record<string, unknown>;
    },
  ) {
    return this.sessionService.startSession(
      body.configurationId,
      body.visitorId,
      body.deviceInfo,
    );
  }

  @Get('sessions/:sessionId')
  @ApiOperation({
    summary: 'Récupère une session par son ID',
  })
  @ApiParam({ name: 'sessionId', description: 'ID de la session' })
  async findOneSession(@Param('sessionId') sessionId: string) {
    return this.sessionService.findOne(sessionId);
  }

  @Patch('sessions/:sessionId')
  @ApiOperation({
    summary: 'Met à jour une session',
  })
  async updateSession(
    @Param('sessionId') sessionId: string,
    @Body()
    updates: {
      productsTried?: string[];
      screenshotsTaken?: number;
      shared?: boolean;
      converted?: boolean;
    },
  ) {
    return this.sessionService.updateSession(sessionId, updates);
  }

  @Post('sessions/:sessionId/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Termine une session',
  })
  async endSession(@Param('sessionId') sessionId: string) {
    return this.sessionService.endSession(sessionId);
  }

  // ========================================
  // SCREENSHOTS ENDPOINTS
  // ========================================

  @Post('sessions/:sessionId/screenshots')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crée un screenshot pour une session',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  async createScreenshot(
    @Param('sessionId') sessionId: string,
    @Body('productId') productId: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname: string } | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.screenshotService.create(
      sessionId,
      productId,
      file.buffer,
      {
        generateThumbnail: true,
      },
    );
  }

  @Get('screenshots/:id')
  @ApiOperation({
    summary: 'Récupère un screenshot par son ID',
  })
  async findOneScreenshot(@Param('id') id: string) {
    return this.screenshotService.findOne(id);
  }

  @Get('sessions/:sessionId/screenshots')
  @ApiOperation({
    summary: 'Liste les screenshots d\'une session',
  })
  async findAllScreenshots(@Param('sessionId') sessionId: string) {
    return this.screenshotService.findAll(sessionId);
  }

  @Post('screenshots/:id/share')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Génère une URL partageable pour un screenshot',
  })
  async generateSharedUrl(@Param('id') id: string) {
    return this.screenshotService.generateSharedUrl(id);
  }
}
