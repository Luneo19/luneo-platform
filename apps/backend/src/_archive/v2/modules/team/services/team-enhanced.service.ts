/**
 * Module 21 - Team & Organization.
 * Invite members, list members, update roles, org settings.
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { randomBytes } from 'crypto';

export interface TeamMemberResult {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  status: string;
  joinedAt: Date | null;
  invitedBy: string | null;
  userId: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface OrganizationSettings {
  name?: string;
  slug?: string;
  timezone?: string;
  defaultLocale?: string;
  features?: Record<string, boolean>;
  [key: string]: unknown;
}

@Injectable()
export class TeamEnhancedService {
  private readonly logger = new Logger(TeamEnhancedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Invite a team member by email with a role (sends invitation).
   */
  async inviteTeamMember(
    brandId: string,
    email: string,
    role: string,
    invitedByUserId?: string,
  ): Promise<{ inviteId: string; token: string }> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true },
    });
    if (!brand) throw new NotFoundException(`Brand not found: ${brandId}`);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) throw new BadRequestException('Email is required');

    let invitedBy = invitedByUserId;
    if (!invitedBy) {
      const inviterUser = await this.prisma.user.findFirst({
        where: { brandId },
        select: { id: true },
      });
      invitedBy = inviterUser?.id ?? undefined;
    }
    if (!invitedBy) throw new ForbiddenException('No inviter user for this brand');

    const existing = await this.prisma.teamMember.findUnique({
      where: { organizationId_email: { organizationId: brandId, email: normalizedEmail } },
    });
    if (existing && existing.status === 'active') {
      throw new BadRequestException('User is already a team member');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await this.prisma.teamInvite.create({
      data: {
        organizationId: brandId,
        email: normalizedEmail,
        role: role || 'member',
        token,
        invitedBy,
        expiresAt,
      },
    });

    this.logger.log(`Invitation sent to ${normalizedEmail} for brand ${brandId}`);
    return { inviteId: invite.id, token };
  }

  /**
   * List team members with roles for a brand.
   */
  async getTeamMembers(brandId: string): Promise<TeamMemberResult[]> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true },
    });
    if (!brand) throw new NotFoundException(`Brand not found: ${brandId}`);

    const members = await this.prisma.teamMember.findMany({
      where: { organizationId: brandId },
      include: { user: { select: { id: true, firstName: true, lastName: true } }, inviter: { select: { id: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      email: m.email,
      role: m.role,
      permissions: m.permissions ?? [],
      status: m.status,
      joinedAt: m.joinedAt,
      invitedBy: m.invitedBy,
      userId: m.userId,
      firstName: m.user?.firstName,
      lastName: m.user?.lastName,
    }));
  }

  /**
   * Update a member's role.
   */
  async updateMemberRole(memberId: string, newRole: string): Promise<void> {
    const member = await this.prisma.teamMember.findUnique({
      where: { id: memberId },
    });
    if (!member) throw new NotFoundException(`Team member not found: ${memberId}`);
    if (!newRole?.trim()) throw new BadRequestException('Role is required');

    await this.prisma.teamMember.update({
      where: { id: memberId },
      data: { role: newRole.trim() },
    });
    this.logger.log(`Member ${memberId} role updated to ${newRole}`);
  }

  /**
   * Get organization (brand) settings.
   */
  async getOrganizationSettings(brandId: string): Promise<OrganizationSettings> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { name: true, slug: true, settings: true, organizationId: true },
    });
    if (!brand) throw new NotFoundException(`Brand not found: ${brandId}`);

    const settings = (brand.settings as Record<string, unknown>) ?? {};
    let org: { name?: string; slug?: string } = {};
    if (brand.organizationId) {
      const o = await this.prisma.organization.findUnique({
        where: { id: brand.organizationId },
        select: { name: true, slug: true },
      });
      org = o ?? {};
    }

    return {
      name: brand.name ?? org.name,
      slug: brand.slug ?? org.slug,
      timezone: (settings.timezone as string) ?? 'Europe/Paris',
      defaultLocale: (settings.defaultLocale as string) ?? 'fr',
      features: (settings.features as Record<string, boolean>) ?? {},
      ...settings,
    };
  }

  /**
   * Update organization (brand) settings.
   */
  async updateOrganizationSettings(brandId: string, settings: OrganizationSettings): Promise<void> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true, settings: true },
    });
    if (!brand) throw new NotFoundException(`Brand not found: ${brandId}`);

    const current = (brand.settings as Record<string, unknown>) ?? {};
    const merged = { ...current, ...settings };

    await this.prisma.brand.update({
      where: { id: brandId },
      data: { settings: merged as object },
    });
    this.logger.log(`Organization settings updated for brand ${brandId}`);
  }
}
