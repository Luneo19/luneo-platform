import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JOB_TYPES, QUEUE_NAMES, QueuesService } from '@/libs/queues';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface CrawlWebsiteJobData {
  organizationId: string;
  websiteUrl: string;
  maxPages: number;
  [key: string]: unknown;
}

interface CrawledPage {
  url: string;
  title: string | null;
  text: string;
  classification: 'faq' | 'products' | 'policies' | 'contact' | 'about' | 'general';
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  constructor(
    private readonly queuesService: QueuesService,
    private readonly prisma: PrismaService,
  ) {}

  async enqueueWebsiteCrawl(organizationId: string, websiteUrl: string, maxPages = 100) {
    const job = await this.queuesService.addKnowledgeIndexingJob<CrawlWebsiteJobData>(
      JOB_TYPES.KNOWLEDGE_INDEXING.CRAWL_WEBSITE,
      { organizationId, websiteUrl, maxPages },
      {},
    );

    return { jobId: String(job.id), queue: QUEUE_NAMES.KNOWLEDGE_INDEXING };
  }

  async getCrawlStatus(jobId: string) {
    const queue = this.queuesService.getQueue(QUEUE_NAMES.KNOWLEDGE_INDEXING);
    const job = await queue.getJob(jobId);
    if (!job) return { status: 'not_found' as const };

    return {
      status: await job.getState(),
      progress: job.progress ?? 0,
      result: job.returnvalue ?? null,
      failedReason: job.failedReason ?? null,
    };
  }

  async executeCrawlJob(job: Job<CrawlWebsiteJobData>) {
    const { websiteUrl, maxPages, organizationId } = job.data;
    this.logger.log(`Start crawling ${websiteUrl} (maxPages=${maxPages}) for org=${organizationId}`);

    const pages = await this.crawlWebsite(websiteUrl, maxPages, async (progress) => {
      await job.updateProgress(progress);
    });

    const preview = pages.slice(0, 20).map((item) => ({
      url: item.url,
      title: item.title,
      classification: item.classification,
      excerpt: item.text.slice(0, 300),
    }));

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { onboardingData: true },
    });

    const existingOnboardingData =
      (org?.onboardingData as Record<string, unknown> | null) ?? {};

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        onboardingData: {
          ...existingOnboardingData,
          crawl: {
            websiteUrl,
            totalPages: pages.length,
            completedAt: new Date().toISOString(),
            pages: preview,
          },
        } as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    });

    return {
      websiteUrl,
      totalPages: pages.length,
      pages: preview,
    };
  }

  private async crawlWebsite(
    startUrl: string,
    maxPages: number,
    onProgress?: (progress: number) => Promise<void>,
  ): Promise<CrawledPage[]> {
    const origin = new URL(startUrl).origin;
    const queue = [startUrl];
    const visited = new Set<string>();
    const pages: CrawledPage[] = [];

    while (queue.length > 0 && pages.length < maxPages) {
      const url = queue.shift();
      if (!url || visited.has(url)) continue;
      visited.add(url);

      try {
        const html = await this.fetchHtml(url);
        const text = this.extractText(html);
        const title = this.extractTitle(html);

        pages.push({
          url,
          title,
          text,
          classification: this.classifyPage(url, text),
        });

        const links = this.extractLinks(html, origin);
        for (const link of links) {
          if (!visited.has(link) && queue.length < maxPages * 2) {
            queue.push(link);
          }
        }
      } catch (error) {
        this.logger.warn(`Crawl failed for ${url}: ${error instanceof Error ? error.message : String(error)}`);
      }

      if (onProgress) {
        const progress = Math.min(99, Math.round((pages.length / maxPages) * 100));
        await onProgress(progress);
      }
    }

    if (onProgress) await onProgress(100);
    return pages;
  }

  private async fetchHtml(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(url, {
        headers: { 'user-agent': 'LuneoOnboardingCrawler/1.0 (+https://luneo.app)' },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractTitle(html: string): string | null {
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return match ? this.normalizeText(match[1]) : null;
  }

  private extractText(html: string): string {
    const withoutScripts = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

    const withoutTags = withoutScripts
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');

    return this.normalizeText(withoutTags);
  }

  private normalizeText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private extractLinks(html: string, origin: string): string[] {
    const links = new Set<string>();
    const hrefRegex = /href=["']([^"']+)["']/gi;
    let match: RegExpExecArray | null;

    while ((match = hrefRegex.exec(html)) !== null) {
      const href = match[1];
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      try {
        const absolute = new URL(href, origin);
        if (absolute.origin === origin && absolute.protocol.startsWith('http')) {
          links.add(absolute.toString());
        }
      } catch {
        // Ignore malformed URLs.
      }
    }

    return Array.from(links);
  }

  private classifyPage(url: string, text: string): CrawledPage['classification'] {
    const lowerUrl = url.toLowerCase();
    const lowerText = text.toLowerCase();

    if (/(faq|frequently-asked-questions)/.test(lowerUrl) || lowerText.includes('question frequente')) return 'faq';
    if (/(product|catalog|shop|boutique)/.test(lowerUrl)) return 'products';
    if (/(privacy|policy|terms|conditions|retour|shipping|livraison)/.test(lowerUrl)) return 'policies';
    if (/(contact|support|help)/.test(lowerUrl)) return 'contact';
    if (/(about|a-propos|company|entreprise)/.test(lowerUrl)) return 'about';
    return 'general';
  }
}
