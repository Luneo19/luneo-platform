import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { CloudinaryModule } from '@/libs/storage/cloudinary.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { TokenBlacklistService } from '@/libs/auth/token-blacklist.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

@Module({
  imports: [PrismaModule, CloudinaryModule, SmartCacheModule],
  controllers: [UsersController],
  // SECURITY FIX: Added TokenBlacklistService for immediate token revocation on password change
  providers: [UsersService, TokenBlacklistService, RedisOptimizedService],
  exports: [UsersService],
})
export class UsersModule {}
