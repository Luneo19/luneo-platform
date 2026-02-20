/**
 * Module 17 - Embeddable widget.
 * Build embed code, widget analytics, domain allowlist validation.
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface WidgetBuildConfig {
  theme?: 'light' | 'dark' | 'auto';
  locale?: string;
  showPoweredBy?: boolean;
  height?: number;
  width?: number;
}

export interface WidgetEmbedResult {
  scriptTag: string;
  divTag: string;
  snippet: string;
  widgetId: string;
}

export interface WidgetAnalyticsResult {
  widgetId: string;
  from: Date;
  to: Date;
  sessions: number;
  uniqueUsers: number;
  designsSaved: number;
  addToCarts: number;
  avgSessionDurationSeconds: number;
}

@Injectable()
export class WidgetBuilderService {
  private readonly logger = new Logger(WidgetBuilderService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate embeddable widget code (script tag + div) for a customizer.
   */
  async buildWidget(
    customizerId: string,
    config: WidgetBuildConfig = {},
  ): Promise<WidgetEmbedResult> {
    const customizer = await this.prisma.visualCustomizer.findUnique({
      where: { id: customizerId },
      select: { id: true, slug: true, status: true },
    });
    if (!customizer) {
      throw new NotFoundException(`Customizer not found: ${customizerId}`);
    }
    if (customizer.status !== 'PUBLISHED') {
      this.logger.warn(`Building widget for non-published customizer: ${customizerId}`);
    }

    const baseUrl = process.env.FRONTEND_URL || process.env.API_URL || 'https://app.luneo.com';
    const theme = config.theme ?? 'light';
    const locale = config.locale ?? 'fr';
    const showPoweredBy = config.showPoweredBy ?? true;
    const height = config.height ?? 600;
    const width = config.width ?? 100;

    const scriptTag = `<script src="${baseUrl}/embed/widget.js" data-widget-id="${customizerId}" data-theme="${theme}" data-locale="${locale}" data-powered-by="${showPoweredBy}"></script>`;
    const divTag = `<div id="luneo-widget-${customizerId}" data-widget-id="${customizerId}" style="min-height:${height}px;width:${width}%;"></div>`;
    const snippet = [scriptTag, divTag].join('\n');

    return {
      scriptTag,
      divTag,
      snippet,
      widgetId: customizerId,
    };
  }

  /**
   * Widget usage analytics for a date range.
   */
  async getWidgetAnalytics(
    widgetId: string,
    dateRange: { from: Date; to: Date },
  ): Promise<WidgetAnalyticsResult> {
    const customizer = await this.prisma.visualCustomizer.findUnique({
      where: { id: widgetId },
      select: { id: true },
    });
    if (!customizer) {
      throw new NotFoundException(`Widget not found: ${widgetId}`);
    }

    const from = new Date(dateRange.from);
    const to = new Date(dateRange.to);
    if (from > to) {
      throw new BadRequestException('Date range from must be before to.');
    }

    const rows = await this.prisma.customizerAnalytics.aggregate({
      where: {
        customizerId: widgetId,
        date: { gte: from, lte: to },
      },
      _sum: {
        sessions: true,
        uniqueUsers: true,
        designsSaved: true,
        addToCarts: true,
        avgSessionDuration: true,
      },
      _avg: { avgSessionDuration: true },
      _count: { id: true },
    });

    const sessions = rows._sum.sessions ?? 0;
    const uniqueUsers = rows._sum.uniqueUsers ?? 0;
    const designsSaved = rows._sum.designsSaved ?? 0;
    const addToCarts = rows._sum.addToCarts ?? 0;
    const avgSessionDurationSeconds = Math.round(rows._avg.avgSessionDuration ?? 0);

    return {
      widgetId,
      from,
      to,
      sessions,
      uniqueUsers,
      designsSaved,
      addToCarts,
      avgSessionDurationSeconds,
    };
  }

  /**
   * Check if a domain is allowed for this widget (embed allowlist).
   */
  async validateDomain(widgetId: string, domain: string): Promise<boolean> {
    const customizer = await this.prisma.visualCustomizer.findUnique({
      where: { id: widgetId },
      select: { allowedDomains: true },
    });
    if (!customizer) {
      throw new NotFoundException(`Widget not found: ${widgetId}`);
    }

    const allowed = customizer.allowedDomains ?? [];
    if (allowed.length === 0) {
      this.logger.debug(`Widget ${widgetId} has no domain restrictions`);
      return true;
    }

    const normalized = domain.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
    const isAllowed = allowed.some((d) => {
      const a = d.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
      return a === normalized || normalized.endsWith('.' + a);
    });

    if (!isAllowed) {
      this.logger.warn(`Domain ${domain} not allowed for widget ${widgetId}`);
    }
    return isAllowed;
  }
}
