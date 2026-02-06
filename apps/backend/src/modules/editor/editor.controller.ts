/**
 * ★★★ CONTROLLER - EDITOR ★★★
 * Controller NestJS pour l'éditeur de designs
 * Respecte la Bible Luneo : validation Zod, ApiResponseBuilder, error handling
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
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
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { EditorService } from './editor.service';
import { CurrentUser } from '@/common/types/user.types';
import { User } from '@/common/decorators/user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddHistoryEntryDto } from './dto/add-history-entry.dto';

@ApiTags('Editor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('editor')
export class EditorController {
  constructor(private readonly editorService: EditorService) {}

  @Get('projects')
  @ApiOperation({ summary: 'Get all editor projects' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of projects' })
  async listProjects(@User() user: CurrentUser) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.editorService.listProjects(user.brandId, user.id);
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Get a specific project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  async getProject(@Param('id') id: string, @User() user: CurrentUser) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.editorService.getProject(id, user.brandId);
  }

  @Post('projects')
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Project created' })
  @HttpCode(HttpStatus.CREATED)
  async createProject(
    @Body() dto: CreateProjectDto,
    @User() user: CurrentUser,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.editorService.createProject(user.brandId, user.id, dto);
  }

  @Put('projects/:id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project updated' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  async updateProject(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @User() user: CurrentUser,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.editorService.updateProject(id, user.brandId, user.id, dto);
  }

  @Delete('projects/:id')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Project deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProject(@Param('id') id: string, @User() user: CurrentUser) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    await this.editorService.deleteProject(id, user.brandId, user.id);
  }

  @Post('projects/:id/export')
  @ApiOperation({ summary: 'Export a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiQuery({ name: 'format', enum: ['png', 'jpg', 'svg', 'pdf'] })
  @ApiResponse({ status: HttpStatus.OK, description: 'Export URL' })
  async exportProject(
    @Param('id') id: string,
    @Query('format') format: 'png' | 'jpg' | 'svg' | 'pdf',
    @User() user: CurrentUser,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.editorService.exportProject(id, user.brandId, format);
  }

  @Post('projects/:id/history')
  @ApiOperation({ summary: 'Add a history entry (for undo/redo)' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'History entry added' })
  async addHistoryEntry(
    @Param('id') id: string,
    @Body() dto: AddHistoryEntryDto,
    @User() user: CurrentUser,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.editorService.addHistoryEntry(id, user.brandId, user.id, dto);
  }
}


