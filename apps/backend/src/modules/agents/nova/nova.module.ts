/**
 * @fileoverview Module Nova (Agent Support)
 * @module NovaModule
 */

/**
 * @fileoverview Module Nova (Agent Support)
 * @module NovaModule
 */

import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NovaController } from './nova.controller';
import { NovaService } from './nova.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { AgentsModule } from '../agents.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    forwardRef(() => AgentsModule), // Pour LLMRouterService et tous ses dépendances
    HttpModule,
  ],
  controllers: [NovaController],
  providers: [NovaService],
  exports: [NovaService],
})
export class NovaModule {}
