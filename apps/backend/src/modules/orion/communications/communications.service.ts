import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTemplates(options?: { category?: string; limit?: number; offset?: number }) {
    const { limit = 20, offset = 0 } = options || {};
    // EmailTemplate has no category in schema; filter ignored until category is added
    const [templates, total] = await Promise.all([
      this.prisma.emailTemplate.findMany({
        take: limit,
        skip: offset,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.emailTemplate.count(),
    ]);
    return { templates, total, limit, offset };
  }

  async getTemplate(id: string) {
    const template = await this.prisma.emailTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      || 'template';
  }

  async createTemplate(data: {
    name: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    category?: string;
    variables?: string[];
  }) {
    const slug = `${this.slugify(data.name)}-${Date.now().toString(36)}`;
    return this.prisma.emailTemplate.create({
      data: {
        name: data.name,
        slug,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent ?? null,
        variables: data.variables ?? [],
      },
    });
  }

  async updateTemplate(id: string, data: Record<string, unknown>) {
    const { category: _cat, slug: _slug, ...rest } = data;
    return this.prisma.emailTemplate.update({
      where: { id },
      data: rest as { name?: string; subject?: string; htmlContent?: string; textContent?: string; variables?: string[] },
    });
  }

  async deleteTemplate(id: string) {
    return this.prisma.emailTemplate.delete({ where: { id } });
  }

  async getCommunicationLogs(options?: {
    type?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }) {
    const { type, userId, limit = 50, offset = 0 } = options || {};
    const where: { type?: string; customerId?: string } = {};
    if (type) where.type = type;
    if (userId) where.customerId = userId;

    const [logs, total] = await Promise.all([
      this.prisma.emailLog.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.emailLog.count({ where }),
    ]);
    return { logs, total, limit, offset };
  }

  async getStats() {
    const [totalTemplates, totalCampaigns, totalSent, totalLogs] = await Promise.all([
      this.prisma.emailTemplate.count(),
      this.prisma.emailCampaign.count(),
      this.prisma.emailLog.count({ where: { status: 'sent' } }),
      this.prisma.emailLog.count(),
    ]);
    return { totalTemplates, totalCampaigns, totalSent, totalLogs };
  }
}
