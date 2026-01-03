/**
 * ★★★ MODULE - ANALYTICS AVANCÉES ★★★
 * Module NestJS pour analytics avancées
 * Respecte les patterns existants du projet
 */

import { Module } from '@nestjs/common';
import { AnalyticsAdvancedService } from './services/analytics-advanced.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AnalyticsAdvancedService],
  exports: [AnalyticsAdvancedService],
})
export class AnalyticsAdvancedModule {}






