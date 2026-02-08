/**
 * CollaborationService - Unit tests
 * Tests for share, permissions, comments
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CollaborationService } from './collaboration.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ResourceType } from '../interfaces/collaboration.interface';

describe('CollaborationService', () => {
  let service: CollaborationService;
  let prisma: jest.Mocked<PrismaService>;

  const mockSharedResourceCreate = jest.fn();
  const mockSharedResourceFindMany = jest.fn();
  const mockSharedResourceFindFirst = jest.fn();
  const mockSharedResourceUpdate = jest.fn();
  const mockCommentFindUnique = jest.fn();
  const mockCommentCreate = jest.fn();
  const mockCommentFindMany = jest.fn();
  const mockCommentDelete = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaborationService,
        {
          provide: PrismaService,
          useValue: {
            sharedResource: {
              create: mockSharedResourceCreate,
              findMany: mockSharedResourceFindMany,
              findFirst: mockSharedResourceFindFirst,
              update: mockSharedResourceUpdate,
            },
            comment: {
              findUnique: mockCommentFindUnique,
              create: mockCommentCreate,
              findMany: mockCommentFindMany,
              delete: mockCommentDelete,
            },
          },
        },
      ],
    }).compile();

    service = module.get<CollaborationService>(CollaborationService);
    prisma = module.get(PrismaService);
  });

  describe('shareResource', () => {
    it('should create shared resource in DB', async () => {
      const created = {
        id: 'sr_1',
        resourceType: ResourceType.DESIGN,
        resourceId: 'design_1',
        sharedWith: ['user_2'],
        permissions: { user_2: ['view', 'edit'] },
        isPublic: false,
        publicToken: null,
        createdBy: 'user_1',
        brandId: 'brand_1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockSharedResourceCreate.mockResolvedValue(created);

      const result = await service.shareResource(
        'user_1',
        'brand_1',
        ResourceType.DESIGN,
        'design_1',
        ['user_2'],
        { user_2: ['view', 'edit'] },
        false,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('sr_1');
      expect(result.resourceType).toBe(ResourceType.DESIGN);
      expect(result.resourceId).toBe('design_1');
      expect(result.sharedWith).toEqual(['user_2']);
      expect(mockSharedResourceCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resourceType: ResourceType.DESIGN,
            resourceId: 'design_1',
            createdBy: 'user_1',
            brandId: 'brand_1',
            isPublic: false,
          }),
        }),
      );
    });

    it('should set publicToken when isPublic is true', async () => {
      const created = {
        id: 'sr_2',
        resourceType: ResourceType.DESIGN,
        resourceId: 'design_2',
        sharedWith: [],
        permissions: {},
        isPublic: true,
        publicToken: 'abc123hex',
        createdBy: 'user_1',
        brandId: 'brand_1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockSharedResourceCreate.mockResolvedValue(created);

      await service.shareResource(
        'user_1',
        'brand_1',
        ResourceType.DESIGN,
        'design_2',
        [],
        {},
        true,
      );

      expect(mockSharedResourceCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isPublic: true,
            publicToken: expect.any(String),
          }),
        }),
      );
    });
  });

  describe('getSharedResources', () => {
    it('should return resources for user (shared with or created by)', async () => {
      const records = [
        {
          id: 'sr_1',
          resourceType: ResourceType.DESIGN,
          resourceId: 'design_1',
          sharedWith: ['user_2'],
          permissions: {},
          isPublic: false,
          publicToken: null,
          createdBy: 'user_1',
          brandId: 'brand_1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockSharedResourceFindMany.mockResolvedValue(records);

      const result = await service.getSharedResources('user_2', 'brand_1');

      expect(result).toHaveLength(1);
      expect(result[0].resourceId).toBe('design_1');
      expect(mockSharedResourceFindMany).toHaveBeenCalledWith({
        where: {
          brandId: 'brand_1',
          OR: [
            { sharedWith: { has: 'user_2' } },
            { createdBy: 'user_2' },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('updatePermissions', () => {
    it('should update permissions when caller is owner', async () => {
      const existing = {
        id: 'sr_1',
        resourceType: ResourceType.DESIGN,
        resourceId: 'design_1',
        sharedWith: ['user_2'],
        permissions: {},
        isPublic: false,
        publicToken: null,
        createdBy: 'user_1',
        brandId: 'brand_1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updated = { ...existing, sharedWith: ['user_2', 'user_3'], permissions: { user_2: ['view'], user_3: ['view', 'edit'] } };
      mockSharedResourceFindFirst.mockResolvedValue(existing);
      mockSharedResourceUpdate.mockResolvedValue(updated);

      const result = await service.updatePermissions(
        'sr_1',
        'user_1',
        'brand_1',
        { user_2: ['view'], user_3: ['view', 'edit'] },
      );

      expect(result.sharedWith).toContain('user_2');
      expect(result.sharedWith).toContain('user_3');
      expect(mockSharedResourceUpdate).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when caller is not owner', async () => {
      const existing = {
        id: 'sr_1',
        createdBy: 'user_1',
        brandId: 'brand_1',
      };
      mockSharedResourceFindFirst.mockResolvedValue(existing);

      await expect(
        service.updatePermissions('sr_1', 'user_2', 'brand_1', { user_3: ['view'] }),
      ).rejects.toThrow(ForbiddenException);
      expect(mockSharedResourceUpdate).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when resource not found', async () => {
      mockSharedResourceFindFirst.mockResolvedValue(null);

      await expect(
        service.updatePermissions('sr_missing', 'user_1', 'brand_1', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkAccess', () => {
    it('should return true for owner', async () => {
      mockSharedResourceFindFirst.mockResolvedValue({
        createdBy: 'user_1',
        isPublic: false,
        permissions: { user_2: ['view'] },
      });

      const result = await service.checkAccess('user_1', ResourceType.DESIGN, 'design_1', 'delete');
      expect(result).toBe(true);
    });

    it('should return true for public resource when required permission is view', async () => {
      mockSharedResourceFindFirst.mockResolvedValue({
        createdBy: 'user_1',
        isPublic: true,
        permissions: {},
      });

      const result = await service.checkAccess('user_3', ResourceType.DESIGN, 'design_1', 'view');
      expect(result).toBe(true);
    });

    it('should return true when user has required permission', async () => {
      mockSharedResourceFindFirst.mockResolvedValue({
        createdBy: 'user_1',
        isPublic: false,
        permissions: { user_2: ['view', 'edit'] },
      });

      const result = await service.checkAccess('user_2', ResourceType.DESIGN, 'design_1', 'edit');
      expect(result).toBe(true);
    });

    it('should return false when user has no access', async () => {
      mockSharedResourceFindFirst.mockResolvedValue({
        createdBy: 'user_1',
        isPublic: false,
        permissions: { user_2: ['view'] },
      });

      const result = await service.checkAccess('user_3', ResourceType.DESIGN, 'design_1', 'view');
      expect(result).toBe(false);
    });

    it('should return false when resource not found', async () => {
      mockSharedResourceFindFirst.mockResolvedValue(null);
      const result = await service.checkAccess('user_1', ResourceType.DESIGN, 'design_1', 'view');
      expect(result).toBe(false);
    });
  });

  describe('addComment', () => {
    it('should create comment with author info', async () => {
      const created = {
        id: 'comment_1',
        resourceType: ResourceType.DESIGN,
        resourceId: 'design_1',
        content: 'Great design',
        parentId: null,
        authorId: 'user_1',
        sharedResourceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: 'user_1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      };
      mockCommentCreate.mockResolvedValue(created);

      const result = await service.addComment(
        'user_1',
        ResourceType.DESIGN,
        'design_1',
        'Great design',
      );

      expect(result.id).toBe('comment_1');
      expect(result.content).toBe('Great design');
      expect(result.author.name).toBe('John Doe');
      expect(result.author.email).toBe('john@example.com');
      expect(mockCommentCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'Great design',
            authorId: 'user_1',
            resourceId: 'design_1',
          }),
          include: expect.objectContaining({
            author: expect.anything(),
          }),
        }),
      );
    });

    it('should throw NotFoundException when parent comment does not exist', async () => {
      mockCommentFindUnique.mockResolvedValue(null);

      await expect(
        service.addComment('user_1', ResourceType.DESIGN, 'design_1', 'Reply', 'parent_missing'),
      ).rejects.toThrow(NotFoundException);
      expect(mockCommentCreate).not.toHaveBeenCalled();
    });

    it('should allow reply when parent exists', async () => {
      mockCommentFindUnique.mockResolvedValue({ id: 'parent_1' });
      const created = {
        id: 'comment_2',
        resourceType: ResourceType.DESIGN,
        resourceId: 'design_1',
        content: 'Reply',
        parentId: 'parent_1',
        authorId: 'user_2',
        sharedResourceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: { id: 'user_2', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
      };
      mockCommentCreate.mockResolvedValue(created);

      const result = await service.addComment(
        'user_2',
        ResourceType.DESIGN,
        'design_1',
        'Reply',
        'parent_1',
      );

      expect(result.parentId).toBe('parent_1');
    });
  });

  describe('getComments', () => {
    it('should return threaded comments (top-level with replies)', async () => {
      const records = [
        {
          id: 'c1',
          resourceType: ResourceType.DESIGN,
          resourceId: 'design_1',
          content: 'Top',
          parentId: null,
          authorId: 'user_1',
          sharedResourceId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: { id: 'user_1', firstName: 'John', lastName: 'Doe', email: 'j@example.com' },
          replies: [
            {
              id: 'c2',
              resourceType: ResourceType.DESIGN,
              resourceId: 'design_1',
              content: 'Reply',
              parentId: 'c1',
              authorId: 'user_2',
              sharedResourceId: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              author: { id: 'user_2', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' },
              replies: [],
            },
          ],
        },
      ];
      mockCommentFindMany.mockResolvedValue(records);

      const result = await service.getComments(ResourceType.DESIGN, 'design_1');

      expect(result).toHaveLength(1);
      expect(result[0].replies).toHaveLength(1);
      expect(result[0].replies![0].content).toBe('Reply');
      expect(mockCommentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            resourceType: ResourceType.DESIGN,
            resourceId: 'design_1',
            parentId: null,
          }),
        }),
      );
    });
  });

  describe('deleteComment', () => {
    it('should delete when caller is author', async () => {
      mockCommentFindUnique.mockResolvedValue({
        id: 'comment_1',
        authorId: 'user_1',
      });
      mockCommentDelete.mockResolvedValue({});

      await service.deleteComment('comment_1', 'user_1');

      expect(mockCommentDelete).toHaveBeenCalledWith({ where: { id: 'comment_1' } });
    });

    it('should throw ForbiddenException when caller is not author', async () => {
      mockCommentFindUnique.mockResolvedValue({
        id: 'comment_1',
        authorId: 'user_1',
      });

      await expect(service.deleteComment('comment_1', 'user_2')).rejects.toThrow(ForbiddenException);
      expect(mockCommentDelete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when comment not found', async () => {
      mockCommentFindUnique.mockResolvedValue(null);

      await expect(service.deleteComment('comment_missing', 'user_1')).rejects.toThrow(NotFoundException);
      expect(mockCommentDelete).not.toHaveBeenCalled();
    });
  });
});
