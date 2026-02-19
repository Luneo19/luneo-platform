import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PCE_QUEUES, PIPELINE_STAGES } from '../pce.constants';
import { PipelineOrchestratorService } from '../core/pipeline-orchestrator.service';
import { PCEOrchestratorService } from '../core/pce-orchestrator.service';

interface ExecuteStagePayload {
  pipelineId: string;
  stage: string;
}

interface RetryStagePayload {
  pipelineId: string;
  stage: string;
}

@Processor(PCE_QUEUES.PIPELINE)
export class PipelineProcessor extends WorkerHost {
  private readonly logger = new Logger(PipelineProcessor.name);

  constructor(
    private readonly pipelineOrchestrator: PipelineOrchestratorService,
    private readonly pceOrchestrator: PCEOrchestratorService,
  ) {
    super();
  }

  async process(job: Job<ExecuteStagePayload | RetryStagePayload>): Promise<void> {
    const { name, data } = job;

    this.logger.log(`Processing job: ${name} for pipeline ${data.pipelineId}`);

    switch (name) {
      case 'execute-stage':
        await this.executeStage(data as ExecuteStagePayload);
        break;
      case 'retry-stage':
        await this.retryStage(data as RetryStagePayload);
        break;
      case 'render-item':
        await this.handleRenderItem(data as unknown as Record<string, unknown>);
        break;
      case 'create-production':
        await this.handleCreateProduction(data as unknown as Record<string, unknown>);
        break;
      default:
        this.logger.warn(`Unknown job type: ${name}`);
    }
  }

  private async executeStage(payload: ExecuteStagePayload) {
    const { pipelineId, stage } = payload;

    try {
      if (stage === PIPELINE_STAGES.VALIDATION) {
        // Validation is auto-completed
        await this.pipelineOrchestrator.advanceStage(pipelineId);
      }
      // Other stages are handled by their respective event listeners
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Stage execution failed: ${message}`);
      await this.pceOrchestrator.handleStageFailed(pipelineId, stage, message, true);
    }
  }

  private async retryStage(payload: RetryStagePayload) {
    try {
      await this.pipelineOrchestrator.retryStage(payload.pipelineId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Retry failed: ${message}`);
    }
  }

  private async handleRenderItem(data: Record<string, unknown>) {
    this.logger.log(`Render item queued for pipeline: ${data.pipelineId}`);
    // Delegates to existing render module via events
  }

  private async handleCreateProduction(data: Record<string, unknown>) {
    this.logger.log(`Production creation queued for pipeline: ${data.pipelineId}`);
    // Delegates to existing print-on-demand module via events
  }
}
