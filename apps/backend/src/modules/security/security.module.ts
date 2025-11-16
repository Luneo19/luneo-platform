import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SecurityController } from './security.controller';
import { RBACService } from './services/rbac.service';
import { AuditLogsService } from './services/audit-logs.service';
import { GDPRService } from './services/gdpr.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { JwtRotationService } from './services/jwt-rotation.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { TenantRateLimitGuard } from './guards/tenant-rate-limit.guard';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';
import { RedisOptimizedModule } from '@/libs/redis/redis-optimized.module';

@Module({
  imports: [
    PrismaModule,
    SmartCacheModule,
    RedisOptimizedModule,
    JwtModule,
  ],
  controllers: [SecurityController],
  providers: [
    RBACService,
    AuditLogsService,
    GDPRService,
    RateLimiterService,
    JwtRotationService,
    PermissionsGuard,
    TenantRateLimitGuard,
  ],
  exports: [
    RBACService,
    AuditLogsService,
    GDPRService,
    RateLimiterService,
    JwtRotationService,
    PermissionsGuard,
    TenantRateLimitGuard,
  ],
})
export class SecurityModule {}

