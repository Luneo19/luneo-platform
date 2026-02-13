import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EmailTemplateCategory } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type { CreateTemplateDto } from './dto/create-template.dto';
import type { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTemplates(options?: { category?: string; limit?: number; offset?: number }) {
    const { category, limit = 20, offset = 0 } = options || {};
    const where: { category?: EmailTemplateCategory } = {};
    if (category && Object.values(EmailTemplateCategory).includes(category as EmailTemplateCategory)) {
      where.category = category as EmailTemplateCategory;
    }
    const [templates, total] = await Promise.all([
      this.prisma.emailTemplate.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.emailTemplate.count({ where }),
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

  async createTemplate(data: CreateTemplateDto) {
    const slug = `${this.slugify(data.name)}-${Date.now().toString(36)}`;
    const category = data.category && Object.values(EmailTemplateCategory).includes(data.category as EmailTemplateCategory)
      ? (data.category as EmailTemplateCategory)
      : EmailTemplateCategory.OTHER;
    return this.prisma.emailTemplate.create({
      data: {
        name: data.name,
        slug,
        subject: data.subject,
        htmlContent: data.htmlContent,
        textContent: data.textContent ?? null,
        variables: data.variables ?? [],
        category,
      },
    });
  }

  async updateTemplate(id: string, data: UpdateTemplateDto) {
    const updateData: { name?: string; subject?: string; htmlContent?: string; textContent?: string; variables?: string[]; category?: EmailTemplateCategory } = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.htmlContent !== undefined) updateData.htmlContent = data.htmlContent;
    if (data.textContent !== undefined) updateData.textContent = data.textContent;
    if (data.variables !== undefined) updateData.variables = data.variables;
    if (data.category && Object.values(EmailTemplateCategory).includes(data.category as EmailTemplateCategory)) {
      updateData.category = data.category as EmailTemplateCategory;
    }
    return this.prisma.emailTemplate.update({
      where: { id },
      data: updateData,
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
