import { Injectable, Logger } from '@nestjs/common';
import { PipelineStatus } from '@prisma/client';
import { PIPELINE_STAGES, type PipelineStageId } from '../pce.constants';

interface TransitionRule {
  from: string;
  to: string[];
}

/**
 * Validates pipeline stage transitions.
 * The state machine ensures only legal transitions occur, preventing
 * invalid jumps (e.g. from VALIDATION directly to DELIVERY).
 */
@Injectable()
export class StateMachineService {
  private readonly logger = new Logger(StateMachineService.name);

  private readonly transitions: TransitionRule[] = [
    { from: 'CREATED', to: [PIPELINE_STAGES.VALIDATION] },
    { from: PIPELINE_STAGES.VALIDATION, to: [PIPELINE_STAGES.RENDER, PIPELINE_STAGES.PRODUCTION, PIPELINE_STAGES.FULFILLMENT] },
    { from: PIPELINE_STAGES.RENDER, to: [PIPELINE_STAGES.PRODUCTION, PIPELINE_STAGES.FULFILLMENT] },
    { from: PIPELINE_STAGES.PRODUCTION, to: [PIPELINE_STAGES.QUALITY_CHECK, PIPELINE_STAGES.FULFILLMENT] },
    { from: PIPELINE_STAGES.QUALITY_CHECK, to: [PIPELINE_STAGES.FULFILLMENT, PIPELINE_STAGES.PRODUCTION] },
    { from: PIPELINE_STAGES.FULFILLMENT, to: [PIPELINE_STAGES.SHIPPING] },
    { from: PIPELINE_STAGES.SHIPPING, to: [PIPELINE_STAGES.DELIVERY] },
    { from: PIPELINE_STAGES.DELIVERY, to: [PipelineStatus.COMPLETED] },
  ];

  canTransition(from: string, to: string): boolean {
    // Terminal states can transition to FAILED/CANCELLED from anywhere
    if (to === PipelineStatus.FAILED || to === PipelineStatus.CANCELLED) {
      return true;
    }

    const rule = this.transitions.find((t) => t.from === from);
    if (!rule) {
      this.logger.warn(`No transition rules found for stage: ${from}`);
      return false;
    }

    return rule.to.includes(to);
  }

  validateTransition(from: string, to: string): void {
    if (!this.canTransition(from, to)) {
      throw new Error(`Invalid state transition: ${from} -> ${to}`);
    }
  }

  getNextStages(currentStage: string): string[] {
    const rule = this.transitions.find((t) => t.from === currentStage);
    return rule?.to ?? [];
  }

  isTerminalState(stage: string): boolean {
    return (
      stage === PipelineStatus.COMPLETED ||
      stage === PipelineStatus.FAILED ||
      stage === PipelineStatus.CANCELLED
    );
  }
}
