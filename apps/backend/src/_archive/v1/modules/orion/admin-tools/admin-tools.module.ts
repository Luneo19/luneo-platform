import { Module } from '@nestjs/common';
import { AdminToolsController } from './admin-tools.controller';
import { AdminToolsService } from './admin-tools.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminToolsController],
  providers: [AdminToolsService],
  exports: [AdminToolsService],
})
export class AdminToolsModule {}
