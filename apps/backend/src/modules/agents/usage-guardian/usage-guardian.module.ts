/**
 * @fileoverview Module Usage Guardian - Contrôle d'usage et quotas IA
 * @module UsageGuardianModule
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Export des services utilisés par d'autres modules
 * - ✅ Import des dépendances nécessaires
 * - ✅ Structure NestJS standard
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { SmartCacheModule } from '@/libs/cache/smart-cache.module';

// Services
import { QuotaManagerService } from './services/quota-manager.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { CostCalculatorService } from './services/cost-calculator.service';
import { BillingSyncService } from './services/billing-sync.service';
import { LimitsConfigService } from './services/limits-config.service';

@Module({
  imports: [PrismaModule, SmartCacheModule],
  providers: [
    QuotaManagerService,
    RateLimiterService,
    CostCalculatorService,
    BillingSyncService,
    LimitsConfigService,
  ],
  exports: [
    // ✅ RÈGLE: Exporter tous les services utilisés ailleurs
    QuotaManagerService,
    RateLimiterService,
    CostCalculatorService,
    BillingSyncService,
    LimitsConfigService,
  ],
})
export class UsageGuardianModule {}
