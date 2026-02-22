import { Module } from '@nestjs/common';
import { QuickWinsController } from './quick-wins.controller';
import { QuickWinsService } from './quick-wins.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuickWinsController],
  providers: [QuickWinsService],
  exports: [QuickWinsService],
})
export class QuickWinsModule {}
