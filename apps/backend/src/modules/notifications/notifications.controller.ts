import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  Sse,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Public } from '@/common/decorators/public.decorator';
import { SubscribePushDto, UnsubscribePushDto, SendPushNotificationDto, SendPushToUserDto, CreateNotificationDto } from './dto/notifications.dto';
import { Request as ExpressRequest } from 'express';

interface MessageEvent {
  data: string | object;
}

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // ========================================
  // PUSH NOTIFICATIONS
  // ========================================

  @Get('push/vapid-key')
  /** @Public: VAPID key needed by client before auth to subscribe */
  @Public()
  @ApiOperation({ summary: 'Get VAPID public key for push subscription' })
  @ApiResponse({ status: 200, description: 'VAPID public key returned' })
  getVapidPublicKey() {
    return { publicKey: this.notificationsService.getVapidPublicKey() };
  }

  @Post('push/subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe to push notifications' })
  @ApiResponse({ status: 200, description: 'Successfully subscribed' })
  async subscribeToPush(
    @Body() body: SubscribePushDto,
    @Request() req: ExpressRequest,
  ) {
    const userId = body.userId || (req.user as { id: string }).id;
    return this.notificationsService.subscribeToPush(userId, body.subscription);
  }

  @Post('push/unsubscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  @ApiResponse({ status: 200, description: 'Successfully unsubscribed' })
  async unsubscribeFromPush(
    @Body() body: UnsubscribePushDto,
    @Request() req: ExpressRequest,
  ) {
    const userId = body.userId || (req.user as { id: string }).id;
    return this.notificationsService.unsubscribeFromPush(userId, body.endpoint);
  }

  @Post('push/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a push notification' })
  @ApiResponse({ status: 200, description: 'Push notification sent' })
  async sendPushNotification(
    @Body() body: SendPushNotificationDto,
  ) {
    return this.notificationsService.sendPushNotification(body.subscription, body.payload);
  }

  @Post('push/send-to-user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send push notification to all user subscriptions' })
  @ApiResponse({ status: 200, description: 'Push notifications sent' })
  async sendPushToUser(
    @Body() body: SendPushToUserDto,
    @Request() req: ExpressRequest & { user?: { id?: string; brandId?: string; role?: string } },
  ) {
    // SECURITY FIX: Verify target user belongs to same brand (unless admin)
    if (req.user?.brandId && req.user.role !== 'PLATFORM_ADMIN') {
      const targetUser = await this.notificationsService.getUserBrandId(body.userId);
      if (targetUser && targetUser !== req.user.brandId) {
        throw new ForbiddenException('Cannot send notifications to users from other brands');
      }
    }
    return this.notificationsService.sendPushToUser(body.userId, body.payload);
  }

  // ========================================
  // IN-APP NOTIFICATIONS & SSE
  // ========================================

  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SSE stream for real-time notifications' })
  @ApiResponse({ status: 200, description: 'Server-Sent Events stream' })
  streamNotifications(@Request() req: ExpressRequest): Observable<MessageEvent> {
    const userId = (req.user as { id: string }).id;
    return this.notificationsService.getStream(userId).pipe(
      map((ev) => ({ data: ev.data } as MessageEvent)),
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister toutes les notifications de l\'utilisateur' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Liste des notifications' })
  async findAll(
    @Request() req: ExpressRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.findAll((req.user as { id: string }).id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtenir une notification spécifique' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({ status: 200, description: 'Détails de la notification' })
  async findOne(@Param('id') id: string, @Request() req: ExpressRequest) {
    return this.notificationsService.findOne(id, (req.user as { id: string }).id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une nouvelle notification' })
  @ApiResponse({ status: 201, description: 'Notification créée' })
  async create(@Body() createNotificationDto: CreateNotificationDto, @Request() req: ExpressRequest) {
    return this.notificationsService.create({
      userId: (req.user as { id: string }).id,
      type: createNotificationDto.type ?? 'info',
      title: createNotificationDto.title,
      message: createNotificationDto.message,
      data: createNotificationDto.metadata,
    });
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({ status: 200, description: 'Notification marquée comme lue' })
  async markAsRead(@Param('id') id: string, @Request() req: ExpressRequest) {
    return this.notificationsService.markAsRead(id, (req.user as { id: string }).id);
  }

  @Post('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  @ApiResponse({ status: 200, description: 'Toutes les notifications marquées comme lues' })
  async markAllAsRead(@Request() req: ExpressRequest) {
    return this.notificationsService.markAllAsRead((req.user as { id: string }).id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une notification' })
  @ApiParam({ name: 'id', description: 'ID de la notification' })
  @ApiResponse({ status: 200, description: 'Notification supprimée' })
  async delete(@Param('id') id: string, @Request() req: ExpressRequest) {
    return this.notificationsService.delete(id, (req.user as { id: string }).id);
  }
}
