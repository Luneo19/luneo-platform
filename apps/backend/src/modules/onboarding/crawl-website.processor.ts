import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JOB_TYPES, QUEUE_NAMES } from '@/libs/queues';
import { CrawlWebsiteJobData, CrawlerService } from './crawler.service';

@Processor(QUEUE_NAMES.KNOWLEDGE_INDEXING)
export class CrawlWebsiteProcessor {
  private readonly logger = new Logger(CrawlWebsiteProcessor.name);

  constructor(private readonly crawlerService: CrawlerService) {}

  @Process(JOB_TYPES.KNOWLEDGE_INDEXING.CRAWL_WEBSITE)
  async handle(job: Job<CrawlWebsiteJobData>) {
    this.logger.log(`Processing crawl job ${job.id} for ${job.data.websiteUrl}`);
    return this.crawlerService.executeCrawlJob(job);
  }
}
