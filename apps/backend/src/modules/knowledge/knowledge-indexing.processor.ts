import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '@/libs/queues/queues.constants';
import { JOB_TYPES } from '@/libs/queues';
import { KnowledgeService } from './knowledge.service';

export interface IndexSourceJobData {
  sourceId: string;
  knowledgeBaseId: string;
}

@Processor(QUEUE_NAMES.KNOWLEDGE_INDEXING)
export class KnowledgeIndexingProcessor {
  private readonly logger = new Logger(KnowledgeIndexingProcessor.name);

  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Process(JOB_TYPES.KNOWLEDGE_INDEXING.INDEX_DOCUMENT)
  async handleIndexSource(job: Job<IndexSourceJobData>) {
    const { sourceId } = job.data;
    this.logger.log(`Processing knowledge source: ${sourceId}`);

    try {
      await job.updateProgress(10);
      await this.knowledgeService.processSource(sourceId);
      await job.updateProgress(100);
    } catch (error) {
      this.logger.error(`Failed to process source ${sourceId}`, error);
      throw error;
    }
  }
}
