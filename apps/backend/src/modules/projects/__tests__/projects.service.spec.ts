import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from '../services/projects.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrentUser } from '@/common/types/user.types';
import { UserRole } from '@prisma/client';

describe('ProjectsService', () => {
  let service: ProjectsService;

  const mockPrisma = {
    project: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const currentUser: CurrentUser = {
    id: 'user-1',
    email: 'user@test.com',
    role: UserRole.BRAND_ADMIN,
    brandId: 'brand-1',
  };

  const orgId = 'brand-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated projects', async () => {
      const projects = [
        {
          id: 'proj-1',
          name: 'Project 1',
          slug: 'project-1',
          brandId: orgId,
          workspace: { id: 'ws-1', name: 'Workspace' },
        },
      ];
      mockPrisma.project.findMany.mockResolvedValue(projects);
      mockPrisma.project.count.mockResolvedValue(1);
      const result = await service.findAll(orgId, {}, { page: 1, limit: 10 });
      expect(result.data).toEqual(projects);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { brandId: orgId },
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should apply search filter when provided', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);
      await service.findAll(orgId, { search: 'test' }, { page: 1, limit: 20 });
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return project when found and belongs to org', async () => {
      const project = {
        id: 'proj-1',
        name: 'Project 1',
        brandId: orgId,
        workspace: { id: 'ws-1', name: 'WS' },
      };
      mockPrisma.project.findFirst.mockResolvedValue(project);
      const result = await service.findOne('proj-1', orgId);
      expect(result).toEqual(project);
      expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'proj-1', brandId: orgId },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);
      await expect(service.findOne('invalid', orgId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create project with unique slug', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);
      const created = {
        id: 'proj-1',
        name: 'New Project',
        slug: 'new-project',
        description: 'Desc',
        type: 'WEB',
        status: 'DRAFT',
        brandId: orgId,
        apiKey: 'pk_abc',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.project.create.mockResolvedValue(created);
      const result = await service.create(
        orgId,
        { name: 'New Project', slug: 'new-project', type: 'WEB' as any },
        currentUser,
      );
      expect(result.name).toBe('New Project');
      expect(result.slug).toBe('new-project');
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'New Project',
          slug: 'new-project',
          brandId: orgId,
          status: 'DRAFT',
        }),
        select: expect.any(Object),
      });
    });

    it('should throw BadRequestException when slug already exists', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'existing',
        slug: 'taken',
      });
      await expect(
        service.create(orgId, { name: 'X', slug: 'taken', type: 'WEB' as any }, currentUser),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.project.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update project', async () => {
      const existing = { id: 'proj-1', brandId: orgId };
      mockPrisma.project.findFirst.mockResolvedValue(existing);
      mockPrisma.project.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.project.findFirst.mockResolvedValueOnce(null);
      const updated = {
        id: 'proj-1',
        name: 'Updated',
        slug: 'new-project',
        apiKey: 'pk_xxx',
        updatedAt: new Date(),
      };
      mockPrisma.project.update.mockResolvedValue(updated);
      const result = await service.update(
        'proj-1',
        orgId,
        { name: 'Updated', slug: 'new-project' },
      );
      expect(result.name).toBe('Updated');
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
        data: expect.objectContaining({
          name: 'Updated',
          slug: 'new-project',
        }),
        select: expect.any(Object),
      });
    });

    it('should throw BadRequestException when new slug already exists', async () => {
      const existing = { id: 'proj-1', brandId: orgId };
      mockPrisma.project.findFirst
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ id: 'other', slug: 'taken' });
      await expect(
        service.update('proj-1', orgId, { slug: 'taken' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should archive project (soft delete)', async () => {
      const existing = { id: 'proj-1', brandId: orgId };
      mockPrisma.project.findFirst.mockResolvedValue(existing);
      const archived = { ...existing, status: 'ARCHIVED' };
      mockPrisma.project.update.mockResolvedValue(archived);
      const result = await service.remove('proj-1', orgId);
      expect(result.status).toBe('ARCHIVED');
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: 'proj-1' },
        data: { status: 'ARCHIVED' },
      });
    });
  });

  describe('regenerateApiKey', () => {
    it('should regenerate api key', async () => {
      const existing = { id: 'proj-1', brandId: orgId };
      mockPrisma.project.findFirst.mockResolvedValue(existing);
      mockPrisma.project.update.mockResolvedValue({
        id: 'proj-1',
        apiKey: 'pk_newkey',
        updatedAt: new Date(),
      });
      const result = await service.regenerateApiKey('proj-1', orgId);
      expect(result.apiKey).toBe('pk_newkey');
      expect(result.apiKey).toMatch(/^pk_/);
    });
  });
});
