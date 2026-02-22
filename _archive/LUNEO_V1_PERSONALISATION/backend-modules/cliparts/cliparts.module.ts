import { Module } from '@nestjs/common';
import { ClipartsController } from './cliparts.controller';
import { ClipartsService } from './cliparts.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClipartsController],
  providers: [ClipartsService],
  exports: [ClipartsService],
})
export class ClipartsModule {}
