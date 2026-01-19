import { Module } from '@nestjs/common';
import { Configurator3DController } from './controllers/configurator-3d.controller';
import { Configurator3DService } from './services/configurator-3d.service';
import { Configurator3DSessionService } from './services/configurator-3d-session.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [PrismaModule, SmartCacheModule],
  controllers: [Configurator3DController],
  providers: [Configurator3DService, Configurator3DSessionService],
  exports: [Configurator3DService, Configurator3DSessionService],
})
export class Configurator3DModule {}
