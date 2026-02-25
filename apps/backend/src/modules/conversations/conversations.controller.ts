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
}
