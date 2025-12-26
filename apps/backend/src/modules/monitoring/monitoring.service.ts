import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { MetricsService } from './services/metrics.service';
import { AlertsService } from './services/alerts.service';

/**
 * Main Monitoring Service
 * Orchestrates all monitoring operations
 * Inspired by: Vercel Analytics, Linear Monitoring, Stripe Dashboard
 */
@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService,
    private readonly alertsService: AlertsService
  ) {}

  /**
   * Get comprehensive dashboard data
   * Returns all metrics, health status, and alerts
   */
  async getDashboard() {
    const [metrics, services, alerts] = await Promise.all([
      this.metricsService.getDashboardMetrics(),
      this.metricsService.getServiceHealth(),
      this.alertsService.getAlerts({ status: 'ACTIVE', limit: 10 }),
    ]);

    return {
      metrics,
      services,
      alerts,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Health check endpoint
   * Returns overall system health
   */
  async getHealthStatus() {
    const services = await this.metricsService.getServiceHealth();
    const activeAlerts = await this.alertsService.getAlerts({
      status: 'ACTIVE',
      severity: 'CRITICAL',
      limit: 1,
    });

    const overallStatus =
      services.every((s) => s.status === 'HEALTHY') && activeAlerts.length === 0
        ? 'HEALTHY'
        : services.some((s) => s.status === 'UNHEALTHY') || activeAlerts.length > 0
        ? 'UNHEALTHY'
        : 'DEGRADED';

    return {
      status: overallStatus,
      services: services.length,
      healthyServices: services.filter((s) => s.status === 'HEALTHY').length,
      degradedServices: services.filter((s) => s.status === 'DEGRADED').length,
      unhealthyServices: services.filter((s) => s.status === 'UNHEALTHY').length,
      criticalAlerts: activeAlerts.length,
      timestamp: new Date().toISOString(),
    };
  }
}

