// @ts-nocheck
/**
 * Module 22 - Enterprise.
 * SAML SSO, custom domain, white-label branding, SLA metrics.
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface SamlConfig {
  entryPoint: string;
  issuer: string;
  cert?: string;
  callbackUrl?: string;
  metadataUrl?: string;
  metadataXml?: string;
  autoProvisioning?: boolean;
  defaultRole?: string;
  attributeMapping?: Record<string, string>;
}

export interface WhiteLabelConfig {
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  supportEmail?: string;
  hidePoweredBy?: boolean;
  customCss?: string;
  [key: string]: unknown;
}

export interface SLAMetrics {
  brandId: string;
  totalTickets: number;
  onTime: number;
  atRisk: number;
  breached: number;
  avgFirstResponseHours: number | null;
  avgResolutionHours: number | null;
  compliancePercent: number;
}

@Injectable()
export class EnterpriseService {
  private readonly logger = new Logger(EnterpriseService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Configure SAML SSO for a brand.
   */
  async configureSSOSAML(brandId: string, samlConfig: SamlConfig): Promise<{ configId: string }> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true },
    });
    if (!brand) throw new NotFoundException(`Brand not found: ${brandId}`);
    if (!samlConfig.entryPoint?.trim() || !samlConfig.issuer?.trim()) {
      throw new BadRequestException('SAML entryPoint and issuer are required');
    }

    const config = await this.prisma.sSOConfiguration.upsert({
      where: { brandId_provider: { brandId, provider: 'saml' } },
      create: {
        brandId,
        provider: 'saml',
        name: 'SAML SSO',
        samlEntryPoint: samlConfig.entryPoint,
        samlIssuer: samlConfig.issuer,
        samlCert: samlConfig.cert ?? undefined,
        samlCallbackUrl: samlConfig.callbackUrl ?? undefined,
        metadataUrl: samlConfig.metadataUrl ?? undefined,
        metadataXml: samlConfig.metadataXml ?? undefined,
        autoProvisioning: samlConfig.autoProvisioning ?? true,
        defaultRole: samlConfig.defaultRole ?? undefined,
        attributeMapping: (samlConfig.attributeMapping as object) ?? undefined,
      },
      update: {
        samlEntryPoint: samlConfig.entryPoint,
        samlIssuer: samlConfig.issuer,
        samlCert: samlConfig.cert ?? undefined,
        samlCallbackUrl: samlConfig.callbackUrl ?? undefined,
        metadataUrl: samlConfig.metadataUrl ?? undefined,
        metadataXml: samlConfig.metadataXml ?? undefined,
        autoProvisioning: samlConfig.autoProvisioning ?? true,
        defaultRole: samlConfig.defaultRole ?? undefined,
        attributeMapping: (samlConfig.attributeMapping as object) ?? undefined,
      },
    });

    this.logger.log(`SAML SSO configured for brand ${brandId}`);
    return { configId: config.id };
  }

  /**
   * Configure custom domain for a brand.
   */
  async configureCustomDomain(brandId: string, domain: string): Promise<{ domainId: string }> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true },
    });
    if (!brand) throw new NotFoundException(`Brand not found: ${brandId}`);

    const normalized = domain.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
    if (!normalized) throw new BadRequestException('Invalid domain');

    const existing = await this.prisma.customDomain.findUnique({
      where: { domain: normalized },
    });
    if (existing && existing.brandId !== brandId) {
      throw new BadRequestException('Domain is already used by another brand');
    }

    const record = await this.prisma.customDomain.upsert({
      where: { domain: normalized },
      create: { brandId, domain: normalized },
      update: { brandId, isActive: false },
    });

    this.logger.log(`Custom domain ${normalized} configured for brand ${brandId}`);
    return { domainId: record.id };
  }

  /**
   * Get white-label branding config (logo, colors, fonts).
   */
  async getWhiteLabelConfig(brandId: string): Promise<WhiteLabelConfig> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { logo: true, whiteLabel: true, settings: true },
    });
    if (!brand) throw new NotFoundException(`Brand not found: ${brandId}`);

    const settings = (brand.settings as Record<string, unknown>) ?? {};
    const whiteLabel = (settings.whiteLabel as Record<string, unknown>) ?? {};

    return {
      logo: brand.logo ?? (whiteLabel.logo as string),
      favicon: whiteLabel.favicon as string,
      primaryColor: (whiteLabel.primaryColor as string) ?? '#0f172a',
      secondaryColor: (whiteLabel.secondaryColor as string) ?? '#64748b',
      fontFamily: (whiteLabel.fontFamily as string) ?? 'Inter, sans-serif',
      supportEmail: whiteLabel.supportEmail as string,
      hidePoweredBy: brand.whiteLabel ?? (whiteLabel.hidePoweredBy as boolean),
      customCss: whiteLabel.customCss as string,
      ...whiteLabel,
    };
  }

  /**
   * Update white-label branding config.
   */
  async updateWhiteLabelConfig(brandId: string, config: WhiteLabelConfig): Promise<void> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true, settings: true, logo: true, whiteLabel: true },
    });
    if (!brand) throw new NotFoundException(`Brand not found: ${brandId}`);

    const settings = (brand.settings as Record<string, unknown>) ?? {};
    const currentWL = (settings.whiteLabel as Record<string, unknown>) ?? {};
    const mergedWL = { ...currentWL, ...config };

    const updateData: { settings: object; logo?: string; whiteLabel?: boolean } = {
      settings: { ...settings, whiteLabel: mergedWL } as object,
    };
    if (config.logo !== undefined) updateData.logo = config.logo;
    if (config.hidePoweredBy !== undefined) updateData.whiteLabel = config.hidePoweredBy;

    await this.prisma.brand.update({
      where: { id: brandId },
      data: updateData,
    });

    this.logger.log(`White-label config updated for brand ${brandId}`);
  }

  /**
   * Get SLA compliance metrics for a brand.
   */
  async getSLAMetrics(brandId: string): Promise<SLAMetrics> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true },
    });
    if (!brand) throw new NotFoundException(`Brand not found: ${brandId}`);

    const tickets = await this.prisma.sLATicket.findMany({
      where: { brandId },
      select: {
        slaStatus: true,
        firstResponseAt: true,
        resolvedAt: true,
        createdAt: true,
        slaResponseDeadline: true,
        slaResolutionDeadline: true,
      },
    });

    const total = tickets.length;
    const onTime = tickets.filter((t) => t.slaStatus === 'on_time').length;
    const atRisk = tickets.filter((t) => t.slaStatus === 'at_risk').length;
    const breached = tickets.filter((t) => t.slaStatus === 'breached').length;

    let sumFirstResponseHours = 0;
    let countFirstResponse = 0;
    let sumResolutionHours = 0;
    let countResolution = 0;

    for (const t of tickets) {
      if (t.firstResponseAt) {
        sumFirstResponseHours += (t.firstResponseAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
        countFirstResponse++;
      }
      if (t.resolvedAt) {
        sumResolutionHours += (t.resolvedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
        countResolution++;
      }
    }

    const compliancePercent = total === 0 ? 100 : Math.round((onTime / total) * 100);

    return {
      brandId,
      totalTickets: total,
      onTime,
      atRisk,
      breached,
      avgFirstResponseHours: countFirstResponse > 0 ? sumFirstResponseHours / countFirstResponse : null,
      avgResolutionHours: countResolution > 0 ? sumResolutionHours / countResolution : null,
      compliancePercent,
    };
  }
}
