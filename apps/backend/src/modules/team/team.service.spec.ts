/**
 * TeamService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('TeamService', () => {
  let service: TeamService;
  const mockPrisma = {
    teamMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    teamInvite: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const orgId = 'org-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TeamService>(TeamService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return team members for organization', async () => {
      const members = [
        {
          id: 'm1',
          organizationId: orgId,
          userId: 'u1',
          role: 'member',
          user: { id: 'u1', email: 'u1@test.com', firstName: 'John', lastName: 'Doe', avatar: null },
          inviter: {},
        },
      ];
      mockPrisma.teamMember.findMany.mockResolvedValue(members);

      const result = await service.findAll(orgId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('m1');
      expect(mockPrisma.teamMember.findMany).toHaveBeenCalledWith({
        where: { organizationId: orgId },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return member when found and same organization', async () => {
      const member = {
        id: 'm1',
        organizationId: orgId,
        userId: 'u1',
        user: {},
        inviter: {},
      };
      mockPrisma.teamMember.findUnique.mockResolvedValue(member);

      const result = await service.findOne('m1', orgId);

      expect(result).toEqual(member);
      expect(result.organizationId).toBe(orgId);
    });

    it('should throw NotFoundException when member not found', async () => {
      mockPrisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', orgId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent', orgId)).rejects.toThrow(
        'Team member not found',
      );
    });

    it('should throw ForbiddenException when member belongs to another org', async () => {
      mockPrisma.teamMember.findUnique.mockResolvedValue({
        id: 'm1',
        organizationId: 'other-org',
        userId: 'u1',
        user: {},
        inviter: {},
      });

      await expect(service.findOne('m1', orgId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findOne('m1', orgId)).rejects.toThrow(
        'Access denied to this team member',
      );
    });
  });

  describe('update', () => {
    it('should update member role', async () => {
      const member = {
        id: 'm1',
        organizationId: orgId,
        userId: 'u1',
        joinedAt: null,
        user: {},
        inviter: {},
      };
      mockPrisma.teamMember.findUnique.mockResolvedValue(member);
      mockPrisma.teamMember.update.mockResolvedValue({
        ...member,
        role: 'designer',
        user: {},
      });

      const result = await service.update('m1', { role: 'designer' }, orgId);

      expect(result.role).toBe('designer');
      expect(mockPrisma.teamMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'm1' },
          data: expect.objectContaining({ role: 'designer' }),
        }),
      );
    });

    it('should throw BadRequestException for invalid role', async () => {
      const member = { id: 'm1', organizationId: orgId, userId: 'u1', user: {}, inviter: {} };
      mockPrisma.teamMember.findUnique.mockResolvedValue(member);

      await expect(
        service.update('m1', { role: 'invalid_role' }, orgId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('m1', { role: 'invalid_role' }, orgId),
      ).rejects.toThrow('Invalid role');
    });

    it('should throw BadRequestException for invalid status', async () => {
      const member = { id: 'm1', organizationId: orgId, userId: 'u1', user: {}, inviter: {} };
      mockPrisma.teamMember.findUnique.mockResolvedValue(member);

      await expect(
        service.update('m1', { status: 'invalid_status' }, orgId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update('m1', { status: 'invalid_status' }, orgId),
      ).rejects.toThrow('Invalid status');
    });
  });

  describe('delete', () => {
    it('should delete member when not self', async () => {
      const member = {
        id: 'm1',
        organizationId: orgId,
        userId: 'u1',
        user: {},
        inviter: {},
      };
      mockPrisma.teamMember.findUnique.mockResolvedValue(member);
      mockPrisma.teamMember.delete.mockResolvedValue(member);

      const result = await service.delete('m1', orgId, 'other-user-id');

      expect(result.success).toBe(true);
      expect(mockPrisma.teamMember.delete).toHaveBeenCalledWith({
        where: { id: 'm1' },
      });
    });

    it('should throw BadRequestException when deleting self', async () => {
      const member = {
        id: 'm1',
        organizationId: orgId,
        userId: 'u1',
        user: {},
        inviter: {},
      };
      mockPrisma.teamMember.findUnique.mockResolvedValue(member);

      await expect(service.delete('m1', orgId, 'u1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.delete('m1', orgId, 'u1')).rejects.toThrow(
        'Cannot delete yourself',
      );
      expect(mockPrisma.teamMember.delete).not.toHaveBeenCalled();
    });
  });

  describe('invite', () => {
    it('should create invite when no pending invite and not already member', async () => {
      mockPrisma.teamInvite.findFirst.mockResolvedValue(null);
      mockPrisma.teamMember.findUnique.mockResolvedValue(null);
      mockPrisma.teamInvite.create.mockImplementation((args: { data: { token: string } }) =>
      Promise.resolve({
        id: 'inv-1',
        organizationId: orgId,
        email: 'new@test.com',
        role: 'member',
        token: args?.data?.token ?? 'token',
        invitedBy: 'user-1',
        expiresAt: new Date(),
        status: 'pending',
      }),
    );

      const result = await service.invite(
        { email: 'new@test.com', role: 'member' },
        orgId,
        'user-1',
      );

      expect(result.inviteUrl).toMatch(/\/team\/accept\?token=[a-f0-9]+/);
      expect(mockPrisma.teamInvite.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when invitation already pending', async () => {
      mockPrisma.teamInvite.findFirst.mockResolvedValue({
        id: 'inv-1',
        email: 'new@test.com',
        status: 'pending',
      });

      await expect(
        service.invite({ email: 'new@test.com' }, orgId, 'user-1'),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.invite({ email: 'new@test.com' }, orgId, 'user-1'),
      ).rejects.toThrow('Invitation already pending for this email');
      expect(mockPrisma.teamInvite.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when user already team member', async () => {
      mockPrisma.teamInvite.findFirst.mockResolvedValue(null);
      mockPrisma.teamMember.findUnique.mockResolvedValue({
        organizationId: orgId,
        email: 'new@test.com',
      });

      await expect(
        service.invite({ email: 'new@test.com' }, orgId, 'user-1'),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.invite({ email: 'new@test.com' }, orgId, 'user-1'),
      ).rejects.toThrow('User is already a team member');
    });
  });

  describe('cancelInvite', () => {
    it('should cancel pending invite', async () => {
      mockPrisma.teamInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        organizationId: orgId,
        status: 'pending',
      });
      mockPrisma.teamInvite.update.mockResolvedValue({
        id: 'inv-1',
        status: 'cancelled',
      });

      const result = await service.cancelInvite('inv-1', orgId);

      expect(result.status).toBe('cancelled');
      expect(mockPrisma.teamInvite.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { status: 'cancelled' },
      });
    });

    it('should throw NotFoundException when invite not found', async () => {
      mockPrisma.teamInvite.findUnique.mockResolvedValue(null);

      await expect(service.cancelInvite('nonexistent', orgId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.cancelInvite('nonexistent', orgId)).rejects.toThrow(
        'Invitation not found',
      );
    });

    it('should throw BadRequestException when invite is not pending', async () => {
      mockPrisma.teamInvite.findUnique.mockResolvedValue({
        id: 'inv-1',
        organizationId: orgId,
        status: 'accepted',
      });

      await expect(service.cancelInvite('inv-1', orgId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.cancelInvite('inv-1', orgId)).rejects.toThrow(
        'Invitation is not pending',
      );
    });
  });
});
