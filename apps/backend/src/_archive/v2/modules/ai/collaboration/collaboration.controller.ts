import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { User } from '@/common/decorators/user.decorator';
import { CurrentUser } from '@/common/types/user.types';
import { SharedGenerationService } from './shared-generation.service';

@ApiTags('AI Studio - Collaboration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-studio/collaboration')
export class CollaborationController {
  constructor(private readonly sharedGeneration: SharedGenerationService) {}

  @Post('workspaces')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a shared workspace' })
  async createWorkspace(
    @User() user: CurrentUser,
    @Body() body: { name: string; brandId: string },
  ) {
    const userId = user.id;
    if (!body.name) throw new BadRequestException('Workspace name is required');
    if (!body.brandId) throw new BadRequestException('Brand ID is required');
    return this.sharedGeneration.createWorkspace({
      name: body.name,
      ownerId: userId,
      brandId: body.brandId,
    });
  }

  @Get('workspaces')
  @ApiOperation({ summary: 'List workspaces for current user' })
  async listWorkspaces(@User() user: CurrentUser) {
    return this.sharedGeneration.listWorkspaces(user.id);
  }

  @Get('workspaces/:id')
  @ApiOperation({ summary: 'Get workspace by ID' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  async getWorkspace(@Param('id') id: string) {
    return this.sharedGeneration.getWorkspace(id);
  }

  @Post('workspaces/:id/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  async joinWorkspace(@Param('id') id: string, @User() user: CurrentUser) {
    return this.sharedGeneration.joinWorkspace(id, user.id);
  }

  @Post('workspaces/:id/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  async leaveWorkspace(@Param('id') id: string, @User() user: CurrentUser) {
    await this.sharedGeneration.leaveWorkspace(id, user.id);
  }

  @Post('workspaces/:id/generations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add a generation to the workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  async addGeneration(
    @Param('id') id: string,
    @User() user: CurrentUser,
    @Body() body: { generationId: string },
  ) {
    if (!body.generationId) throw new BadRequestException('Generation ID is required');
    await this.sharedGeneration.addGeneration(id, body.generationId, user.id);
  }

  @Delete('workspaces/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Close workspace (owner only)' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  async closeWorkspace(@Param('id') id: string, @User() user: CurrentUser) {
    await this.sharedGeneration.closeWorkspace(id, user.id);
  }
}
