import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { TicketsService } from './services/tickets.service';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SupportController],
  providers: [SupportService, TicketsService, KnowledgeBaseService],
  exports: [SupportService, TicketsService, KnowledgeBaseService],
})
export class SupportModule {}

