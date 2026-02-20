import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { AthenaService } from './athena.service';
import { AthenaController } from './athena.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AthenaController],
  providers: [AthenaService],
  exports: [AthenaService],
})
export class AthenaModule {}
