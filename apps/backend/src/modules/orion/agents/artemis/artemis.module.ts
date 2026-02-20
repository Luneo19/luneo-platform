import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { ArtemisService } from './artemis.service';
import { ArtemisController } from './artemis.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ArtemisController],
  providers: [ArtemisService],
  exports: [ArtemisService],
})
export class ArtemisModule {}
