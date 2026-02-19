import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PCE_EVENTS } from '../pce.constants';
import type { StageTransitionEvent } from '../interfaces/pce.interfaces';

/**
 * Thin wrapper around EventEmitter2 for PCE-specific events.
 * Provides type-safe emit helpers and centralised logging.
 */
@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  emitStageCompleted(event: StageTransitionEvent) {
    this.logger.debug(`Stage completed: ${event.stage} -> ${event.nextStage}`);
    this.eventEmitter.emit(PCE_EVENTS.PIPELINE_STAGE_COMPLETED, event);
  }

  emitStageFailed(event: StageTransitionEvent) {
    this.logger.warn(`Stage failed: ${event.stage} - ${event.error}`);
    this.eventEmitter.emit(PCE_EVENTS.PIPELINE_STAGE_FAILED, event);
  }

  emitStageStarted(event: StageTransitionEvent) {
    this.logger.debug(`Stage started: ${event.stage}`);
    this.eventEmitter.emit(PCE_EVENTS.PIPELINE_STAGE_STARTED, event);
  }

  emitPipelineCompleted(data: { pipelineId: string; orderId: string; brandId: string }) {
    this.logger.log(`Pipeline completed: ${data.pipelineId}`);
    this.eventEmitter.emit(PCE_EVENTS.PIPELINE_COMPLETED, data);
  }

  emitPipelineFailed(data: { pipelineId: string; orderId: string; brandId: string; error: string }) {
    this.logger.error(`Pipeline failed: ${data.pipelineId} - ${data.error}`);
    this.eventEmitter.emit(PCE_EVENTS.PIPELINE_FAILED, data);
  }

  emit(event: string, data: unknown) {
    this.logger.debug(`Emitting: ${event}`);
    this.eventEmitter.emit(event, data);
  }

  on(event: string, handler: (...args: unknown[]) => void) {
    this.eventEmitter.on(event, handler);
  }
}
