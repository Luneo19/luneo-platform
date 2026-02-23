import { Controller, Get, Post, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { Job } from 'bullmq';
import { PlatformRole } from '@prisma/client';
import { DLQService } from './dlq.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/guards/roles.guard';

@Controller('admin/dlq')
@UseGuards(JwtAuthGuard, RolesGuard)
// @ts-expect-error NestJS decorator typing - Roles returns object
@Roles(PlatformRole.ADMIN)
export class DLQController {
  constructor(private readonly dlqService: DLQService) {}

  @Get('stats')
  async getStats() {
    return this.dlqService.getFailedStats();
  }

  @Get(':queueName')
  async getFailedJobs(
    @Param('queueName') queueName: string,
    @Query('limit') limit: string = '50',
  ) {
    const jobs = await this.dlqService.getFailedJobs(queueName, parseInt(limit, 10));
    return {
      queue: queueName,
      count: jobs.length,
      jobs: jobs.map((job) => ({
        id: job.id,
        data: job.data,
        failedReason: job.failedReason,
        failedAt: (job as Job & { timestamp?: number }).timestamp || new Date(),
        attemptsMade: job.attemptsMade,
      })),
    };
  }

  @Post(':queueName/:jobId/retry')
  async retryJob(@Param('queueName') queueName: string, @Param('jobId') jobId: string) {
    await this.dlqService.retryJob(queueName, jobId);
    return { success: true, message: `Job ${jobId} queued for retry` };
  }

  @Delete(':queueName/:jobId')
  async removeJob(@Param('queueName') queueName: string, @Param('jobId') jobId: string) {
    await this.dlqService.removeJob(queueName, jobId);
    return { success: true, message: `Job ${jobId} removed` };
  }

  @Post(':queueName/cleanup')
  async cleanup(
    @Param('queueName') queueName: string,
    @Query('days') days: string = '30',
  ) {
    const removed = await this.dlqService.cleanupOldFailedJobs(
      queueName,
      parseInt(days, 10),
    );
    return { success: true, removed };
  }
}

































