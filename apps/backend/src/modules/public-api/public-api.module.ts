import { Module } from '@nestjs/common';
import { PrismaOptimizedModule } from '@/libs/prisma/prisma-optimized.module';
import { AgentsModule } from '@/modules/agents/agents.module';
import { WebhooksModule } from '@/modules/webhooks/webhooks.module';
import { PublicApiController } from './public-api.controller';
import { PublicApiManagementController } from './public-api-management.controller';
import { PublicApiService } from './public-api.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ApiScopeGuard } from './guards/api-scope.guard';
import { ApiPermissionGuard } from './guards/api-permission.guard';
import { ApiQuotaGuard } from './guards/api-quota.guard';

@Module({
  imports: [PrismaOptimizedModule, AgentsModule, WebhooksModule],
  controllers: [PublicApiController, PublicApiManagementController],
  providers: [
    PublicApiService,
    ApiKeyGuard,
    ApiScopeGuard,
    ApiPermissionGuard,
    ApiQuotaGuard,
  ],
  exports: [PublicApiService],
})
export class PublicApiModule {}
