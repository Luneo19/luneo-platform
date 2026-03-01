import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '@/common/types/user.types';
import { ConversationsService } from './conversations.service';
import { HandoffService } from './handoff.service';
import { SlaService } from './sla.service';
import { ChannelType, SlaPriority } from '@prisma/client';
import { InboxCollaborationService } from './inbox-collaboration.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { ConversationQueryDto } from './dto/conversation-query.dto';

@ApiTags('conversations')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ConversationsController {
  private readonly logger = new Logger(ConversationsController.name);

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly handoffService: HandoffService,
    private readonly slaService: SlaService,
    private readonly inboxCollaborationService: InboxCollaborationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liste des conversations (inbox)' })
  @ApiResponse({ status: 200, description: 'Liste paginée des conversations' })
  async getInbox(
    @Query() query: ConversationQueryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.conversationsService.getInbox(query, user);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des conversations' })
  @ApiResponse({ status: 200, description: 'Stats pour le dashboard' })
  async getStats(@CurrentUser() user: CurrentUserType) {
    return this.conversationsService.getStats(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une conversation avec messages' })
  @ApiParam({ name: 'id', description: 'ID de la conversation' })
  @ApiResponse({ status: 200, description: 'Conversation avec messages' })
  async getById(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.conversationsService.getById(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une conversation' })
  @ApiResponse({ status: 201, description: 'Conversation créée' })
  async create(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.conversationsService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une conversation' })
  @ApiParam({ name: 'id', description: 'ID de la conversation' })
  @ApiResponse({ status: 200, description: 'Conversation mise à jour' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.conversationsService.update(id, dto, user);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Ajouter un message à une conversation' })
  @ApiParam({ name: 'id', description: 'ID de la conversation' })
  @ApiResponse({ status: 201, description: 'Message ajouté' })
  async addMessage(
    @Param('id') id: string,
    @Body() dto: AddMessageDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.conversationsService.addMessage(id, dto, user);
  }

  @Post(':id/escalate')
  @ApiOperation({ summary: 'Escalader une conversation' })
  @ApiParam({ name: 'id', description: 'ID de la conversation' })
  @ApiResponse({ status: 200, description: 'Conversation escaladée' })
  async escalate(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.conversationsService.escalate(id, user);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Résoudre une conversation' })
  @ApiParam({ name: 'id', description: 'ID de la conversation' })
  @ApiResponse({ status: 200, description: 'Conversation résolue' })
  async resolve(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.conversationsService.resolve(id, user);
  }

  @Post(':id/feedback')
  @ApiOperation({ summary: 'Enregistrer un feedback post-conversation' })
  async submitFeedback(
    @Param('id') id: string,
    @Body() body: { rating: number; comment?: string },
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.conversationsService.submitFeedback(id, body, user);
  }

  @Get('escalations/queue')
  @ApiOperation({ summary: 'Queue opérationnelle des escalations' })
  @ApiResponse({ status: 200, description: 'Liste priorisée des escalations' })
  async getEscalationQueue(@CurrentUser() user: CurrentUserType) {
    if (!user.organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    return this.handoffService.getEscalationQueue(user.organizationId);
  }

  @Get('escalations/metrics')
  @ApiOperation({ summary: 'Métriques opérationnelles handoff' })
  async getHandoffMetrics(
    @CurrentUser() user: CurrentUserType,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (!user.organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    const now = new Date();
    const fromDate = from
      ? new Date(from)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : now;
    return this.handoffService.getOperationalMetrics(user.organizationId, {
      from: fromDate,
      to: toDate,
    });
  }

  @Post(':id/handoff-feedback')
  @ApiOperation({ summary: 'Enregistrer feedback qualité handoff' })
  async recordHandoffFeedback(
    @Param('id') id: string,
    @Body()
    body: {
      feedbackType: 'false_positive' | 'good_escalation' | 'late_escalation';
      note?: string;
    },
  ) {
    return this.handoffService.recordHandoffFeedback({
      conversationId: id,
      feedbackType: body.feedbackType,
      note: body.note,
    });
  }

  @Get('sla/configs')
  @ApiOperation({ summary: 'Lister la configuration SLA active' })
  async getSlaConfigs(@CurrentUser() user: CurrentUserType) {
    if (!user.organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    return this.slaService.getConfigs(user.organizationId);
  }

  @Post('sla/configs')
  @ApiOperation({ summary: 'Creer ou mettre a jour une regle SLA' })
  async upsertSlaConfig(
    @CurrentUser() user: CurrentUserType,
    @Body()
    body: {
      priority: SlaPriority;
      channelType?: ChannelType;
      firstResponseTargetSeconds: number;
      resolutionTargetSeconds: number;
    },
  ) {
    if (!user.organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    return this.slaService.upsertConfig({
      organizationId: user.organizationId,
      priority: body.priority,
      channelType: body.channelType,
      firstResponseTargetSeconds: body.firstResponseTargetSeconds,
      resolutionTargetSeconds: body.resolutionTargetSeconds,
    });
  }

  @Get('sla/breaches')
  @ApiOperation({ summary: 'Lister les depassements SLA' })
  async listSlaBreaches(
    @CurrentUser() user: CurrentUserType,
    @Query('limit') limit?: string,
  ) {
    if (!user.organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    return this.slaService.listBreaches(
      user.organizationId,
      limit ? Number(limit) : 50,
    );
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assigner une conversation a un agent humain' })
  async assignConversation(
    @Param('id') id: string,
    @Body()
    body: {
      assignedToUserId: string;
      assignedBy?: 'AUTO_RULE' | 'MANUAL' | 'ESCALATION';
    },
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.inboxCollaborationService.assignConversation(
      id,
      body.assignedToUserId,
      (body.assignedBy as 'AUTO_RULE' | 'MANUAL' | 'ESCALATION') ?? 'MANUAL',
      user,
    );
  }

  @Get(':id/notes')
  @ApiOperation({ summary: 'Lister les notes internes d une conversation' })
  async listInternalNotes(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.inboxCollaborationService.listInternalNotes(id, user);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Ajouter une note interne a une conversation' })
  async addInternalNote(
    @Param('id') id: string,
    @Body() body: { content: string },
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.inboxCollaborationService.addInternalNote(id, body.content, user);
  }

  @Get('settings/canned-responses')
  @ApiOperation({ summary: 'Lister les reponses pre-enregistrees de l organisation' })
  async listCannedResponses(@CurrentUser() user: CurrentUserType) {
    return this.inboxCollaborationService.listCannedResponses(user);
  }

  @Post('settings/canned-responses')
  @ApiOperation({ summary: 'Creer une reponse pre-enregistree' })
  async createCannedResponse(
    @CurrentUser() user: CurrentUserType,
    @Body()
    body: {
      title: string;
      content: string;
      category?: string;
      shortcut?: string;
    },
  ) {
    return this.inboxCollaborationService.createCannedResponse(user, body);
  }

  @Get('settings/assignment-rules')
  @ApiOperation({ summary: 'Lister les regles d assignation' })
  async listAssignmentRules(@CurrentUser() user: CurrentUserType) {
    return this.inboxCollaborationService.listAssignmentRules(user);
  }

  @Post('settings/assignment-rules')
  @ApiOperation({ summary: 'Creer une regle d assignation' })
  async createAssignmentRule(
    @CurrentUser() user: CurrentUserType,
    @Body()
    body: {
      name: string;
      conditions?: Record<string, unknown>;
      assignToUserId?: string;
      assignToTeam?: string;
      priority?: number;
      isActive?: boolean;
    },
  ) {
    return this.inboxCollaborationService.upsertAssignmentRule(user, body);
  }
}
