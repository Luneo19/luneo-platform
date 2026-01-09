import { Module } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [PrismaModule, SmartCacheModule],
  providers: [CreditsService],
  exports: [CreditsService],
})
export class CreditsModule {}













