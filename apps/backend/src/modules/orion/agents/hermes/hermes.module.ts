import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { HermesService } from './hermes.service';
import { HermesController } from './hermes.controller';

@Module({
  imports: [PrismaModule],
  controllers: [HermesController],
  providers: [HermesService],
  exports: [HermesService],
})
export class HermesModule {}
