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
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProjectsService } from '../services/projects.service';
import { WorkspacesService } from '../services/workspaces.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { ProjectQueryDto } from '../dto/project-query.dto';
import { Request as ExpressRequest } from 'express';
import { CurrentUser } from '@/common/types/user.types';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Liste tous les projets',
    description: 'Récupère une liste paginée de projets pour l\'organisation de l\'utilisateur',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des projets récupérée avec succès',
  })
  async findAll(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Query() query: ProjectQueryDto,
  ) {
    if (!req.user.brandId) {
      throw new BadRequestException('User must have a brandId');
    }
    return this.projectsService.findAll(req.user.brandId, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupère un projet par son ID',
    description: 'Récupère les détails complets d\'un projet, incluant ses workspaces',
  })
  @ApiParam({ name: 'id', description: 'ID du projet' })
  @ApiResponse({
    status: 200,
    description: 'Projet récupéré avec succès',
  })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  async findOne(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    if (!req.user.brandId) {
      throw new BadRequestException('User must have a brandId');
    }
    return this.projectsService.findOne(id, req.user.brandId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crée un nouveau projet',
    description: 'Crée un nouveau projet avec génération automatique de la clé API',
  })
  @ApiResponse({
    status: 201,
    description: 'Projet créé avec succès',
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(
    @Body() dto: CreateProjectDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    if (!req.user.brandId) {
      throw new BadRequestException('User must have a brandId');
    }
    return this.projectsService.create(req.user.brandId, dto, req.user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Met à jour un projet',
    description: 'Met à jour les informations d\'un projet existant',
  })
  @ApiParam({ name: 'id', description: 'ID du projet' })
  @ApiResponse({
    status: 200,
    description: 'Projet mis à jour avec succès',
  })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  async update(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Body() dto: UpdateProjectDto,
  ) {
    if (!req.user.brandId) {
      throw new BadRequestException('User must have a brandId');
    }
    return this.projectsService.update(id, req.user.brandId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive un projet',
    description: 'Archive un projet (soft delete en changeant le statut)',
  })
  @ApiParam({ name: 'id', description: 'ID du projet' })
  @ApiResponse({
    status: 200,
    description: 'Projet archivé avec succès',
  })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  async remove(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    if (!req.user.brandId) {
      throw new BadRequestException('User must have a brandId');
    }
    return this.projectsService.remove(id, req.user.brandId);
  }

  @Post(':id/regenerate-api-key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Régénère la clé API d\'un projet',
    description: 'Génère une nouvelle clé API pour le projet (l\'ancienne devient invalide)',
  })
  @ApiParam({ name: 'id', description: 'ID du projet' })
  @ApiResponse({
    status: 200,
    description: 'Clé API régénérée avec succès',
  })
  @ApiResponse({ status: 404, description: 'Projet non trouvé' })
  async regenerateApiKey(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    if (!req.user.brandId) {
      throw new BadRequestException('User must have a brandId');
    }
    return this.projectsService.regenerateApiKey(id, req.user.brandId);
  }

  // ========================================
  // WORKSPACES ENDPOINTS
  // ========================================

  @Get(':id/workspaces')
  @ApiOperation({
    summary: 'Liste les workspaces d\'un projet',
    description: 'Récupère tous les workspaces (environnements) d\'un projet',
  })
  @ApiParam({ name: 'id', description: 'ID du projet' })
  @ApiResponse({
    status: 200,
    description: 'Liste des workspaces récupérée avec succès',
  })
  async findAllWorkspaces(
    @Param('id') projectId: string,
    @Request() req: ExpressRequest & { user?: CurrentUser },
  ) {
    // SECURITY FIX: Verify project belongs to user's brand
    await this.verifyProjectAccess(projectId, req.user);
    return this.workspacesService.findAll(projectId);
  }

  @Get(':id/workspaces/:workspaceId')
  @ApiOperation({
    summary: 'Récupère un workspace par son ID',
  })
  @ApiParam({ name: 'id', description: 'ID du projet' })
  @ApiParam({ name: 'workspaceId', description: 'ID du workspace' })
  @ApiResponse({
    status: 200,
    description: 'Workspace récupéré avec succès',
  })
  @ApiResponse({ status: 404, description: 'Workspace non trouvé' })
  async findOneWorkspace(
    @Param('id') projectId: string,
    @Param('workspaceId') workspaceId: string,
    @Request() req: ExpressRequest & { user?: CurrentUser },
  ) {
    await this.verifyProjectAccess(projectId, req.user);
    return this.workspacesService.findOne(workspaceId, projectId);
  }

  @Post(':id/workspaces')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crée un nouveau workspace',
    description: 'Crée un nouvel environnement (dev/staging/prod) pour un projet',
  })
  @ApiParam({ name: 'id', description: 'ID du projet' })
  @ApiResponse({
    status: 201,
    description: 'Workspace créé avec succès',
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async createWorkspace(
    @Param('id') projectId: string,
    @Body() dto: CreateWorkspaceDto,
    @Request() req: ExpressRequest & { user?: CurrentUser },
  ) {
    await this.verifyProjectAccess(projectId, req.user);
    return this.workspacesService.create(projectId, dto);
  }

  @Patch(':id/workspaces/:workspaceId')
  @ApiOperation({
    summary: 'Met à jour un workspace',
  })
  @ApiParam({ name: 'id', description: 'ID du projet' })
  @ApiParam({ name: 'workspaceId', description: 'ID du workspace' })
  @ApiResponse({
    status: 200,
    description: 'Workspace mis à jour avec succès',
  })
  async updateWorkspace(
    @Param('id') projectId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: Partial<CreateWorkspaceDto>,
    @Request() req: ExpressRequest & { user?: CurrentUser },
  ) {
    await this.verifyProjectAccess(projectId, req.user);
    return this.workspacesService.update(workspaceId, projectId, dto);
  }

  @Delete(':id/workspaces/:workspaceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprime un workspace',
  })
  @ApiParam({ name: 'id', description: 'ID du projet' })
  @ApiParam({ name: 'workspaceId', description: 'ID du workspace' })
  @ApiResponse({
    status: 200,
    description: 'Workspace supprimé avec succès',
  })
  async removeWorkspace(
    @Param('id') projectId: string,
    @Param('workspaceId') workspaceId: string,
    @Request() req: ExpressRequest & { user?: CurrentUser },
  ) {
    await this.verifyProjectAccess(projectId, req.user);
    return this.workspacesService.remove(workspaceId, projectId);
  }

  /**
   * SECURITY FIX: Verify that the project belongs to the user's brand.
   * Prevents IDOR on workspace endpoints.
   */
  private async verifyProjectAccess(projectId: string, user?: CurrentUser) {
    if (!user?.brandId) return; // Skip for unauthenticated/admin
    if (user.role === 'PLATFORM_ADMIN') return;
    // Use findOne with the user's brandId — throws NotFoundException if project doesn't belong to brand
    await this.projectsService.findOne(projectId, user.brandId);
  }
}
