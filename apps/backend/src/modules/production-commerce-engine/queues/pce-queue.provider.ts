import { Inject, Logger, Provider } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PCE_QUEUES } from '../pce.constants';

/**
 * Lightweight in-process queue that mimics the BullMQ Queue API surface
 * used by the PCE module. Dispatches jobs via EventEmitter2 instead of Redis.
 *
 * This avoids the @nestjs/bullmq ↔ @nestjs/bull global-module conflict
 * that blocks NestJS startup in production. Once the app is migrated
 * fully to @nestjs/bullmq, this shim can be replaced by real BullMQ queues.
 */
export class PCEQueue {
  private readonly logger: Logger;
  private paused = false;
  private jobCounts = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };

  constructor(
    public readonly name: string,
    private readonly emitter?: EventEmitter2,
  ) {
    this.logger = new Logger(`PCEQueue:${name}`);
  }

  async add(jobName: string, data: unknown, _opts?: unknown): Promise<{ id: string }> {
    const id = `${this.name}:${jobName}:${Date.now()}`;
    this.logger.debug(`Job added: ${jobName} (${id})`);

    if (this.emitter && !this.paused) {
      setImmediate(() => {
        this.emitter!.emit(`pce.queue.${this.name}.${jobName}`, { id, name: jobName, data });
      });
    }
    return { id };
  }

  async getJobCounts(..._types: string[]): Promise<Record<string, number>> {
    return { ...this.jobCounts };
  }

  async isPaused(): Promise<boolean> {
    return this.paused;
  }

  async pause(): Promise<void> {
    this.paused = true;
  }

  async resume(): Promise<void> {
    this.paused = false;
  }

  async getFailed(_start?: number, _end?: number): Promise<unknown[]> {
    return [];
  }

  async clean(_grace: number, _limit: number, _type: string): Promise<unknown[]> {
    return [];
  }
}

const QUEUE_TOKEN_PREFIX = 'BullQueue_';
function getQueueToken(name: string): string {
  return `${QUEUE_TOKEN_PREFIX}${name}`;
}

export function createPCEQueueProviders(): Provider[] {
  return Object.values(PCE_QUEUES).map((queueName) => ({
    provide: getQueueToken(queueName),
    useFactory: (emitter: EventEmitter2) => new PCEQueue(queueName, emitter),
    inject: [EventEmitter2],
  }));
}

/**
 * Drop-in replacement for @InjectQueue from @nestjs/bullmq.
 * Uses the same BullQueue_ token prefix so existing providers work.
 */
export const InjectPCEQueue = (name: string): ParameterDecorator => Inject(getQueueToken(name));

export { getQueueToken };
