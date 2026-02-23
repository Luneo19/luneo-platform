import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { RedisOptimizedModule } from '@/libs/redis/redis-optimized.module';
import { WebSocketModule } from '@/websocket/websocket.module';

@Module({
  imports: [EventEmitterModule, PrismaModule, RedisOptimizedModule, WebSocketModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationDispatcherService],
  exports: [NotificationsService, NotificationDispatcherService],
})
export class NotificationsModule {}
