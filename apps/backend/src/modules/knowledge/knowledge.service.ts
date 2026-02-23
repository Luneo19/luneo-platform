import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { VectorService } from '@/libs/vector/vector.service';
import { LlmService } from '@/libs/llm/llm.service';
import { ChunkingService } from '@/libs/chunking';
import { DocumentParserService } from '@/libs/document-parser';
import { QueuesService, JOB_TYPES } from '@/libs/queues';
import { StorageService } from '@/libs/storage/storage.service';
import { QuotasService } from '@/modules/quotas/quotas.service';
import { KBSourceType, KBSourceStatus, DocProcessingStatus } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { UpdateKnowledgeBaseDto } from './dto/update-knowledge-base.dto';
import { CreateKnowledgeSourceDto } from './dto/create-knowledge-source.dto';

@Injectable()
export class KnowledgeService {
  private readonly logger = new Logger(KnowledgeService.name);

  private static readonly ALLOWED_FILE_TYPES = [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  private static readonly MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  constructor(
    private prisma: PrismaOptimizedService,
    private cache: SmartCacheService,
    private vector: VectorService,
    private llm: LlmService,
    private chunking: ChunkingService,
    private documentParser: DocumentParserService,
    private storage: StorageService,
    private queues: QueuesService,
    private quotasService: QuotasService,
  ) {}

  async listBases(user: CurrentUser) {
    const orgId = user.organizationId;
    if (!orgId) throw new ForbiddenException('Aucune organisation associée');

    return this.prisma.knowledgeBase.findMany({
      where: { organizationId: orgId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { sources: true } } },
    });
  }

  async createBase(user: CurrentUser, dto: CreateKnowledgeBaseDto) {
    const orgId = user.organizationId;
    if (!orgId) throw new ForbiddenException('Aucune organisation associée');

    const base = await this.prisma.knowledgeBase.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        description: dto.description,
        language: dto.language ?? 'fr',
        chunkingStrategy: dto.chunkingStrategy ?? 'semantic',
      },
    });

    this.logger.log(`Knowledge base created: ${base.id} by user ${user.id}`);
    return base;
  }

  async getBase(user: CurrentUser, id: string) {
    const base = await this.prisma.knowledgeBase.findUnique({
      where: { id },
      include: {
        sources: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
        _count: { select: { sources: true } },
      },
    });

    if (!base || base.deletedAt) throw new NotFoundException('Base de connaissances introuvable');
    if (base.organizationId !== user.organizationId) throw new ForbiddenException();

    return base;
  }

  async updateBase(user: CurrentUser, id: string, dto: UpdateKnowledgeBaseDto) {
    const base = await this.getBase(user, id);

    const updated = await this.prisma.knowledgeBase.update({
      where: { id: base.id },
      data: dto,
    });

    await this.cache.invalidate(`kb:${id}:*`, 'knowledge');
    return updated;
  }

  async deleteBase(user: CurrentUser, id: string) {
    const base = await this.getBase(user, id);

    await this.prisma.knowledgeBase.update({
      where: { id: base.id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Knowledge base soft-deleted: ${id}`);
    return { success: true };
  }

  async uploadSource(
    user: CurrentUser,
    baseId: string,
    file: { buffer: Buffer; mimetype: string; size: number; originalname?: string },
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');

    if (!KnowledgeService.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Type de fichier non supporté. Types autorisés: ${KnowledgeService.ALLOWED_FILE_TYPES.join(', ')}`,
      );
    }

    if (file.size > KnowledgeService.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `Taille maximale: ${KnowledgeService.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    const base = await this.getBase(user, baseId);

    if (user.organizationId) {
      await this.quotasService.enforceQuota(user.organizationId, 'documents');
    }

    const orgId = user.organizationId ?? undefined;
    const sanitizedName = (file.originalname || 'document')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 100);
    const key = `knowledge/${base.id}/${Date.now()}-${sanitizedName}`;

    const fileUrl = await this.storage.uploadFile(
      key,
      file.buffer,
      file.mimetype,
      'luneo-assets',
      orgId,
    );

    const source = await this.prisma.knowledgeSource.create({
      data: {
        knowledgeBaseId: base.id,
        name: file.originalname || 'Document uploadé',
        type: KBSourceType.FILE,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: KBSourceStatus.PENDING,
      },
    });

    await this.prisma.knowledgeBase.update({
      where: { id: base.id },
      data: { sourcesCount: { increment: 1 } },
    });

    await this.triggerIndexing(source.id, base.id);

    this.logger.log(`Source uploadée: ${source.id} vers base ${baseId}`);
    return source;
  }

  async addSource(user: CurrentUser, baseId: string, dto: CreateKnowledgeSourceDto) {
    const base = await this.getBase(user, baseId);

    if (user.organizationId) {
      await this.quotasService.enforceQuota(user.organizationId, 'documents');
    }

    this.validateSourcePayload(dto);

    const source = await this.prisma.knowledgeSource.create({
      data: {
        knowledgeBaseId: base.id,
        name: dto.name,
        type: dto.type,
        fileUrl: dto.fileUrl,
        websiteUrl: dto.websiteUrl,
        textContent: dto.textContent,
        status: KBSourceStatus.PENDING,
      },
    });

    await this.prisma.knowledgeBase.update({
      where: { id: base.id },
      data: { sourcesCount: { increment: 1 } },
    });

    await this.triggerIndexing(source.id, base.id);

    this.logger.log(`Source added: ${source.id} to base ${baseId}`);
    return source;
  }

  async listSources(user: CurrentUser, baseId: string) {
    const base = await this.getBase(user, baseId);

    return this.prisma.knowledgeSource.findMany({
      where: { knowledgeBaseId: base.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteSource(user: CurrentUser, sourceId: string) {
    const source = await this.prisma.knowledgeSource.findUnique({
      where: { id: sourceId },
      include: { knowledgeBase: true },
    });

    if (!source || source.deletedAt) throw new NotFoundException('Source introuvable');
    if (source.knowledgeBase.organizationId !== user.organizationId) throw new ForbiddenException();

    await this.prisma.knowledgeSource.update({
      where: { id: sourceId },
      data: { deletedAt: new Date() },
    });

    await this.prisma.knowledgeBase.update({
      where: { id: source.knowledgeBaseId },
      data: { sourcesCount: { decrement: 1 } },
    });

    this.logger.log(`Source soft-deleted: ${sourceId}`);
    return { success: true };
  }

  async reindexSource(user: CurrentUser, sourceId: string) {
    const source = await this.prisma.knowledgeSource.findUnique({
      where: { id: sourceId },
      include: { knowledgeBase: true },
    });

    if (!source || source.deletedAt) throw new NotFoundException('Source introuvable');
    if (source.knowledgeBase.organizationId !== user.organizationId) throw new ForbiddenException();

    await this.prisma.knowledgeSource.update({
      where: { id: sourceId },
      data: { status: KBSourceStatus.PENDING, errorMessage: null, errorCount: 0 },
    });

    await this.triggerIndexing(sourceId, source.knowledgeBaseId);

    this.logger.log(`Reindex triggered for source: ${sourceId}`);
    return { success: true, message: 'Réindexation déclenchée' };
  }

  private async triggerIndexing(sourceId: string, knowledgeBaseId: string) {
    try {
      await this.queues.addKnowledgeIndexingJob(JOB_TYPES.KNOWLEDGE_INDEXING.INDEX_DOCUMENT, {
        sourceId,
        knowledgeBaseId,
      });
    } catch (error: unknown) {
      this.logger.error(`Failed to enqueue indexing job for source ${sourceId}`, error);
    }
  }

  async processSource(sourceId: string): Promise<void> {
    const source = await this.prisma.knowledgeSource.findUnique({
      where: { id: sourceId },
      include: { knowledgeBase: true },
    });

    if (!source || source.deletedAt) {
      throw new NotFoundException('Source introuvable');
    }

    try {
      await this.prisma.knowledgeSource.update({
        where: { id: sourceId },
        data: {
          status: KBSourceStatus.PROCESSING,
          errorMessage: null,
          processingProgress: 0,
        },
      });

      let title: string;
      let content: string;

      if (source.type === KBSourceType.FILE && source.fileUrl && source.mimeType) {
        const parsed = await this.documentParser.parseFile(source.fileUrl, source.mimeType);
        title = parsed.title;
        content = parsed.content;
      } else if (source.type === KBSourceType.WEBSITE) {
        if (source.textContent?.trim()) {
          const parsed = await this.documentParser.parseText(source.textContent);
          title = parsed.title;
          content = parsed.content;
        } else if (source.websiteUrl) {
          const parsed = await this.documentParser.parseWebpage(source.websiteUrl);
          title = parsed.title;
          content = parsed.content;
        } else {
          throw new BadRequestException('websiteUrl ou textContent requis pour une source WEBSITE');
        }
      } else if (source.type === KBSourceType.TEXT && source.textContent) {
        const parsed = await this.documentParser.parseText(source.textContent);
        title = parsed.title;
        content = parsed.content;
      } else {
        throw new BadRequestException(`Type de source non supporté ou données manquantes: ${source.type}`);
      }

      if (!content || !content.trim()) {
        throw new BadRequestException('Aucun contenu extrait de la source');
      }

      const base = source.knowledgeBase;
      const strategy = (base.chunkingStrategy as 'semantic' | 'fixed' | 'sentence') || 'semantic';
      const chunks = this.chunking.chunkText(content, {
        strategy,
        chunkSize: base.chunkSize ?? 512,
        chunkOverlap: base.chunkOverlap ?? 50,
      });

      await this.prisma.$transaction(async (tx) => {
        const existingDocs = await tx.knowledgeDocument.findMany({
          where: { sourceId },
          select: { id: true },
        });
        const existingChunkIds = await tx.knowledgeChunk.findMany({
          where: { documentId: { in: existingDocs.map((d) => d.id) } },
          select: { id: true },
        });

        if (existingChunkIds.length > 0) {
          await this.vector.delete(
            existingChunkIds.map((c) => c.id),
            { namespace: base.id },
          );
        }
        await tx.knowledgeChunk.deleteMany({
          where: { documentId: { in: existingDocs.map((d) => d.id) } },
        });
        await tx.knowledgeDocument.deleteMany({ where: { sourceId } });
      });

      const document = await this.prisma.knowledgeDocument.create({
        data: {
          sourceId,
          title,
          content,
          status: DocProcessingStatus.PROCESSING,
        },
      });

      const vectorRecords: { id: string; values: number[]; metadata?: Record<string, unknown> }[] = [];
      let totalTokens = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await this.llm.generateEmbedding(chunk.content, base.embeddingModel);
        const chunkRecord = await this.prisma.knowledgeChunk.create({
          data: {
            documentId: document.id,
            content: chunk.content,
            position: chunk.position,
            tokenCount: chunk.tokenCount,
          },
        });
        totalTokens += chunk.tokenCount;
        vectorRecords.push({
          id: chunkRecord.id,
          values: embedding,
          metadata: {
            sourceId,
            documentId: document.id,
            knowledgeBaseId: base.id,
            position: chunk.position,
          },
        });
      }

      if (vectorRecords.length > 0) {
        await this.vector.upsert(vectorRecords, { namespace: base.id });
      }

      await this.prisma.knowledgeDocument.update({
        where: { id: document.id },
        data: {
          status: DocProcessingStatus.INDEXED,
          chunksCount: chunks.length,
          tokensCount: totalTokens,
          processedAt: new Date(),
        },
      });

      await this.prisma.knowledgeSource.update({
        where: { id: sourceId },
        data: {
          status: KBSourceStatus.READY,
          documentsCount: 1,
          chunksCount: chunks.length,
          tokensCount: totalTokens,
          processingProgress: 100,
          errorMessage: null,
          lastSyncAt: new Date(),
        },
      });

      const [docCount, chunkCount, tokenSum] = await Promise.all([
        this.prisma.knowledgeDocument.count({
          where: { source: { knowledgeBaseId: base.id } },
        }),
        this.prisma.knowledgeChunk.count({
          where: { document: { source: { knowledgeBaseId: base.id } } },
        }),
        this.prisma.knowledgeChunk.aggregate({
          where: { document: { source: { knowledgeBaseId: base.id } } },
          _sum: { tokenCount: true },
        }),
      ]);
      await this.prisma.knowledgeBase.update({
        where: { id: base.id },
        data: {
          documentsCount: docCount,
          chunksCount: chunkCount,
          totalTokens: tokenSum._sum.tokenCount ?? 0,
        },
      });

      this.logger.log(`Source ${sourceId} indexed: ${chunks.length} chunks, ${totalTokens} tokens`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to process source ${sourceId}: ${msg}`, error instanceof Error ? error.stack : undefined);
      await this.prisma.knowledgeSource.update({
        where: { id: sourceId },
        data: {
          status: KBSourceStatus.ERROR,
          errorMessage: msg.slice(0, 2000),
          errorCount: { increment: 1 },
          lastErrorAt: new Date(),
        },
      });
      throw error;
    }
  }

  private validateSourcePayload(dto: CreateKnowledgeSourceDto) {
    if (dto.type === KBSourceType.FILE && !dto.fileUrl) {
      throw new BadRequestException('fileUrl est requis pour une source de type FILE');
    }
    if (dto.type === KBSourceType.WEBSITE && !dto.websiteUrl) {
      throw new BadRequestException('websiteUrl est requis pour une source de type WEBSITE');
    }
    if (dto.type === KBSourceType.TEXT && !dto.textContent) {
      throw new BadRequestException('textContent est requis pour une source de type TEXT');
    }
  }
}
