/**
 * ★★★ CONTROLLER - AR PROJECTS ★★★
 * Project-scoped collaboration endpoints at ar-studio/projects/:projectId/...
 */

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ArCollaborationService } from '../services/ar-collaboration.service';
import { CurrentUser } from '@/common/types/user.types';
import { User } from '@/common/decorators/user.decorator';
import { InviteMemberDto } from '../dto/invite-member.dto';
import { AddCommentDto } from '../dto/add-comment.dto';

@ApiTags('AR Studio - Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ar-studio/projects')
export class ArProjectsController {
  constructor(private readonly arCollaborationService: ArCollaborationService) {}

  @Get(':projectId/members')
  @ApiOperation({ summary: 'List project members' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'List of project members' })
  async listMembers(
    @Param('projectId') projectId: string,
    @User() user: CurrentUser,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    const members = await this.arCollaborationService.getProjectMembers(
      projectId,
      user.brandId,
      user.id,
    );
    return { success: true, data: { members } };
  }

  @Post(':projectId/invite')
  @ApiOperation({ summary: 'Invite a member to the project by email' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Member invited successfully' })
  async inviteMember(
    @Param('projectId') projectId: string,
    @Body() dto: InviteMemberDto,
    @User() user: CurrentUser,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    const project = await this.arCollaborationService.inviteMemberByEmail(
      projectId,
      user.brandId,
      user.id,
      { email: dto.email, role: dto.role },
    );
    return { success: true, data: { project } };
  }

  @Get(':projectId/comments')
  @ApiOperation({ summary: 'List project comments' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'List of comments' })
  async listComments(
    @Param('projectId') projectId: string,
    @User() user: CurrentUser,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    const comments = await this.arCollaborationService.getComments(
      projectId,
      user.brandId,
    );
    return { success: true, data: { comments } };
  }

  @Post(':projectId/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a comment to the project' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 201, description: 'Comment added' })
  async addComment(
    @Param('projectId') projectId: string,
    @Body() dto: AddCommentDto,
    @User() user: CurrentUser,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    const comment = await this.arCollaborationService.addComment(
      projectId,
      user.brandId,
      user.id,
      { content: dto.content, modelId: dto.modelId, position: dto.position },
    );
    return { success: true, data: { comment } };
  }

  @Get(':projectId/activities')
  @ApiOperation({ summary: 'Get project activity log' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Activity log' })
  async getActivities(
    @Param('projectId') projectId: string,
    @User() user: CurrentUser,
  ) {
    if (!user.brandId) {
      throw new BadRequestException('User must be associated with a brand');
    }

    const activities = await this.arCollaborationService.getProjectActivities(
      projectId,
      user.brandId,
      user.id,
    );
    return { success: true, data: { activities } };
  }
}
