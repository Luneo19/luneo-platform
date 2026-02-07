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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CollaborationService } from './services/collaboration.service';
import { ResourceType, Permission } from './interfaces/collaboration.interface';

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
    @Request() req: any,
    @Body()
    body: {
      resourceType: ResourceType;
      resourceId: string;
      sharedWith: string[];
      permissions: Record<string, Permission[]>;
      isPublic?: boolean;
    },
  ) {
    const userId = req.user.id;
    const brandId = req.user.brandId;
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
  async getSharedResources(@Request() req: any) {
    return this.collaborationService.getSharedResources(req.user.id, req.user.brandId);
  }

  @Put('share/:id/permissions')
  @ApiOperation({ summary: 'Update permissions on a shared resource' })
  @ApiResponse({ status: 200, description: 'Permissions updated' })
  async updatePermissions(
    @Request() req: any,
    @Param('id') resourceId: string,
    @Body() body: { permissions: Record<string, Permission[]> },
  ) {
    return this.collaborationService.updatePermissions(
      resourceId,
      req.user.id,
      req.user.brandId,
      body.permissions,
    );
  }

  @Get('access')
  @ApiOperation({ summary: 'Check if current user has access to a resource' })
  @ApiResponse({ status: 200, description: 'Access check result' })
  async checkAccess(
    @Request() req: any,
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
    @Request() req: any,
    @Body()
    body: {
      resourceType: ResourceType;
      resourceId: string;
      content: string;
      parentId?: string;
      sharedResourceId?: string;
    },
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
  async deleteComment(@Request() req: any, @Param('id') commentId: string) {
    await this.collaborationService.deleteComment(commentId, req.user.id);
  }
}
