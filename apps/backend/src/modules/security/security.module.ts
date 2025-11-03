import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { RBACService } from './services/rbac.service';
import { AuditLogsService } from './services/audit-logs.service';
import { GDPRService } from './services/gdpr.service';
import { PermissionsGuard } from './guards/permissions.guard';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

@Module({
  imports: [PrismaModule, SmartCacheModule],
  controllers: [SecurityController],
  providers: [
    RBACService,
    AuditLogsService,
    GDPRService,
    PermissionsGuard,
  ],
  exports: [
    RBACService,
    AuditLogsService,
    GDPRService,
    PermissionsGuard,
  ],
})
export class SecurityModule {}

