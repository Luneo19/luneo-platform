/**
 * ★★★ CONTROLLER - AR COLLABORATION ★★★
 * Controller NestJS pour la collaboration AR
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
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ARPlanGuard } from '@/common/guards/ar-plan.guard';
import { ArCollaborationService } from '../services/ar-collaboration.service';
import { CurrentUser } from '@/common/types/user.types';
import { User } from '@/common/decorators/user.decorator';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { AddMemberDto } from '../dto/add-member.dto';
import { AddCommentDto } from '../dto/add-comment.dto';

@ApiTags('AR Collaboration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ARPlanGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
@Controller('ar-studio/collaboration')
export class ArCollaborationController {
  constructor(private readonly arCollaborationService: ArCollaborationService) {}

  @Get('projects')
  @ApiOperation({ summary: 'Get all AR projects' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of projects' })
  async listProjects(@User() user: CurrentUser) {
    if (!user.brandId) {
      if (user.role === 'PLATFORM_ADMIN') {
        return [];
      }
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.arCollaborationService.listProjects(user.brandId, user.id);
  }

  @Get('projects/:id')
  @ApiOperation({ summary: 'Get a specific project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Project details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Project not found' })
  async getProject(@Param('id') id: string, @User() user: CurrentUser) {
    if (!user.brandId) {
      if (user.role === 'PLATFORM_ADMIN') {
        return null;
      }
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.arCollaborationService.getProject(id, user.brandId, user.id);
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

    return this.arCollaborationService.createProject(user.brandId, user.id, {
      ...dto,
      permissions: dto.permissions || {
        canEdit: true,
        canDelete: true,
        canInvite: true,
        canComment: true,
      },
    });
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

    return this.arCollaborationService.updateProject(id, user.brandId, user.id, dto);
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

    await this.arCollaborationService.deleteProject(id, user.brandId, user.id);
  }

  @Post('projects/:id/members')
  @ApiOperation({ summary: 'Add a member to a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Member added' })
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @User() user: CurrentUser,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.arCollaborationService.addMember(id, user.brandId, user.id, dto);
  }

  @Post('projects/:id/comments')
  @ApiOperation({ summary: 'Add a comment to a project' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Comment added' })
  @HttpCode(HttpStatus.CREATED)
  async addComment(
    @Param('id') id: string,
    @Body() dto: AddCommentDto,
    @User() user: CurrentUser,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    return this.arCollaborationService.addComment(id, user.brandId, user.id, dto);
  }
}


