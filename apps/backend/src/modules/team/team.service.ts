// @ts-nocheck
import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PlansService } from '@/modules/plans/plans.service';
import * as crypto from 'crypto';

@Injectable()
export class TeamService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => PlansService)) private plansService: PlansService,
  ) {}

  async findAll(organizationId: string) {
    return this.prisma.teamMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        inviter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        inviter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (member.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this team member');
    }

    return member;
  }

  async update(id: string, data: { role?: string; permissions?: string[]; status?: string }, organizationId: string, currentUserId?: string) {
    const member = await this.findOne(id, organizationId);

    const validRoles = ['admin', 'manager', 'designer', 'member', 'viewer'];
    if (data.role && !validRoles.includes(data.role)) {
      throw new BadRequestException('Invalid role');
    }

    // SECURITY FIX: Prevent role escalation — user cannot assign a role higher than their own
    if (data.role && currentUserId) {
      const roleHierarchy: Record<string, number> = { viewer: 1, member: 2, designer: 3, manager: 4, admin: 5 };
      const currentUserMember = await this.prisma.teamMember.findFirst({
        where: { organizationId, userId: currentUserId },
        select: { role: true },
      });
      const currentUserLevel = roleHierarchy[currentUserMember?.role || 'viewer'] || 0;
      const targetRoleLevel = roleHierarchy[data.role] || 0;
      if (targetRoleLevel > currentUserLevel) {
        throw new ForbiddenException('Cannot assign a role higher than your own');
      }
    }

    const validStatuses = ['active', 'inactive', 'pending', 'invited'];
    if (data.status && !validStatuses.includes(data.status)) {
      throw new BadRequestException('Invalid status');
    }

    return this.prisma.teamMember.update({
      where: { id },
      data: {
        ...(data.role !== undefined && { role: data.role }),
        ...(data.permissions !== undefined && { permissions: data.permissions }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.status === 'active' && !member.joinedAt && { joinedAt: new Date() }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async delete(id: string, organizationId: string, currentUserId: string) {
    const member = await this.findOne(id, organizationId);

    if (member.userId === currentUserId) {
      throw new BadRequestException('Cannot delete yourself');
    }

    await this.prisma.teamMember.delete({
      where: { id },
    });

    return { success: true, message: 'Team member deleted successfully' };
  }

  async invite(data: { email: string; role?: string }, organizationId: string, invitedBy: string) {
    const { email, role = 'member' } = data;

    // SECURITY FIX: Prevent self-invitation
    const inviter = await this.prisma.user.findUnique({
      where: { id: invitedBy },
      select: { email: true },
    });
    if (inviter?.email?.toLowerCase() === email.toLowerCase()) {
      throw new BadRequestException('Cannot invite yourself');
    }

    // Enforce team member limit based on plan
    await this.plansService.enforceTeamLimit(invitedBy);

    // Check if invitation already exists
    const existingInvite = await this.prisma.teamInvite.findFirst({
      where: {
        organizationId,
        email,
        status: 'pending',
      },
    });

    if (existingInvite) {
      throw new ConflictException('Invitation already pending for this email');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.teamMember.findUnique({
      where: {
        organizationId_email: {
          organizationId,
          email,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a team member');
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const invite = await this.prisma.teamInvite.create({
      data: {
        organizationId,
        email,
        role,
        token,
        invitedBy,
        expiresAt,
        status: 'pending',
      },
    });

    return {
      ...invite,
      inviteUrl: `${process.env.APP_URL || 'https://www.luneo.app'}/team/accept?token=${token}`,
    };
  }

  async getInvites(organizationId: string) {
    return this.prisma.teamInvite.findMany({
      where: { organizationId },
      include: {
        inviter: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelInvite(inviteId: string, organizationId: string) {
    const invite = await this.prisma.teamInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      throw new NotFoundException('Invitation not found');
    }

    if (invite.organizationId !== organizationId) {
      throw new ForbiddenException('Access denied to this invitation');
    }

    if (invite.status !== 'pending') {
      throw new BadRequestException('Invitation is not pending');
    }

    return this.prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: 'cancelled' },
    });
  }
}
