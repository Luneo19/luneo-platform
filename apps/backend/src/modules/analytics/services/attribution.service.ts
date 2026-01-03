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
    // TODO: Sauvegarder dans table Attribution
    this.logger.debug(`Attribution recorded: ${attribution.source} -> ${attribution.landingPage}`);
  }

  /**
   * Enregistre un événement de conversion
   */
  async recordConversion(event: ConversionEvent): Promise<void> {
    // TODO: Sauvegarder dans table Conversion
    this.logger.log(
      `Conversion recorded: ${event.eventType} (value: ${event.value || 0}) from ${event.attribution.source}`,
    );
  }

  /**
   * Récupère l'attribution d'une session
   */
  async getSessionAttribution(sessionId: string): Promise<AttributionData | null> {
    // TODO: Récupérer depuis table Attribution
    return null;
  }

  /**
   * Récupère les conversions par source
   */
  async getConversionsBySource(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, { count: number; revenue: number }>> {
    // TODO: Agréger depuis table Conversion
    return {};
  }

  /**
   * Récupère le ROI par campagne
   */
  async getCampaignROI(
    startDate: Date,
    endDate: Date,
  ): Promise<Array<{ campaign: string; spend: number; revenue: number; roi: number }>> {
    // TODO: Calculer depuis table Conversion + coûts campagnes
    return [];
  }
}




























