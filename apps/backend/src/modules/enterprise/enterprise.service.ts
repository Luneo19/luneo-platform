import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PartnerStatus, Prisma } from '@prisma/client';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { CurrentUser } from '@/common/types/user.types';

@Injectable()
export class EnterpriseService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async getWhiteLabel(user: CurrentUser) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    return this.prisma.whiteLabelConfig.findUnique({
      where: { organizationId: user.organizationId },
    });
  }

  async upsertWhiteLabel(
    user: CurrentUser,
    payload: {
      customDomain?: string;
      customLogoUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      emailSenderDomain?: string;
      hidePoweredBy?: boolean;
      customFavicon?: string;
    },
  ) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    return this.prisma.whiteLabelConfig.upsert({
      where: { organizationId: user.organizationId },
      create: {
        organizationId: user.organizationId,
        ...payload,
      },
      update: {
        ...payload,
      },
    });
  }

  async createPartnerProfile(
    user: CurrentUser,
    payload: { companyName: string; website?: string },
  ) {
    if (!payload.companyName?.trim()) {
      throw new BadRequestException('companyName requis');
    }
    const existing = await this.prisma.partner.findFirst({
      where: { userId: user.id },
    });
    if (existing) return existing;

    return this.prisma.partner.create({
      data: {
        userId: user.id,
        companyName: payload.companyName.trim(),
        website: payload.website,
        status: PartnerStatus.PENDING,
      },
    });
  }

  async getPartnerOverview(user: CurrentUser) {
    const partner = await this.prisma.partner.findFirst({
      where: { userId: user.id },
      include: { referrals: true },
    });
    if (!partner) throw new NotFoundException('Profil partner introuvable');

    return {
      partner: {
        id: partner.id,
        companyName: partner.companyName,
        status: partner.status,
        commissionRate: partner.commissionRate,
        totalReferrals: partner.totalReferrals,
        totalCommissionEarned: partner.totalCommissionEarned,
      },
      referrals: partner.referrals.map((r) => ({
        id: r.id,
        referredOrganizationId: r.organizationId,
        status: r.status,
        monthlyRevenue: r.monthlyValue,
        commissionEarned: r.commissionPaid,
        createdAt: r.createdAt,
      })),
    };
  }

  async exportOrganizationSnapshot(user: CurrentUser) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');

    const [org, contacts, conversations, whiteLabel] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.contact.count({ where: { organizationId: user.organizationId } }),
      this.prisma.conversation.count({
        where: { organizationId: user.organizationId, deletedAt: null },
      }),
      this.prisma.whiteLabelConfig.findUnique({
        where: { organizationId: user.organizationId },
      }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      organization: org,
      metrics: {
        contacts,
        conversations,
      },
      whiteLabel,
    };
  }
}
