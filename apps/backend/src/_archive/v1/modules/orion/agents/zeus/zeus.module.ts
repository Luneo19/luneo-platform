import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { ZeusService } from './zeus.service';
import { ZeusController } from './zeus.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ZeusController],
  providers: [ZeusService],
  exports: [ZeusService],
})
export class ZeusModule {}
