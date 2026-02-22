import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { KnowledgeService } from '../knowledge.service';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { VectorService } from '@/libs/vector/vector.service';
import { LlmService } from '@/libs/llm/llm.service';
import { ChunkingService } from '@/libs/chunking';
import { DocumentParserService } from '@/libs/document-parser';
import { QueuesService, JOB_TYPES } from '@/libs/queues';
import { StorageService } from '@/libs/storage/storage.service';
import { KBSourceType, KBSourceStatus } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';
import { CreateKnowledgeBaseDto } from '../dto/create-knowledge-base.dto';
import { CreateKnowledgeSourceDto } from '../dto/create-knowledge-source.dto';

const mockKnowledgeBaseCreate = jest.fn();
const mockKnowledgeBaseFindMany = jest.fn();
const mockKnowledgeBaseFindUnique = jest.fn();
const mockKnowledgeBaseUpdate = jest.fn();
const mockKnowledgeSourceCreate = jest.fn();
const mockKnowledgeSourceFindUnique = jest.fn();
const mockKnowledgeSourceUpdate = jest.fn();
const mockKnowledgeDocumentCreate = jest.fn();
const mockKnowledgeDocumentFindMany = jest.fn();
const mockKnowledgeDocumentUpdate = jest.fn();
const mockKnowledgeDocumentCount = jest.fn();
const mockKnowledgeChunkCreate = jest.fn();
const mockKnowledgeChunkFindMany = jest.fn();
const mockKnowledgeChunkDeleteMany = jest.fn();
const mockKnowledgeChunkAggregate = jest.fn();
const mockKnowledgeChunkCount = jest.fn();
const mockKnowledgeDocumentDeleteMany = jest.fn();
const mockTransaction = jest.fn();

const mockPrisma = {
  knowledgeBase: {
    create: mockKnowledgeBaseCreate,
    findMany: mockKnowledgeBaseFindMany,
    findUnique: mockKnowledgeBaseFindUnique,
    update: mockKnowledgeBaseUpdate,
  },
  knowledgeSource: {
    create: mockKnowledgeSourceCreate,
    findUnique: mockKnowledgeSourceFindUnique,
    update: mockKnowledgeSourceUpdate,
  },
  knowledgeDocument: {
    create: mockKnowledgeDocumentCreate,
    findMany: mockKnowledgeDocumentFindMany,
    update: mockKnowledgeDocumentUpdate,
    deleteMany: mockKnowledgeDocumentDeleteMany,
    count: mockKnowledgeDocumentCount,
  },
  knowledgeChunk: {
    create: mockKnowledgeChunkCreate,
    createMany: jest.fn(),
    findMany: mockKnowledgeChunkFindMany,
    deleteMany: mockKnowledgeChunkDeleteMany,
    aggregate: mockKnowledgeChunkAggregate,
    count: mockKnowledgeChunkCount,
  },
  $transaction: mockTransaction,
};

const mockCache = {
  invalidateCachePattern: jest.fn(),
};

const mockVector = {
  upsert: jest.fn(),
  delete: jest.fn(),
};

const mockLlm = {
  generateEmbedding: jest.fn(),
};

const mockChunking = {
  chunkText: jest.fn(),
};

const mockDocumentParser = {
  parseFile: jest.fn(),
  parseText: jest.fn(),
  parseWebpage: jest.fn(),
};

const mockStorage = {
  uploadFile: jest.fn(),
};

const mockQueues = {
  addKnowledgeIndexingJob: jest.fn(),
};

const mockUser: CurrentUser = {
  id: 'user-1',
  email: 'user@test.com',
  role: 'ADMIN',
  brandId: 'org-1',
};

describe('KnowledgeService', () => {
  let service: KnowledgeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeService,
        { provide: PrismaOptimizedService, useValue: mockPrisma },
        { provide: SmartCacheService, useValue: mockCache },
        { provide: VectorService, useValue: mockVector },
        { provide: LlmService, useValue: mockLlm },
        { provide: ChunkingService, useValue: mockChunking },
        { provide: DocumentParserService, useValue: mockDocumentParser },
        { provide: StorageService, useValue: mockStorage },
        { provide: QueuesService, useValue: mockQueues },
      ],
    }).compile();

    service = module.get<KnowledgeService>(KnowledgeService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBase', () => {
    it('should create knowledge base for organization', async () => {
      const dto: CreateKnowledgeBaseDto = {
        name: 'Ma base',
        description: 'Description',
        language: 'fr',
        chunkingStrategy: 'semantic',
      };
      const created = {
        id: 'kb-1',
        organizationId: 'org-1',
        name: 'Ma base',
        description: 'Description',
        language: 'fr',
        chunkingStrategy: 'semantic',
      };
      mockKnowledgeBaseCreate.mockResolvedValue(created);

      const result = await service.createBase(mockUser, dto);

      expect(result).toEqual(created);
      expect(mockKnowledgeBaseCreate).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          name: 'Ma base',
          description: 'Description',
          language: 'fr',
          chunkingStrategy: 'semantic',
        },
      });
    });

    it('should throw ForbiddenException when no organization', async () => {
      const userWithoutOrg = { ...mockUser, brandId: null };

      await expect(
        service.createBase(userWithoutOrg, { name: 'Base' }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.createBase(userWithoutOrg, { name: 'Base' }),
      ).rejects.toThrow('Aucune organisation associée');
    });
  });

  describe('listBases', () => {
    it('should return KBs for organization', async () => {
      const bases = [
        { id: 'kb-1', name: 'Base 1', _count: { sources: 2 } },
        { id: 'kb-2', name: 'Base 2', _count: { sources: 0 } },
      ];
      mockKnowledgeBaseFindMany.mockResolvedValue(bases);

      const result = await service.listBases(mockUser);

      expect(result).toEqual(bases);
      expect(mockKnowledgeBaseFindMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { sources: true } } },
      });
    });
  });

  describe('getBase', () => {
    it('should return KB when found and user has access', async () => {
      const base = {
        id: 'kb-1',
        organizationId: 'org-1',
        name: 'Base',
        deletedAt: null,
        sources: [],
        _count: { sources: 1 },
      };
      mockKnowledgeBaseFindUnique.mockResolvedValue(base);

      const result = await service.getBase(mockUser, 'kb-1');

      expect(result).toEqual(base);
      expect(mockKnowledgeBaseFindUnique).toHaveBeenCalledWith({
        where: { id: 'kb-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when KB not found', async () => {
      mockKnowledgeBaseFindUnique.mockResolvedValue(null);

      await expect(service.getBase(mockUser, 'invalid')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getBase(mockUser, 'invalid')).rejects.toThrow(
        'Base de connaissances introuvable',
      );
    });

    it('should throw ForbiddenException when KB belongs to another org', async () => {
      mockKnowledgeBaseFindUnique.mockResolvedValue({
        id: 'kb-1',
        organizationId: 'other-org',
        deletedAt: null,
      });

      await expect(service.getBase(mockUser, 'kb-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addSource (createSource)', () => {
    const base = {
      id: 'kb-1',
      organizationId: 'org-1',
      deletedAt: null,
    };

    beforeEach(() => {
      mockKnowledgeBaseFindUnique.mockResolvedValue(base);
    });

    it('should create source and enqueue indexing job', async () => {
      const dto: CreateKnowledgeSourceDto = {
        name: 'Doc technique',
        type: KBSourceType.TEXT,
        textContent: 'Contenu du document',
      };
      const createdSource = {
        id: 'src-1',
        knowledgeBaseId: 'kb-1',
        name: 'Doc technique',
        type: KBSourceType.TEXT,
        status: KBSourceStatus.PENDING,
      };
      mockKnowledgeSourceCreate.mockResolvedValue(createdSource);
      mockKnowledgeBaseUpdate.mockResolvedValue({});
      mockQueues.addKnowledgeIndexingJob.mockResolvedValue(undefined);

      const result = await service.addSource(mockUser, 'kb-1', dto);

      expect(result).toEqual(createdSource);
      expect(mockKnowledgeSourceCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          knowledgeBaseId: 'kb-1',
          name: 'Doc technique',
          type: KBSourceType.TEXT,
          textContent: 'Contenu du document',
          status: KBSourceStatus.PENDING,
        }),
      });
      expect(mockQueues.addKnowledgeIndexingJob).toHaveBeenCalledWith(
        JOB_TYPES.KNOWLEDGE_INDEXING.INDEX_DOCUMENT,
        { sourceId: 'src-1', knowledgeBaseId: 'kb-1' },
      );
    });
  });

  describe('processSource', () => {
    const source = {
      id: 'src-1',
      type: KBSourceType.TEXT,
      textContent: 'Contenu texte',
      deletedAt: null,
      knowledgeBase: {
        id: 'kb-1',
        chunkingStrategy: 'semantic',
        chunkSize: 512,
        chunkOverlap: 50,
        embeddingModel: 'text-embedding-3-small',
      },
    };

    it('should update status to PROCESSING, parse, chunk, embed, store chunks, update to READY', async () => {
      mockKnowledgeSourceFindUnique.mockResolvedValue(source);
      mockKnowledgeSourceUpdate.mockResolvedValue({});
      mockDocumentParser.parseText.mockResolvedValue({
        title: 'Document',
        content: 'Contenu texte',
      });
      mockChunking.chunkText.mockReturnValue([
        { content: 'Chunk 1', position: 0, tokenCount: 10 },
        { content: 'Chunk 2', position: 1, tokenCount: 8 },
      ]);
      mockLlm.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockKnowledgeDocumentCreate.mockResolvedValue({
        id: 'doc-1',
        sourceId: 'src-1',
        title: 'Document',
        content: 'Contenu texte',
      });
      mockKnowledgeChunkCreate
        .mockResolvedValueOnce({ id: 'chunk-1' })
        .mockResolvedValueOnce({ id: 'chunk-2' });
      mockVector.upsert.mockResolvedValue(undefined);
      mockKnowledgeChunkFindMany.mockResolvedValue([]);
      mockKnowledgeDocumentFindMany.mockResolvedValue([]);
      mockKnowledgeChunkDeleteMany.mockResolvedValue({ count: 0 });
      mockKnowledgeDocumentDeleteMany.mockResolvedValue({ count: 0 });
      mockKnowledgeDocumentCount.mockResolvedValue(1);
      mockKnowledgeChunkAggregate.mockResolvedValue({ _sum: { tokenCount: 18 } });
      mockKnowledgeChunkCount.mockResolvedValue(2);

      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          knowledgeDocument: {
            findMany: mockKnowledgeDocumentFindMany,
            deleteMany: mockKnowledgeDocumentDeleteMany,
          },
          knowledgeChunk: {
            findMany: mockKnowledgeChunkFindMany,
            deleteMany: mockKnowledgeChunkDeleteMany,
          },
        };
        return fn(tx);
      });

      await service.processSource('src-1');

      expect(mockKnowledgeSourceUpdate).toHaveBeenCalledWith({
        where: { id: 'src-1' },
        data: expect.objectContaining({
          status: KBSourceStatus.PROCESSING,
          errorMessage: null,
        }),
      });
      expect(mockDocumentParser.parseText).toHaveBeenCalledWith('Contenu texte');
      expect(mockChunking.chunkText).toHaveBeenCalledWith('Contenu texte', {
        strategy: 'semantic',
        chunkSize: 512,
        chunkOverlap: 50,
      });
      expect(mockLlm.generateEmbedding).toHaveBeenCalledTimes(2);
      expect(mockVector.upsert).toHaveBeenCalled();
      expect(mockKnowledgeSourceUpdate).toHaveBeenLastCalledWith({
        where: { id: 'src-1' },
        data: expect.objectContaining({
          status: KBSourceStatus.READY,
          chunksCount: 2,
          processingProgress: 100,
        }),
      });
    });

    it('should handle parsing error and set status to ERROR with message', async () => {
      mockKnowledgeSourceFindUnique.mockResolvedValue(source);
      mockKnowledgeSourceUpdate.mockResolvedValue({});
      mockDocumentParser.parseText.mockRejectedValue(new Error('Parse failed'));

      await expect(service.processSource('src-1')).rejects.toThrow('Parse failed');

      expect(mockKnowledgeSourceUpdate).toHaveBeenCalledWith({
        where: { id: 'src-1' },
        data: expect.objectContaining({
          status: KBSourceStatus.ERROR,
          errorMessage: 'Parse failed',
          errorCount: { increment: 1 },
        }),
      });
    });

    it('should throw NotFoundException when source not found', async () => {
      mockKnowledgeSourceFindUnique.mockResolvedValue(null);

      await expect(service.processSource('invalid')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.processSource('invalid')).rejects.toThrow(
        'Source introuvable',
      );
    });
  });

  describe('uploadSource', () => {
    const base = {
      id: 'kb-1',
      organizationId: 'org-1',
      deletedAt: null,
    };

    beforeEach(() => {
      mockKnowledgeBaseFindUnique.mockResolvedValue(base);
    });

    it('should accept PDF, TXT, MD, CSV, DOCX file types', async () => {
      const validMimeTypes = [
        'application/pdf',
        'text/plain',
        'text/markdown',
        'text/csv',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      mockStorage.uploadFile.mockResolvedValue('https://storage/file.pdf');
      mockKnowledgeSourceCreate.mockResolvedValue({
        id: 'src-1',
        knowledgeBaseId: 'kb-1',
        name: 'doc.pdf',
        type: KBSourceType.FILE,
        status: KBSourceStatus.PENDING,
      });
      mockKnowledgeBaseUpdate.mockResolvedValue({});
      mockQueues.addKnowledgeIndexingJob.mockResolvedValue(undefined);

      for (const mimetype of validMimeTypes) {
        jest.clearAllMocks();
        mockKnowledgeBaseFindUnique.mockResolvedValue(base);
        const result = await service.uploadSource(mockUser, 'kb-1', {
          buffer: Buffer.from('content'),
          mimetype,
          size: 1000,
          originalname: 'doc',
        });
        expect(result).toBeDefined();
        expect(result.type).toBe(KBSourceType.FILE);
      }
    });

    it('should reject invalid file types', async () => {
      await expect(
        service.uploadSource(mockUser, 'kb-1', {
          buffer: Buffer.from('content'),
          mimetype: 'application/octet-stream',
          size: 1000,
          originalname: 'file.bin',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.uploadSource(mockUser, 'kb-1', {
          buffer: Buffer.from('content'),
          mimetype: 'image/png',
          size: 1000,
          originalname: 'image.png',
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.uploadSource(mockUser, 'kb-1', {
          buffer: Buffer.from('content'),
          mimetype: 'image/png',
          size: 1000,
        }),
      ).rejects.toThrow('Type de fichier non supporté');
    });
  });

  describe('deleteSource', () => {
    it('should soft delete source', async () => {
      const source = {
        id: 'src-1',
        knowledgeBaseId: 'kb-1',
        deletedAt: null,
        knowledgeBase: { organizationId: 'org-1' },
      };
      mockKnowledgeSourceFindUnique.mockResolvedValue(source);
      mockKnowledgeSourceUpdate.mockResolvedValue({});
      mockKnowledgeBaseUpdate.mockResolvedValue({});

      const result = await service.deleteSource(mockUser, 'src-1');

      expect(result).toEqual({ success: true });
      expect(mockKnowledgeSourceUpdate).toHaveBeenCalledWith({
        where: { id: 'src-1' },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      });
      expect(mockKnowledgeBaseUpdate).toHaveBeenCalledWith({
        where: { id: 'kb-1' },
        data: { sourcesCount: { decrement: 1 } },
      });
    });

    it('should throw NotFoundException when source not found', async () => {
      mockKnowledgeSourceFindUnique.mockResolvedValue(null);

      await expect(service.deleteSource(mockUser, 'invalid')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteSource(mockUser, 'invalid')).rejects.toThrow(
        'Source introuvable',
      );
    });
  });

  describe('reindexSource', () => {
    it('should re-enqueue indexing job', async () => {
      const source = {
        id: 'src-1',
        knowledgeBaseId: 'kb-1',
        deletedAt: null,
        knowledgeBase: { organizationId: 'org-1' },
      };
      mockKnowledgeSourceFindUnique.mockResolvedValue(source);
      mockKnowledgeSourceUpdate.mockResolvedValue({});
      mockQueues.addKnowledgeIndexingJob.mockResolvedValue(undefined);

      const result = await service.reindexSource(mockUser, 'src-1');

      expect(result).toEqual({ success: true, message: 'Réindexation déclenchée' });
      expect(mockKnowledgeSourceUpdate).toHaveBeenCalledWith({
        where: { id: 'src-1' },
        data: {
          status: KBSourceStatus.PENDING,
          errorMessage: null,
          errorCount: 0,
        },
      });
      expect(mockQueues.addKnowledgeIndexingJob).toHaveBeenCalledWith(
        JOB_TYPES.KNOWLEDGE_INDEXING.INDEX_DOCUMENT,
        { sourceId: 'src-1', knowledgeBaseId: 'kb-1' },
      );
    });

    it('should throw NotFoundException when source not found', async () => {
      mockKnowledgeSourceFindUnique.mockResolvedValue(null);

      await expect(service.reindexSource(mockUser, 'invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
