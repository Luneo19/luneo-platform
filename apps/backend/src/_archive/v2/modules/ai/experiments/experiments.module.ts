import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { AbTestingService } from './ab-testing.service';
import { AbTestingController } from './ab-testing.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AbTestingController],
  providers: [AbTestingService],
  exports: [AbTestingService],
})
export class ExperimentsModule {}
