import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';

/**
 * Knowledge Base Service - Enterprise Grade
 * Handles knowledge base articles management
 * Inspired by: Intercom Articles, Zendesk Guide, Notion Knowledge Base
 */
@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  /**
   * Create a knowledge base article
   */
  @CacheInvalidate({
    type: 'knowledge-base',
    tags: () => ['knowledge-base:list'],
  })
  async createArticle(data: {
    title: string;
    content: string;
    excerpt?: string;
    category: string;
    tags?: string[];
    authorId: string;
    isPublished?: boolean;
    isFeatured?: boolean;
  }) {
    const slug = this.generateSlug(data.title);

    // Ensure slug is unique
    let finalSlug = slug;
    let counter = 1;
    while (await this.prisma.knowledgeBaseArticle.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const article = await this.prisma.knowledgeBaseArticle.create({
      data: {
        title: data.title,
        slug: finalSlug,
        content: data.content,
        excerpt: data.excerpt,
        category: data.category,
        tags: data.tags || [],
        authorId: data.authorId,
        isPublished: data.isPublished || false,
        isFeatured: data.isFeatured || false,
        publishedAt: data.isPublished ? new Date() : null,
      },
    });

    this.logger.log('Knowledge base article created', {
      articleId: article.id,
      slug: article.slug,
      authorId: data.authorId,
    });

    return article;
  }

  /**
   * Get published articles with filters
   */
  @Cacheable({
    type: 'knowledge-base',
    ttl: 300,
    keyGenerator: (args) => `kb:articles:${JSON.stringify(args[0])}`,
  })
  async getArticles(filters: {
    category?: string;
    search?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const { category, search, featured, limit = 50, offset = 0 } = filters;

    const where: any = {
      isPublished: true,
    };

    if (category) where.category = category;
    if (featured !== undefined) where.isFeatured = featured;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const [articles, total] = await Promise.all([
      this.prisma.knowledgeBaseArticle.findMany({
        where,
        orderBy: [
          { isFeatured: 'desc' },
          { views: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      this.prisma.knowledgeBaseArticle.count({ where }),
    ]);

    return {
      articles,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get a single article by slug
   */
  @Cacheable({
    type: 'knowledge-base',
    ttl: 600,
    keyGenerator: (args) => `kb:article:${args[0]}`,
  })
  async getArticle(slug: string) {
    const article = await this.prisma.knowledgeBaseArticle.findUnique({
      where: { slug },
    });

    if (!article) {
      return null;
    }

    // Increment view count
    await this.prisma.knowledgeBaseArticle.update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
    });

    return {
      ...article,
      views: article.views + 1,
    };
  }

  /**
   * Update article helpful/not helpful feedback
   */
  @CacheInvalidate({
    type: 'knowledge-base',
    pattern: (args) => `kb:article:${args[0]}`,
  })
  async updateFeedback(articleId: string, helpful: boolean) {
    const article = await this.prisma.knowledgeBaseArticle.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new Error('Article not found');
    }

    return this.prisma.knowledgeBaseArticle.update({
      where: { id: articleId },
      data: helpful
        ? { helpful: { increment: 1 } }
        : { notHelpful: { increment: 1 } },
    });
  }

  /**
   * Get article categories
   */
  @Cacheable({
    type: 'knowledge-base',
    ttl: 3600,
    keyGenerator: () => 'kb:categories',
  })
  async getCategories() {
    const articles = await this.prisma.knowledgeBaseArticle.findMany({
      where: { isPublished: true },
      select: { category: true },
    });

    const categories = new Set(articles.map((a) => a.category));
    return Array.from(categories);
  }
}

