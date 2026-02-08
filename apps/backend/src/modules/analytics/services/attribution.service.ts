import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface AttributionData {
  userId?: string;
  sessionId: string;
  source: string; // 'direct' | 'organic' | 'paid' | 'referral' | 'email' | 'social'
  medium?: string; // 'search' | 'cpc' | 'email' | 'social' | 'referral'
  campaign?: string;
  term?: string; // Keyword
  content?: string;
  referrer?: string;
  landingPage: string;
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    os?: string;
    browser?: string;
  };
  location?: {
    country?: string;
    city?: string;
  };
  timestamp: Date;
}

export interface ConversionEvent {
  userId?: string;
  sessionId: string;
  eventType: 'signup' | 'design_created' | 'order_created' | 'purchase';
  value?: number; // Revenue
  attribution: AttributionData;
  timestamp: Date;
}

@Injectable()
export class AttributionService {
  private readonly logger = new Logger(AttributionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parse les paramètres UTM
   */
  parseUTMParams(params: Record<string, string>): Partial<AttributionData> {
    const utmSource = params.utm_source;
    const utmMedium = params.utm_medium;
    const utmCampaign = params.utm_campaign;
    const utmTerm = params.utm_term;
    const utmContent = params.utm_content;

    let source: AttributionData['source'] = 'direct';
    if (utmSource) {
      if (utmSource === 'google' || utmSource === 'bing') {
        source = 'organic';
      } else if (utmMedium === 'cpc' || utmMedium === 'paid') {
        source = 'paid';
      } else if (utmMedium === 'email') {
        source = 'email';
      } else if (utmMedium === 'social') {
        source = 'social';
      } else {
        source = 'referral';
      }
    }

    return {
      source,
      medium: utmMedium,
      campaign: utmCampaign,
      term: utmTerm,
      content: utmContent,
    };
  }

  /**
   * Enregistre une attribution
   */
  async recordAttribution(attribution: AttributionData): Promise<void> {
    await this.prisma.attribution.create({
      data: {
        userId: attribution.userId,
        sessionId: attribution.sessionId,
        source: attribution.source,
        medium: attribution.medium,
        campaign: attribution.campaign,
        term: attribution.term,
        content: attribution.content,
        referrer: attribution.referrer,
        landingPage: attribution.landingPage,
        device: attribution.device as object,
        location: attribution.location as object | undefined,
        timestamp: attribution.timestamp,
      },
    });
    this.logger.debug(`Attribution recorded: ${attribution.source} -> ${attribution.landingPage}`);
  }

  /**
   * Enregistre un événement de conversion
   */
  async recordConversion(event: ConversionEvent): Promise<void> {
    await this.prisma.conversion.create({
      data: {
        userId: event.userId,
        sessionId: event.sessionId,
        eventType: event.eventType,
        value: event.value != null ? Math.round(event.value * 100) : null,
        attribution: event.attribution as object,
        timestamp: event.timestamp,
      },
    });
    this.logger.log(
      `Conversion recorded: ${event.eventType} (value: ${event.value || 0}) from ${event.attribution.source}`,
    );
  }

  /**
   * Récupère l'attribution d'une session
   */
  async getSessionAttribution(sessionId: string): Promise<AttributionData | null> {
    const rows = await this.prisma.attribution.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'desc' },
      take: 1,
    });
    const row = rows[0];
    if (!row) return null;
    return {
      userId: row.userId ?? undefined,
      sessionId: row.sessionId,
      source: row.source as AttributionData['source'],
      medium: row.medium ?? undefined,
      campaign: row.campaign ?? undefined,
      term: row.term ?? undefined,
      content: row.content ?? undefined,
      referrer: row.referrer ?? undefined,
      landingPage: row.landingPage,
      device: row.device as AttributionData['device'],
      location: row.location as AttributionData['location'] | undefined,
      timestamp: row.timestamp,
    };
  }

  /**
   * Récupère les conversions par source
   */
  async getConversionsBySource(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, { count: number; revenue: number }>> {
    const conversions = await this.prisma.conversion.findMany({
      where: { timestamp: { gte: startDate, lte: endDate } },
      select: { attribution: true, value: true },
    });
    const bySource: Record<string, { count: number; revenue: number }> = {};
    for (const c of conversions) {
      const att = c.attribution as { source?: string };
      const source = att?.source ?? 'direct';
      if (!bySource[source]) bySource[source] = { count: 0, revenue: 0 };
      bySource[source].count += 1;
      bySource[source].revenue += c.value != null ? c.value / 100 : 0;
    }
    return bySource;
  }

  /**
   * Récupère le ROI par campagne
   */
  async getCampaignROI(
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ campaign: string; spend: number; revenue: number; roi: number }>> {
    const conversions = await this.prisma.conversion.findMany({
      where: { timestamp: { gte: startDate, lte: endDate } },
      select: { attribution: true, value: true },
    });
    const byCampaign: Record<string, { spend: number; revenue: number }> = {};
    for (const c of conversions) {
      const att = c.attribution as { campaign?: string };
      const campaign = att?.campaign ?? '(none)';
      if (!byCampaign[campaign]) byCampaign[campaign] = { spend: 0, revenue: 0 };
      byCampaign[campaign].revenue += c.value != null ? c.value / 100 : 0;
    }
    return Object.entries(byCampaign).map(([campaign, { spend, revenue }]) => ({
      campaign,
      spend,
      revenue,
      roi: spend > 0 ? Math.round((revenue / spend) * 100) / 100 : (revenue > 0 ? Infinity : 0),
    }));
  }
}

































