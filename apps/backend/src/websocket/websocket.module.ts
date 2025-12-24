/**
 * ★★★ WEBSOCKET MODULE ★★★
 * Module NestJS pour WebSocket
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway';
import { PrismaModule } from '@/libs/prisma/prisma.module';

@Module({
  imports: [JwtModule, PrismaModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class WebSocketModule {}

