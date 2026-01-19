import { Module } from '@nestjs/common';
import { ProjectsController } from './controllers/projects.controller';
import { ProjectsService } from './services/projects.service';
import { WorkspacesService } from './services/workspaces.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [PrismaModule, SmartCacheModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, WorkspacesService],
  exports: [ProjectsService, WorkspacesService],
})
export class ProjectsModule {}
