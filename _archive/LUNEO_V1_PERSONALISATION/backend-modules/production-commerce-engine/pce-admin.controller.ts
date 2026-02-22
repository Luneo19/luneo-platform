import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { QueueHealthService } from './queues/queue-health.service';
import { QueueMonitorService } from './queues/queue-monitor.service';
import { QueueManagerService } from './queues/queue-manager.service';
import { PCE_QUEUES } from './pce.constants';

// QueueManagerService and PCE_QUEUES used for retry-all-failed

@ApiTags('PCE Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pce/admin')
export class PCEAdminController {
  constructor(
    private readonly queueHealth: QueueHealthService,
    private readonly queueMonitor: QueueMonitorService,
    private readonly queueManager: QueueManagerService,
  ) {}

  @Get('system-health')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get PCE system health (queues, Redis)' })
  async getSystemHealth() {
    const detailed = await this.queueHealth.getDetailedStatus();
    return detailed;
  }

  @Get('queue-dashboard')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get queue dashboard data' })
  async getQueueDashboard() {
    return this.queueMonitor.getDashboardData();
  }

  @Post('maintenance/clean-stale')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Clean stale jobs (completed/failed older than 24h)' })
  async cleanStale() {
    const results = await this.queueManager.cleanStaleJobs(86400_000, 1000);
    const total = Object.values(results).reduce((acc, r) => acc + r.completed + r.failed, 0);
    return { message: `Cleaned ${total} stale jobs`, results };
  }

  @Post('maintenance/retry-all-failed')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Retry all failed jobs across PCE queues' })
  async retryAllFailed() {
    const queueNames = [
      PCE_QUEUES.PIPELINE,
      PCE_QUEUES.FULFILLMENT,
      PCE_QUEUES.RENDER,
      PCE_QUEUES.SYNC,
      PCE_QUEUES.PRODUCTION,
      PCE_QUEUES.WEBHOOKS,
      PCE_QUEUES.NOTIFICATIONS,
    ];
    const results: Record<string, number> = {};
    for (const name of queueNames) {
      try {
        results[name] = await this.queueManager.retryFailedJobs(name, 500);
      } catch {
        results[name] = 0;
      }
    }
    const total = Object.values(results).reduce((a, b) => a + b, 0);
    return { message: `Retried ${total} failed jobs`, results };
  }
}
