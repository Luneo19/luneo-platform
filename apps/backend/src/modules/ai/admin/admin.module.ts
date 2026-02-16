import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { AIAdminService } from './ai-admin.service';
import { AIAdminController } from './ai-admin.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AIAdminController],
  providers: [AIAdminService],
  exports: [AIAdminService],
})
export class AIAdminModule {}
