import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { CurrentBrand } from '@/common/decorators/current-brand.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';

import { PCEOrchestratorService } from './core/pce-orchestrator.service';
import { PipelineOrchestratorService } from './core/pipeline-orchestrator.service';
import { PCEMetricsService } from './observability/pce-metrics.service';
import { QueueManagerService } from './queues/queue-manager.service';
import { ProcessOrderDto, CancelPipelineDto, AdvancePipelineDto } from './dto/process-order.dto';
import { PCEQuota } from './decorators/pce-quota.decorator';

@ApiTags('PCE - Production Commerce Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pce')
export class PCEController {
  constructor(
    private readonly pceOrchestrator: PCEOrchestratorService,
    private readonly pipelineOrchestrator: PipelineOrchestratorService,
    private readonly metrics: PCEMetricsService,
    private readonly queueManager: QueueManagerService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Dashboard ──────────────────────────────────────────────────────

  @Get('dashboard')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get PCE dashboard data' })
  async getDashboard(@CurrentBrand() brand: { id: string }) {
    const [stats, queueStatus, recentPipelines, alerts] = await Promise.all([
      this.pceOrchestrator.getDashboardStats(brand.id),
      this.queueManager.getAllQueuesStatus(),
      this.getRecentPipelines(brand.id),
      this.metrics.getRecentAlerts(brand.id),
    ]);

    return { stats, queueStatus, recentPipelines, alerts };
  }

  @Get('dashboard/metrics')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get PCE metrics' })
  @ApiQuery({ name: 'period', required: false, enum: ['hour', 'day', 'week', 'month'] })
  async getMetrics(
    @CurrentBrand() brand: { id: string },
    @Query('period') period: string = 'day',
  ) {
    return this.metrics.getMetrics(brand.id, period);
  }

  // ── Order Processing ───────────────────────────────────────────────

  @Post('process-order')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @PCEQuota(['orders', 'concurrent_pipelines'])
  @ApiOperation({ summary: 'Start processing an order through the pipeline' })
  async processOrder(
    @Body() body: ProcessOrderDto,
    @CurrentBrand() brand: { id: string },
  ) {
    return this.pceOrchestrator.processOrder({
      orderId: body.orderId,
      brandId: brand.id,
      options: body.options,
    });
  }

  @Get('orders/:orderId/status')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get order processing status' })
  async getOrderStatus(
    @Param('orderId') orderId: string,
    @CurrentBrand() brand: { id: string },
  ) {
    return this.pceOrchestrator.getOrderStatus(orderId, brand.id);
  }

  // ── Pipelines ──────────────────────────────────────────────────────

  @Get('pipelines')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'List pipelines' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async listPipelines(
    @CurrentBrand() brand: { id: string },
    @Query('status') status?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    return this.getRecentPipelines(brand.id, status, limit, offset);
  }

  @Get('pipelines/:id')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get pipeline details' })
  async getPipeline(
    @Param('id') id: string,
    @CurrentBrand() brand: { id: string },
  ) {
    return this.pipelineOrchestrator.getPipelineStatus(id, brand.id);
  }

  @Put('pipelines/:id/advance')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Manually advance pipeline to next stage' })
  async advancePipeline(
    @Param('id') id: string,
    @Body() body: AdvancePipelineDto,
  ) {
    return this.pipelineOrchestrator.advanceStage(id, body.targetStage, 'manual');
  }

  @Put('pipelines/:id/retry')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Retry failed pipeline stage' })
  async retryPipeline(@Param('id') id: string) {
    return this.pipelineOrchestrator.retryStage(id);
  }

  @Put('pipelines/:id/cancel')
  @Roles(UserRole.BRAND_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Cancel pipeline' })
  async cancelPipeline(
    @Param('id') id: string,
    @Body() body: CancelPipelineDto,
  ) {
    return this.pipelineOrchestrator.cancelPipeline(id, body.reason);
  }

  // ── Queues ─────────────────────────────────────────────────────────

  @Get('queues')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get all queue statuses' })
  async getQueues() {
    return this.queueManager.getAllQueuesStatus();
  }

  @Get('queues/:name')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get specific queue details' })
  async getQueue(@Param('name') name: string) {
    return this.queueManager.getQueueCounts(name);
  }

  @Put('queues/:name/pause')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Pause queue' })
  async pauseQueue(@Param('name') name: string) {
    await this.queueManager.pauseQueue(name);
    return { paused: true };
  }

  @Put('queues/:name/resume')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Resume queue' })
  async resumeQueue(@Param('name') name: string) {
    await this.queueManager.resumeQueue(name);
    return { resumed: true };
  }

  @Post('queues/:name/retry-failed')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Retry failed jobs in queue' })
  async retryFailedJobs(
    @Param('name') name: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ) {
    const retried = await this.queueManager.retryFailedJobs(name, limit);
    return { retried };
  }

  // ── Helpers ────────────────────────────────────────────────────────

  private async getRecentPipelines(
    brandId: string,
    status?: string,
    limit = 10,
    offset = 0,
  ) {
    const where: Record<string, unknown> = { brandId };
    if (status) {
      where.currentStage = status;
    }

    return this.prisma.pipeline.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            totalCents: true,
            customerEmail: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }
}
