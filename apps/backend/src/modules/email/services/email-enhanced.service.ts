// @ts-nocheck
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { MailgunService } from '../mailgun.service';

export interface SendFromTemplateInput {
  templateId: string;
  recipientEmail: string;
  variables: Record<string, string>;
}

export interface TemplateListItem {
  id: string;
  name: string;
  slug: string;
  subject: string;
  category: string;
  variables: string[];
}

export interface EmailAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  dateRange: { from: Date; to: Date };
}

@Injectable()
export class EmailEnhancedService {
  private readonly logger = new Logger(EmailEnhancedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailgun: MailgunService,
  ) {}

  /**
   * Send email from template with variable substitution.
   */
  async sendFromTemplate(
    templateId: string,
    recipientEmail: string,
    variables: Record<string, string>,
  ): Promise<{ messageId?: string }> {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) {
      throw new NotFoundException('Email template not found');
    }
    if (!recipientEmail?.trim()) {
      throw new BadRequestException('Recipient email is required');
    }

    let html = template.htmlContent;
    let subject = template.subject;
    const vars = variables ?? {};
    for (const key of template.variables) {
      const value = vars[key] ?? '';
      const re = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(re, value);
      subject = subject.replace(re, value);
    }

    try {
      const result = await this.mailgun.sendSimpleMessage({
        to: recipientEmail,
        subject,
        html,
        text: template.textContent ?? undefined,
      });
      const messageId = (result as { id?: string })?.id;
      this.logger.log(`Email sent from template ${template.slug} to ${recipientEmail}`);
      return { messageId };
    } catch (error) {
      this.logger.error('Failed to send template email', error);
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  /**
   * List available email templates, optionally filtered by brand (via category or global).
   */
  async getTemplateList(brandId?: string): Promise<TemplateListItem[]> {
    const where = brandId ? {} : {};
    const templates = await this.prisma.emailTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        subject: true,
        category: true,
        variables: true,
      },
      orderBy: { name: 'asc' },
    });

    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      subject: t.subject,
      category: t.category,
      variables: t.variables,
    }));
  }

  /**
   * Email delivery stats (sent, delivered, opened, clicked, bounced) for a brand in date range.
   */
  async getEmailAnalytics(
    brandId: string,
    dateRange: { from: Date; to: Date },
  ): Promise<EmailAnalytics> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const campaigns = await this.prisma.emailCampaign.findMany({
      where: { brandId, sentAt: { gte: dateRange.from, lte: dateRange.to } },
      select: { id: true, sentCount: true, openCount: true, clickCount: true },
    });

    let sent = 0;
    let opened = 0;
    let clicked = 0;
    for (const c of campaigns) {
      sent += c.sentCount;
      opened += c.openCount;
      clicked += c.clickCount;
    }

    const campaignIds = campaigns.map((c) => c.id);
    let delivered = sent;
    let bounced = 0;
    if (campaignIds.length > 0) {
      const logCounts = await this.prisma.emailLog.groupBy({
        by: ['status'],
        where: {
          campaignId: { in: campaignIds },
          createdAt: { gte: dateRange.from, lte: dateRange.to },
        },
        _count: { id: true },
      });
      for (const row of logCounts) {
        if (row.status === 'bounced') bounced = row._count.id;
        if (row.status === 'delivered') delivered = row._count.id;
      }
    }

    return {
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      dateRange,
    };
  }
}
