import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Logger,
  HttpCode,
  HttpStatus,
  Headers,
  Ip,
  Sse,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { Public } from '@/common/decorators/public.decorator';
import { WidgetApiService } from './widget-api.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Widget (Public)')
@Controller('widget')
@Public()
export class WidgetApiController {
  private readonly logger = new Logger(WidgetApiController.name);

  constructor(private readonly widgetApiService: WidgetApiService) {}

  @Get('config/:widgetId')
  @ApiOperation({ summary: 'Get widget configuration' })
  @ApiResponse({ status: 200, description: 'Configuration du widget' })
  @ApiResponse({ status: 404, description: 'Widget introuvable' })
  async getConfig(@Param('widgetId') widgetId: string) {
    return this.widgetApiService.getWidgetConfig(widgetId);
  }

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation créée' })
  @ApiResponse({ status: 404, description: 'Widget introuvable' })
  async startConversation(
    @Body() dto: StartConversationDto,
    @Headers('origin') origin: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.widgetApiService.startConversation(dto, {
      origin: origin ?? '',
      ip,
      userAgent: userAgent ?? '',
    });
  }

  @Post('conversations/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message envoyé' })
  @ApiResponse({ status: 404, description: 'Conversation introuvable' })
  async sendMessage(
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
    @Headers('x-conversation-token') conversationToken?: string,
  ) {
    return this.widgetApiService.sendMessage(conversationId, dto, conversationToken);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get conversation messages' })
  @ApiQuery({ name: 'after', required: false, description: 'ISO timestamp pour pagination' })
  @ApiResponse({ status: 200, description: 'Liste des messages' })
  @ApiResponse({ status: 404, description: 'Conversation introuvable' })
  async getMessages(
    @Param('id') conversationId: string,
    @Query('after') after?: string,
    @Query('token') token?: string,
    @Headers('x-conversation-token') conversationToken?: string,
  ) {
    return this.widgetApiService.getMessages(conversationId, after, token || conversationToken);
  }

  @Sse('conversations/:id/stream')
  @ApiOperation({ summary: 'SSE stream for real-time message updates' })
  @ApiResponse({ status: 200, description: 'Server-Sent Events stream' })
  streamMessages(
    @Param('id') conversationId: string,
    @Query('token') token?: string,
    @Headers('x-conversation-token') conversationToken?: string,
  ): Observable<MessageEvent> {
    this.logger.log(`SSE stream ouvert pour conversation ${conversationId}`);
    return this.widgetApiService.getStream(conversationId, token || conversationToken);
  }
}
