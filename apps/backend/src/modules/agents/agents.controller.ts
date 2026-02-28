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
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CorrectionsService } from './corrections.service';
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
  constructor(
    private readonly agentsService: AgentsService,
    private readonly correctionsService: CorrectionsService,
  ) {}

  private requireOrg(user: CurrentUserType): string {
    if (!user.organizationId) {
      throw new ForbiddenException('Vous devez créer ou rejoindre une organisation pour gérer des agents.');
    }
    return user.organizationId;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiResponse({ status: 201, description: 'Agent created' })
  create(@CurrentUser() user: CurrentUserType, @Body() dto: CreateAgentDto) {
    return this.agentsService.create(this.requireOrg(user), dto);
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
    return this.agentsService.findAll(this.requireOrg(user), { page, limit, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an agent by ID' })
  @ApiResponse({ status: 200, description: 'Agent details' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  findOne(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.agentsService.findOne(id, this.requireOrg(user));
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
    return this.agentsService.update(id, this.requireOrg(user), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete an agent' })
  @ApiResponse({ status: 200, description: 'Agent deleted' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  remove(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.agentsService.remove(id, this.requireOrg(user));
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish an agent (set status to ACTIVE)' })
  @ApiResponse({ status: 200, description: 'Agent published' })
  @ApiResponse({ status: 400, description: 'Agent already active' })
  publish(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.agentsService.publish(id, this.requireOrg(user));
  }

  @Get(':id/readiness')
  @ApiOperation({ summary: 'Get publish readiness checklist for an agent' })
  @ApiResponse({ status: 200, description: 'Readiness status and missing prerequisites' })
  readiness(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.agentsService.getReadiness(id, this.requireOrg(user));
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause an active agent' })
  @ApiResponse({ status: 200, description: 'Agent paused' })
  @ApiResponse({ status: 400, description: 'Agent is not active' })
  pause(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.agentsService.pause(id, this.requireOrg(user));
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
    return this.agentsService.testAgent(id, this.requireOrg(user), dto.message);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate an agent' })
  @ApiResponse({ status: 201, description: 'Agent duplicated' })
  @ApiResponse({ status: 403, description: 'Agent limit reached' })
  @ApiResponse({ status: 404, description: 'Agent not found' })
  duplicate(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.agentsService.duplicate(id, this.requireOrg(user));
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
      this.requireOrg(user),
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
    return this.agentsService.detachKnowledgeBase(id, this.requireOrg(user), kbId);
  }

  // ═══════════════ Flow Builder Endpoints ═══════════════

  @Patch(':id/flow')
  @ApiOperation({ summary: 'Save agent flow (nodes + edges)' })
  async saveFlow(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() body: { nodes: unknown[]; edges: unknown[] },
  ) {
    return this.agentsService.saveFlow(id, this.requireOrg(user), body);
  }

  @Post(':id/flow/test')
  @ApiOperation({ summary: 'Test agent flow in sandbox mode' })
  async testFlow(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() body: { message: string; flow: { nodes: unknown[]; edges: unknown[] } },
  ) {
    return this.agentsService.testFlow(id, this.requireOrg(user), body.message, body.flow);
  }

  @Post(':id/flow/publish')
  @ApiOperation({ summary: 'Validate and publish agent flow' })
  async publishFlow(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() body: { flow: { nodes: unknown[]; edges: unknown[] } },
  ) {
    return this.agentsService.publishFlow(id, this.requireOrg(user), body.flow);
  }

  // ═══════════════ Agent Learning / Corrections ═══════════════

  @Post(':id/corrections')
  @ApiOperation({ summary: 'Submit a correction for an agent response' })
  async createCorrection(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Body() body: {
      messageId: string;
      conversationId: string;
      originalContent: string;
      correctedContent: string;
      userQuestion?: string;
    },
  ) {
    return this.correctionsService.createCorrection(id, this.requireOrg(user), {
      ...body,
      correctedBy: user.id,
    });
  }

  @Get(':id/corrections')
  @ApiOperation({ summary: 'List corrections for an agent' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async listCorrections(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.correctionsService.listCorrections(
      id,
      this.requireOrg(user),
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
