/**
 * Mock Bull Queue pour les tests d'intégration
 */

import { Injectable } from '@nestjs/common';

export interface MockJob<T = unknown> {
  id: string;
  name: string;
  data: T;
  opts: Record<string, unknown>;
  progress: number;
  returnvalue: unknown;
  stacktrace: string[];
  attemptsMade: number;
  timestamp: number;
  finishedOn?: number;
  processedOn?: number;
  failedReason?: string;
}

@Injectable()
export class MockBullQueue<T = unknown> {
  private jobs: MockJob<T>[] = [];
  private jobIdCounter = 0;
  private processors: Map<string, (job: MockJob<T>) => Promise<unknown>> = new Map();
  private eventHandlers: Map<string, ((job: MockJob<T>) => void)[]> = new Map();

  async add(name: string, data: T, opts?: Record<string, unknown>): Promise<MockJob<T>> {
    const job: MockJob<T> = {
      id: String(++this.jobIdCounter),
      name,
      data,
      opts: opts || {},
      progress: 0,
      returnvalue: null,
      stacktrace: [],
      attemptsMade: 0,
      timestamp: Date.now(),
    };
    this.jobs.push(job);

    // Process immediately in test mode (synchronous)
    const processor = this.processors.get(name) || this.processors.get('*');
    if (processor) {
      try {
        job.processedOn = Date.now();
        job.returnvalue = await processor(job);
        job.finishedOn = Date.now();
        this.emit('completed', job);
      } catch (error: unknown) {
        job.attemptsMade++;
        job.failedReason = error instanceof Error ? error.message : String(error);
        job.stacktrace.push(error instanceof Error ? (error.stack ?? '') : '');
        this.emit('failed', job);
      }
    }

    return job;
  }

  async addBulk(jobs: Array<{ name: string; data: T; opts?: Record<string, unknown> }>): Promise<MockJob<T>[]> {
    return Promise.all(jobs.map(j => this.add(j.name, j.data, j.opts)));
  }

  process(nameOrProcessor: string | ((job: MockJob<T>) => Promise<unknown>), processor?: (job: MockJob<T>) => Promise<unknown>): void {
    if (typeof nameOrProcessor === 'function') {
      this.processors.set('*', nameOrProcessor);
    } else {
      this.processors.set(nameOrProcessor, processor!);
    }
  }

  on(event: string, handler: (job: MockJob<T>) => void): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
  }

  private emit(event: string, job: MockJob<T>): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(h => h(job));
  }

  async getJob(jobId: string): Promise<MockJob<T> | null> {
    return this.jobs.find(j => j.id === jobId) || null;
  }

  async getJobs(_types?: string[]): Promise<MockJob<T>[]> {
    return this.jobs;
  }

  async getJobCounts(): Promise<Record<string, number>> {
    return {
      waiting: this.jobs.filter(j => !j.processedOn).length,
      active: 0,
      completed: this.jobs.filter(j => j.finishedOn && !j.failedReason).length,
      failed: this.jobs.filter(j => j.failedReason).length,
      delayed: 0,
      paused: 0,
    };
  }

  async pause(): Promise<void> {}
  async resume(): Promise<void> {}
  async close(): Promise<void> {}
  async clean(_grace: number, _status?: string): Promise<string[]> {
    return [];
  }

  async empty(): Promise<void> {
    this.jobs = [];
  }

  // For testing
  getProcessedJobs(): MockJob<T>[] {
    return this.jobs.filter(j => j.finishedOn);
  }

  getFailedJobs(): MockJob<T>[] {
    return this.jobs.filter(j => j.failedReason);
  }

  clearJobs(): void {
    this.jobs = [];
    this.jobIdCounter = 0;
  }
}

/**
 * Factory pour créer des mock queues
 */
export function createMockBullQueue<T = unknown>(): MockBullQueue<T> {
  return new MockBullQueue<T>();
}

/**
 * Provider factory pour NestJS
 */
export function getMockBullQueueProvider(queueName: string) {
  return {
    provide: `BullQueue_${queueName}`,
    useValue: createMockBullQueue(),
  };
}

/**
 * Mock du décorateur @InjectQueue
 */
export const getQueueToken = (name: string) => `BullQueue_${name}`;
