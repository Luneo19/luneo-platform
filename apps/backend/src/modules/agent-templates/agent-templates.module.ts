import { Module } from '@nestjs/common';
import { AgentTemplatesController } from './agent-templates.controller';
import { AgentTemplatesService } from './agent-templates.service';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';

@Module({
  imports: [PrismaOptimizedModule],
  controllers: [AgentTemplatesController],
  providers: [AgentTemplatesService],
  exports: [AgentTemplatesService],
})
export class AgentTemplatesModule {}
