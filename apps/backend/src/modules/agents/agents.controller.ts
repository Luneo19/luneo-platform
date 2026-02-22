import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { TestAgentDto } from './dto/test-agent.dto';
import { AttachKnowledgeBaseDto } from './dto/attach-knowledge-base.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '@/common/types/user.types';
import { AgentStatus } from '@prisma/client';

@ApiTags('Agents')
@Controller('agents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiResponse({ status: 201, description: 'Agent created' })
  create(@CurrentUser() user: CurrentUserType, @Body() dto: CreateAgentDto) {
    return this.agentsService.create(user.organizationId!, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List agents for the current organization' })
  @ApiResponse({ status: 200, description: 'Paginated list of agents' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', enum: AgentStatus, required: false })
  findAll(
    @CurrentUser() user: CurrentUserType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: AgentStatus,
  ) {
    return this.agentsService.findAll(user.organizationId!, { page, limit, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an agent by ID' })
  @ApiResponse({ status: 200, description: 'Agent details' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  findOne(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.agentsService.findOne(id, user.organizationId!);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an agent' })
  @ApiResponse({ status: 200, description: 'Agent updated' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  update(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: UpdateAgentDto,
  ) {
    return this.agentsService.update(id, user.organizationId!, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete an agent' })
  @ApiResponse({ status: 200, description: 'Agent deleted' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  remove(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.agentsService.remove(id, user.organizationId!);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish an agent (set status to ACTIVE)' })
  @ApiResponse({ status: 200, description: 'Agent published' })
  @ApiResponse({ status: 400, description: 'Agent already active' })
  publish(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.agentsService.publish(id, user.organizationId!);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause an active agent' })
  @ApiResponse({ status: 200, description: 'Agent paused' })
  @ApiResponse({ status: 400, description: 'Agent is not active' })
  pause(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.agentsService.pause(id, user.organizationId!);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test agent in sandbox mode (no cost, no conversation saved)' })
  @ApiResponse({ status: 200, description: 'Test response with latency' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  test(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: TestAgentDto,
  ) {
    return this.agentsService.testAgent(id, user.organizationId!, dto.message);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate an agent' })
  @ApiResponse({ status: 201, description: 'Agent duplicated' })
  @ApiResponse({ status: 403, description: 'Agent limit reached' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  duplicate(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.agentsService.duplicate(id, user.organizationId!);
  }

  @Post(':id/knowledge-bases')
  @ApiOperation({ summary: 'Attach a knowledge base to an agent' })
  attachKnowledgeBase(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() dto: AttachKnowledgeBaseDto,
  ) {
    return this.agentsService.attachKnowledgeBase(
      id,
      user.organizationId!,
      dto.knowledgeBaseId,
    );
  }

  @Delete(':id/knowledge-bases/:kbId')
  @ApiOperation({ summary: 'Detach a knowledge base from an agent' })
  detachKnowledgeBase(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Param('kbId') kbId: string,
  ) {
    return this.agentsService.detachKnowledgeBase(id, user.organizationId!, kbId);
  }

  // ═══════════════ Flow Builder Endpoints ═══════════════

  @Patch(':id/flow')
  @ApiOperation({ summary: 'Save agent flow (nodes + edges)' })
  async saveFlow(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() body: { nodes: unknown[]; edges: unknown[] },
  ) {
    return this.agentsService.saveFlow(id, user.organizationId!, body);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test agent flow in sandbox mode' })
  async testFlow(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() body: { message: string; flow: { nodes: unknown[]; edges: unknown[] } },
  ) {
    return this.agentsService.testFlow(id, user.organizationId!, body.message, body.flow);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Validate and publish agent flow' })
  async publishFlow(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() body: { flow: { nodes: unknown[]; edges: unknown[] } },
  ) {
    return this.agentsService.publishFlow(id, user.organizationId!, body.flow);
  }
}
