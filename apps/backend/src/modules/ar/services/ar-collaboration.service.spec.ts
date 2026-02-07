/**
 * ArCollaborationService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ArCollaborationService } from './ar-collaboration.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('ArCollaborationService', () => {
  let service: ArCollaborationService;
  const mockPrisma = {
    brand: { findUnique: jest.fn() },
    aRProject: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    aRProjectMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    aRProjectComment: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const brandId = 'brand-1';
  const userId = 'user-1';
  const projectId = 'proj-1';

  const mockProjectRow = (overrides: Record<string, unknown> = {}) => ({
    id: projectId,
    name: 'AR Project',
    description: 'Desc',
    brandId,
    ownerId: userId,
    status: 'active',
    settings: { modelIds: ['model-1'] },
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [
      { userId, role: 'owner', joinedAt: new Date(), user: { id: userId } },
    ],
    comments: [],
    _count: { comments: 0 },
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArCollaborationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ArCollaborationService>(ArCollaborationService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('listProjects', () => {
    it('should return projects for brand', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({ id: brandId });
      mockPrisma.aRProject.findMany.mockResolvedValue([
        mockProjectRow(),
      ]);

      const result = await service.listProjects(brandId, userId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(projectId);
      expect(result[0].name).toBe('AR Project');
      expect(result[0].modelIds).toEqual(['model-1']);
      expect(result[0].members).toHaveLength(1);
      expect(result[0].permissions).toBeDefined();
    });

    it('should throw NotFoundException when brand not found', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      await expect(service.listProjects('nonexistent', userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.listProjects('nonexistent', userId)).rejects.toThrow(
        'Brand nonexistent not found',
      );
    });
  });

  describe('getProject', () => {
    it('should return project when found', async () => {
      mockPrisma.aRProject.findFirst.mockResolvedValue(mockProjectRow());

      const result = await service.getProject(projectId, brandId, userId);

      expect(result.id).toBe(projectId);
      expect(result.name).toBe('AR Project');
      expect(result.brandId).toBe(brandId);
      expect(result.permissions.canEdit).toBe(true);
    });

    it('should throw NotFoundException when project not found', async () => {
      mockPrisma.aRProject.findFirst.mockResolvedValue(null);

      await expect(
        service.getProject('nonexistent', brandId, userId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getProject('nonexistent', brandId, userId),
      ).rejects.toThrow('Project nonexistent not found');
    });
  });

  describe('createProject', () => {
    it('should create project with owner as member', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({ id: brandId });
      mockPrisma.aRProject.create.mockResolvedValue(
        mockProjectRow({ id: 'proj-new', name: 'New Project' }),
      );

      const result = await service.createProject(brandId, userId, {
        name: 'New Project',
        description: 'Desc',
        modelIds: ['m1'],
        permissions: { canEdit: true, canDelete: true, canInvite: true, canComment: true },
      } as any);

      expect(result.name).toBe('New Project');
      expect(result.members).toHaveLength(1);
      expect(mockPrisma.aRProject.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'New Project',
            brandId,
            ownerId: userId,
            members: {
              create: { userId, role: 'owner' },
            },
          }),
        }),
      );
    });

    it('should throw NotFoundException when brand not found', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      await expect(
        service.createProject('nonexistent', userId, {
          name: 'P',
          description: undefined,
          modelIds: [],
          permissions: { canEdit: false, canDelete: false, canInvite: false, canComment: true },
        } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProject', () => {
    it('should throw ForbiddenException when user is viewer', async () => {
      mockPrisma.aRProject.findFirst.mockResolvedValue(
        mockProjectRow({
          members: [
            { userId, role: 'viewer', joinedAt: new Date(), user: { id: userId } },
          ],
        }),
      );

      await expect(
        service.updateProject(projectId, brandId, userId, { name: 'Updated' }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateProject(projectId, brandId, userId, { name: 'Updated' }),
      ).rejects.toThrow('Insufficient permissions');
      expect(mockPrisma.aRProject.update).not.toHaveBeenCalled();
    });

    it('should update project when user is owner', async () => {
      mockPrisma.aRProject.findFirst
        .mockResolvedValueOnce(mockProjectRow())
        .mockResolvedValueOnce(
          mockProjectRow({ name: 'Updated Name' }),
        );
      mockPrisma.aRProject.update.mockResolvedValue(
        mockProjectRow({ name: 'Updated Name' }),
      );

      const result = await service.updateProject(projectId, brandId, userId, {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(mockPrisma.aRProject.update).toHaveBeenCalled();
    });
  });

  describe('deleteProject', () => {
    it('should throw ForbiddenException when user is not owner', async () => {
      mockPrisma.aRProject.findFirst.mockResolvedValue(
        mockProjectRow({
          members: [
            { userId, role: 'editor', joinedAt: new Date(), user: { id: userId } },
          ],
        }),
      );

      await expect(
        service.deleteProject(projectId, brandId, userId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.deleteProject(projectId, brandId, userId),
      ).rejects.toThrow('Only project owner can delete the project');
      expect(mockPrisma.aRProject.delete).not.toHaveBeenCalled();
    });

    it('should delete project when user is owner', async () => {
      mockPrisma.aRProject.findFirst.mockResolvedValue(mockProjectRow());
      mockPrisma.aRProject.delete.mockResolvedValue({});

      await service.deleteProject(projectId, brandId, userId);

      expect(mockPrisma.aRProject.delete).toHaveBeenCalledWith({
        where: { id: projectId },
      });
    });
  });

  describe('addMember', () => {
    it('should throw BadRequestException when member already exists', async () => {
      mockPrisma.aRProject.findFirst.mockResolvedValue(mockProjectRow());
      mockPrisma.aRProjectMember.findUnique.mockResolvedValue({
        projectId,
        userId: 'new-user',
      });

      await expect(
        service.addMember(
          projectId,
          brandId,
          userId,
          { userId: 'new-user', role: 'viewer' },
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.addMember(
          projectId,
          brandId,
          userId,
          { userId: 'new-user', role: 'viewer' },
        ),
      ).rejects.toThrow('Member already exists in project');
      expect(mockPrisma.aRProjectMember.create).not.toHaveBeenCalled();
    });

    it('should add member when user has permission', async () => {
      mockPrisma.aRProject.findFirst
        .mockResolvedValueOnce(mockProjectRow())
        .mockResolvedValueOnce(
          mockProjectRow({
            members: [
              { userId, role: 'owner', joinedAt: new Date(), user: { id: userId } },
              { userId: 'new-user', role: 'viewer', joinedAt: new Date(), user: { id: 'new-user' } },
            ],
          }),
        );
      mockPrisma.aRProjectMember.findUnique.mockResolvedValue(null);
      mockPrisma.aRProjectMember.create.mockResolvedValue({});

      const result = await service.addMember(projectId, brandId, userId, {
        userId: 'new-user',
        role: 'viewer',
      });

      expect(result.members.length).toBeGreaterThanOrEqual(1);
      expect(mockPrisma.aRProjectMember.create).toHaveBeenCalledWith({
        data: {
          projectId,
          userId: 'new-user',
          role: 'viewer',
        },
      });
    });
  });

  describe('removeMember', () => {
    it('should throw ForbiddenException when trying to remove owner', async () => {
      mockPrisma.aRProject.findFirst.mockResolvedValue(
        mockProjectRow({
          members: [
            { userId, role: 'owner', joinedAt: new Date(), user: { id: userId } },
            { userId: 'member-1', role: 'viewer', joinedAt: new Date(), user: { id: 'member-1' } },
          ],
        }),
      );

      await expect(
        service.removeMember(projectId, brandId, userId, userId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.removeMember(projectId, brandId, userId, userId),
      ).rejects.toThrow('Cannot remove project owner');
    });
  });

  describe('getComments', () => {
    it('should return comments for project', async () => {
      mockPrisma.aRProject.findFirst.mockResolvedValue({ id: projectId });
      mockPrisma.aRProjectComment.findMany.mockResolvedValue([
        {
          id: 'c1',
          projectId,
          userId,
          content: 'Comment',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.getComments(projectId, brandId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('c1');
      expect(result[0].content).toBe('Comment');
    });

    it('should throw NotFoundException when project not found', async () => {
      mockPrisma.aRProject.findFirst.mockResolvedValue(null);

      await expect(
        service.getComments('nonexistent', brandId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addComment', () => {
    it('should add comment when user is member', async () => {
      mockPrisma.aRProject.findFirst.mockResolvedValue(mockProjectRow());
      mockPrisma.aRProjectComment.create.mockResolvedValue({
        id: 'c1',
        projectId,
        userId,
        content: 'New comment',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.addComment(projectId, brandId, userId, {
        content: 'New comment',
      });

      expect(result.id).toBe('c1');
      expect(result.content).toBe('New comment');
      expect(mockPrisma.aRProjectComment.create).toHaveBeenCalledWith({
        data: {
          projectId,
          userId,
          content: 'New comment',
        },
      });
    });

    it('should throw ForbiddenException when user is not member', async () => {
      mockPrisma.aRProject.findFirst.mockResolvedValue(
        mockProjectRow({ members: [] }),
      );

      await expect(
        service.addComment(projectId, brandId, 'non-member', {
          content: 'Comment',
        }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.addComment(projectId, brandId, 'non-member', {
          content: 'Comment',
        }),
      ).rejects.toThrow('User is not a member of this project');
    });
  });
});
