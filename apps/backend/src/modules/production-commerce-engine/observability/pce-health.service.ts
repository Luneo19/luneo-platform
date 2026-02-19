import { Injectable, Logger } from '@nestjs/common';
import { QueueManagerService } from '../queues/queue-manager.service';

@Injectable()
export class PCEHealthService {
  private readonly logger = new Logger(PCEHealthService.name);

  constructor(private readonly queueManager: QueueManagerService) {}

  async check(): Promise<{ healthy: boolean; details: Record<string, unknown> }> {
    try {
      const queues = await this.queueManager.getAllQueuesStatus();
      const issues: string[] = [];

      for (const [name, status] of Object.entries(queues)) {
        if (status.failed > 100) {
          issues.push(`${name}: ${status.failed} failed jobs`);
        }
        if (status.waiting > 10_000) {
          issues.push(`${name}: ${status.waiting} waiting (backlog)`);
        }
      }

      return {
        healthy: issues.length === 0,
        details: { queues, issues },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Health check failed: ${message}`);
      return { healthy: false, details: { error: message } };
    }
  }
}
