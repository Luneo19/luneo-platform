import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { HadesService } from './hades.service';
import { HadesController } from './hades.controller';

@Module({
  imports: [PrismaModule],
  controllers: [HadesController],
  providers: [HadesService],
  exports: [HadesService],
})
export class HadesModule {}
