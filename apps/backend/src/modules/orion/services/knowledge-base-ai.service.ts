import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

interface KBSearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  relevanceScore: number;
}

@Injectable()
export class KnowledgeBaseAIService {
  private readonly logger = new Logger(KnowledgeBaseAIService.name);

  constructor(private readonly prisma: PrismaService) {}

  async searchRelevantArticles(
    query: string,
    category?: string,
    limit = 5,
  ): Promise<KBSearchResult[]> {
    const keywords = this.extractKeywords(query);

    const where: Record<string, unknown> = {
      isPublished: true,
    };
    if (category) {
      where.category = category;
    }

    const articles = await this.prisma.knowledgeBaseArticle.findMany({
      where: where as never,
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        tags: true,
      },
    });

    const scored = articles.map((article) => ({
      ...article,
      relevanceScore: this.calculateRelevance(
        query,
        keywords,
        article.title,
        article.content,
        article.tags,
      ),
    }));

    return scored
      .filter((a) => a.relevanceScore > 0.1)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)
      .map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content.substring(0, 2000),
        category: a.category,
        relevanceScore: a.relevanceScore,
      }));
  }

  formatForLLM(articles: KBSearchResult[]): string {
    if (articles.length === 0) return '';

    const lines = ['## Articles de la base de connaissances pertinents'];
    for (const article of articles) {
      lines.push(`### ${article.title} (pertinence: ${Math.round(article.relevanceScore * 100)}%)`);
      lines.push(article.content);
      lines.push('');
    }
    return lines.join('\n');
  }

  async recordArticleUsage(articleId: string): Promise<void> {
    try {
      await this.prisma.knowledgeBaseArticle.update({
        where: { id: articleId },
        data: { views: { increment: 1 } },
      });
    } catch {
      this.logger.warn(`Failed to record usage for article ${articleId}`);
    }
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et',
      'est', 'en', 'que', 'qui', 'dans', 'pour', 'pas', 'ne',
      'je', 'mon', 'ma', 'mes', 'ce', 'cette', 'ces',
      'the', 'a', 'an', 'is', 'in', 'for', 'to', 'of', 'and',
      'with', 'my', 'i', 'it', 'not', 'can', 'how', 'do',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\sàâéèêëïîôùûüç]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));
  }

  private calculateRelevance(
    query: string,
    keywords: string[],
    title: string,
    content: string,
    tags: string[],
  ): number {
    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    let score = 0;

    if (lowerTitle.includes(lowerQuery)) {
      score += 0.5;
    }

    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword)) score += 0.15;
      if (lowerContent.includes(keyword)) score += 0.05;
      if (tags.some((t) => t.toLowerCase().includes(keyword))) score += 0.1;
    }

    return Math.min(score, 1);
  }
}
