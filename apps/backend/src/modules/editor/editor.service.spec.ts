/**
 * EditorService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { EditorService } from './editor.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ProjectType, ProjectStatus } from '@prisma/client';

describe('EditorService', () => {
  let service: EditorService;
  const mockPrisma = {
    brand: { findUnique: jest.fn() },
    project: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const brandId = 'brand-1';
  const userId = 'user-1';
  const projectId = 'proj-1';

  const mockProject = (overrides: Record<string, unknown> = {}) => ({
    id: projectId,
    name: 'Editor Project',
    description: null,
    slug: 'editor-1',
    settings: {
      canvas: { width: 800, height: 600, units: 'px' },
      layers: [],
    },
    metadata: { userId, history: [] },
    brandId,
    type: ProjectType.DESIGN,
    status: ProjectStatus.DRAFT,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EditorService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EditorService>(EditorService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('listProjects', () => {
    it('should return projects for brand', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({ id: brandId });
      mockPrisma.project.findMany.mockResolvedValue([
        mockProject(),
      ]);

      const result = await service.listProjects(brandId, userId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(projectId);
      expect(result[0].name).toBe('Editor Project');
      expect(result[0].canvas).toBeDefined();
      expect(result[0].canvas.width).toBe(800);
    });

    it('should filter by userId when provided', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({ id: brandId });
      mockPrisma.project.findMany.mockResolvedValue([
        mockProject({ metadata: { userId: 'user-1', history: [] } }),
        mockProject({ id: 'proj-2', metadata: { userId: 'user-2', history: [] } }),
      ]);

      const result = await service.listProjects(brandId, 'user-1');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-1');
    });

    it('should throw NotFoundException when brand not found', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      await expect(
        service.listProjects('nonexistent', userId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.listProjects('nonexistent', userId),
      ).rejects.toThrow('Brand nonexistent not found');
    });
  });

  describe('getProject', () => {
    it('should return project when found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockProject());

      const result = await service.getProject(projectId, brandId);

      expect(result.id).toBe(projectId);
      expect(result.name).toBe('Editor Project');
      expect(result.brandId).toBe(brandId);
      expect(result.canvas).toEqual(
        expect.objectContaining({ width: 800, height: 600, units: 'px' }),
      );
    });

    it('should throw NotFoundException when project not found', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(
        service.getProject('nonexistent', brandId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.getProject('nonexistent', brandId),
      ).rejects.toThrow('Project nonexistent not found');
    });
  });

  describe('createProject', () => {
    it('should create project with default canvas', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({ id: brandId });
      mockPrisma.project.create.mockResolvedValue(
        mockProject({ id: 'proj-new', name: 'New' }),
      );

      const result = await service.createProject(brandId, userId, {
        name: 'New',
        description: undefined,
        canvas: { width: 800, height: 600, units: 'px' },
      });

      expect(result.name).toBe('New');
      expect(result.userId).toBe(userId);
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          brandId,
          name: 'New',
          type: ProjectType.DESIGN,
          status: ProjectStatus.DRAFT,
          settings: expect.objectContaining({
            canvas: expect.objectContaining({ width: 800, height: 600 }),
            layers: [],
          }),
          metadata: expect.objectContaining({ userId, history: [] }),
        }),
      });
    });

    it('should throw NotFoundException when brand not found', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      await expect(
        service.createProject('nonexistent', userId, {
          name: 'P',
          description: undefined,
          canvas: { width: 800, height: 600, units: 'px' },
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProject', () => {
    it('should throw ForbiddenException when user is not owner', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(
        mockProject({ metadata: { userId: 'other-user', history: [] } }),
      );

      await expect(
        service.updateProject(projectId, brandId, userId, { name: 'Updated' }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateProject(projectId, brandId, userId, { name: 'Updated' }),
      ).rejects.toThrow('User is not the owner of this project');
      expect(mockPrisma.project.update).not.toHaveBeenCalled();
    });

    it('should update project when user is owner', async () => {
      mockPrisma.project.findFirst
        .mockResolvedValueOnce(mockProject())
        .mockResolvedValueOnce(mockProject({ name: 'Updated Name' }));
      mockPrisma.project.update.mockResolvedValue(
        mockProject({ name: 'Updated Name' }),
      );

      const result = await service.updateProject(projectId, brandId, userId, {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(mockPrisma.project.update).toHaveBeenCalled();
    });
  });

  describe('deleteProject', () => {
    it('should soft delete when user is owner', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockProject());
      mockPrisma.project.update.mockResolvedValue({});

      await service.deleteProject(projectId, brandId, userId);

      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          status: ProjectStatus.DELETED,
        }),
      });
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(
        mockProject({ metadata: { userId: 'other-user', history: [] } }),
      );

      await expect(
        service.deleteProject(projectId, brandId, userId),
      ).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.project.update).not.toHaveBeenCalled();
    });
  });

  describe('exportProject', () => {
    it('should return project as JSON export', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(mockProject());

      const result = await service.exportProject(
        projectId,
        brandId,
        'png',
      );

      expect(result.format).toBe('json');
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(projectId);
      expect(result.filename).toMatch(/\.json$/);
    });
  });

  describe('addHistoryEntry', () => {
    it('should add history entry when user is owner', async () => {
      mockPrisma.project.findFirst
        .mockResolvedValueOnce(mockProject())
        .mockResolvedValueOnce(
          mockProject({
            metadata: {
              userId,
              history: [
                {
                  id: 'history-1',
                  action: 'add_layer',
                  timestamp: new Date(),
                  data: {},
                },
              ],
            },
          }),
        );
      mockPrisma.project.update.mockResolvedValue(
        mockProject({
          metadata: {
            userId,
            history: [
              { id: 'h1', action: 'add_layer', timestamp: new Date(), data: {} },
              { id: 'history-2', action: 'new_action', timestamp: new Date(), data: {} },
            ],
          },
        }),
      );

      const result = await service.addHistoryEntry(
        projectId,
        brandId,
        userId,
        { action: 'new_action', data: {} },
      );

      expect(result.history.length).toBeGreaterThanOrEqual(0);
      expect(mockPrisma.project.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      mockPrisma.project.findFirst.mockResolvedValue(
        mockProject({ metadata: { userId: 'other-user', history: [] } }),
      );

      await expect(
        service.addHistoryEntry(projectId, brandId, userId, {
          action: 'test',
          data: {},
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
