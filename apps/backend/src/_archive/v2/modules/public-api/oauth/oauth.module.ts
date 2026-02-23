import { Module } from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { OAuthController } from './oauth.controller';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [PrismaModule, SmartCacheModule],
  providers: [OAuthService],
  controllers: [OAuthController],
  exports: [OAuthService],
})
export class OAuthModule {}


