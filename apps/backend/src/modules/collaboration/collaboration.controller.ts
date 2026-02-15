/**
 * CONTROLLER - COLLABORATION
 * REST endpoints for sharing resources and commenting
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
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RequestWithUser } from '@/common/types/user.types';
import { CollaborationService } from './services/collaboration.service';
import { ResourceType, Permission } from './interfaces/collaboration.interface';
import { ShareResourceDto, UpdatePermissionsDto, AddCommentDto } from './dto';

@ApiTags('collaboration')
@Controller('collaboration')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Post('share')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Share a resource with other users' })
  @ApiResponse({ status: 201, description: 'Resource shared successfully' })
  async shareResource(
    @Request() req: RequestWithUser,
    @Body() body: ShareResourceDto,
  ) {
    const userId = req.user.id;
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new BadRequestException('Brand ID required. Please complete your brand setup first.');
    }
    return this.collaborationService.shareResource(
      userId,
      brandId,
      body.resourceType,
      body.resourceId,
      body.sharedWith,
      body.permissions,
      body.isPublic,
    );
  }

  @Get('shared')
  @ApiOperation({ summary: 'Get resources shared with the current user' })
  @ApiResponse({ status: 200, description: 'List of shared resources' })
  async getSharedResources(@Request() req: RequestWithUser) {
    const brandId = req.user.brandId;
    if (!brandId) {
      if (req.user.role === 'PLATFORM_ADMIN') {
        return [];
      }
      throw new BadRequestException('Brand ID required. Please complete your brand setup first.');
    }
    return this.collaborationService.getSharedResources(req.user.id, brandId);
  }

  @Put('share/:id/permissions')
  @ApiOperation({ summary: 'Update permissions on a shared resource' })
  @ApiResponse({ status: 200, description: 'Permissions updated' })
  async updatePermissions(
    @Request() req: RequestWithUser,
    @Param('id') resourceId: string,
    @Body() body: UpdatePermissionsDto,
  ) {
    const brandId = req.user.brandId;
    if (!brandId) {
      throw new BadRequestException('Brand ID required. Please complete your brand setup first.');
    }
    return this.collaborationService.updatePermissions(
      resourceId,
      req.user.id,
      brandId,
      body.permissions,
    );
  }

  @Get('access')
  @ApiOperation({ summary: 'Check if current user has access to a resource' })
  @ApiResponse({ status: 200, description: 'Access check result' })
  async checkAccess(
    @Request() req: RequestWithUser,
    @Query('resourceType') resourceType: ResourceType,
    @Query('resourceId') resourceId: string,
    @Query('permission') permission: Permission,
  ) {
    const hasAccess = await this.collaborationService.checkAccess(
      req.user.id,
      resourceType,
      resourceId,
      permission,
    );
    return { hasAccess };
  }

  @Post('comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a comment on a resource' })
  @ApiResponse({ status: 201, description: 'Comment created' })
  async addComment(
    @Request() req: RequestWithUser,
    @Body() body: AddCommentDto,
  ) {
    return this.collaborationService.addComment(
      req.user.id,
      body.resourceType,
      body.resourceId,
      body.content,
      body.parentId,
      body.sharedResourceId,
    );
  }

  @Get('comments')
  @ApiOperation({ summary: 'Get comments for a resource' })
  @ApiResponse({ status: 200, description: 'List of comments' })
  async getComments(
    @Query('resourceType') resourceType: ResourceType,
    @Query('resourceId') resourceId: string,
    @Query('sharedResourceId') sharedResourceId?: string,
  ) {
    return this.collaborationService.getComments(resourceType, resourceId, sharedResourceId);
  }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 204, description: 'Comment deleted' })
  async deleteComment(@Request() req: RequestWithUser, @Param('id') commentId: string) {
    await this.collaborationService.deleteComment(commentId, req.user.id);
  }
}
