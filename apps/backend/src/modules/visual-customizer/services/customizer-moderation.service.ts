import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, CustomizerModerationStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import {
  normalizePagination,
  createPaginationResult,
  PaginationParams,
  PaginationResult,
} from '@/libs/prisma/pagination.helper';
import { MODERATION_SETTINGS } from '../visual-customizer.constants';
import { CurrentUser } from '@/common/types/user.types';

interface ModerationQuery {
  status?: string;
  contentType?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface CheckDesignResult {
  isBlocked: boolean;
  reasons: string[];
  confidence?: number;
}

@Injectable()
export class CustomizerModerationService {
  private readonly logger = new Logger(CustomizerModerationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check design content for moderation
   */
  async checkDesign(canvasData: Record<string, unknown>): Promise<CheckDesignResult> {
    const reasons: string[] = [];
    let confidence = 0;

    // Extract text content from canvas data
    const textContent = this.extractTextContent(canvasData);

    // Check for profanity (basic implementation)
    if (MODERATION_SETTINGS.PROFANITY_CHECK) {
      const profanityCheck = this.checkProfanity(textContent);
      if (profanityCheck.hasProfanity) {
        reasons.push('Profanity detected in text content');
        confidence = Math.max(confidence, profanityCheck.confidence || 0.7);
      }
    }

    // Check for NSFW content (placeholder - would use ML model in production)
    // Note: NSFW_DETECTION removed from MODERATION_SETTINGS, using nsfwDetection from customizer settings instead
    // TODO: Implement actual NSFW detection using ML model

    // Check for trademark violations (placeholder)
    if (MODERATION_SETTINGS.TRADEMARK_CHECK) {
      // TODO: Implement trademark checking
    }

    const isBlocked = reasons.length > 0 && confidence >= MODERATION_SETTINGS.NSFW_THRESHOLD;

    return {
      isBlocked,
      reasons,
      confidence: confidence > 0 ? confidence : undefined,
    };
  }

  /**
   * List flagged designs
   */
  async listFlaggedDesigns(
    query: ModerationQuery & PaginationParams,
    user: CurrentUser,
  ): Promise<PaginationResult<unknown>> {
    const { skip, take, page, limit } = normalizePagination(query);

    const where: Prisma.CustomizerModerationRecordWhereInput = {
      brandId: user.brandId!,
      ...(query.status && { status: query.status as CustomizerModerationStatus }),
      ...(query.contentType && { contentType: query.contentType }),
      ...(query.dateFrom && query.dateTo && {
        createdAt: {
          gte: query.dateFrom,
          lte: query.dateTo,
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.customizerModerationRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          reviewedBy: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.customizerModerationRecord.count({ where }),
    ]);

    return createPaginationResult(data, total, { page, limit });
  }

  /**
   * Get moderation record
   */
  async getRecord(id: string, user: CurrentUser) {
    const record = await this.prisma.customizerModerationRecord.findFirst({
      where: {
        id,
        brandId: user.brandId!,
      },
      include: {
        reviewedBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`Moderation record with ID ${id} not found`);
    }

    return record;
  }

  /**
   * Approve moderation record
   */
  async approve(id: string, notes: string, user: CurrentUser) {
    const _record = await this.getRecord(id, user);

    const updated = await this.prisma.customizerModerationRecord.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedById: user.id,
        reviewedAt: new Date(),
        reviewNotes: notes,
        actionTaken: 'APPROVED',
      },
    });

    this.logger.log(`Moderation record approved: ${id} by user ${user.id}`);

    return updated;
  }

  /**
   * Reject moderation record
   */
  async reject(
    id: string,
    body: { reason: string; notifyUser?: boolean },
    user: CurrentUser,
  ) {
    const record = await this.getRecord(id, user);

    const updated = await this.prisma.customizerModerationRecord.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedById: user.id,
        reviewedAt: new Date(),
        reviewNotes: body.reason,
        actionTaken: 'REJECTED',
        userNotified: body.notifyUser ?? false,
      },
    });

    // If design was rejected, mark saved design as rejected
    if (record.designId) {
      await this.prisma.customizerSavedDesign.update({
        where: { id: record.designId },
        data: {
          moderationStatus: 'REJECTED',
          moderationReasons: [body.reason],
        },
      }).catch(() => {
        // Ignore if design doesn't exist
      });
    }

    this.logger.log(`Moderation record rejected: ${id} by user ${user.id}`);

    return updated;
  }

  /**
   * Escalate moderation record
   */
  async escalate(id: string, reason: string, user: CurrentUser) {
    const _record = await this.getRecord(id, user);

    const updated = await this.prisma.customizerModerationRecord.update({
      where: { id },
      data: {
        status: 'ESCALATED',
        reviewedById: user.id,
        reviewedAt: new Date(),
        reviewNotes: reason,
        actionTaken: 'ESCALATED',
      },
    });

    this.logger.log(`Moderation record escalated: ${id} by user ${user.id}`);

    return updated;
  }

  /**
   * Get moderation statistics
   */
  async getStats(dateRange: { from: Date; to: Date }, user: CurrentUser) {
    const where: Prisma.CustomizerModerationRecordWhereInput = {
      brandId: user.brandId!,
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to,
      },
    };

    const [
      total,
      pending,
      approved,
      rejected,
      escalated,
    ] = await Promise.all([
      this.prisma.customizerModerationRecord.count({ where }),
      this.prisma.customizerModerationRecord.count({
        where: { ...where, status: 'PENDING' },
      }),
      this.prisma.customizerModerationRecord.count({
        where: { ...where, status: 'APPROVED' },
      }),
      this.prisma.customizerModerationRecord.count({
        where: { ...where, status: 'REJECTED' },
      }),
      this.prisma.customizerModerationRecord.count({
        where: { ...where, status: 'ESCALATED' },
      }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      escalated,
      approvalRate: total > 0 ? (approved / total) * 100 : 0,
      rejectionRate: total > 0 ? (rejected / total) * 100 : 0,
    };
  }

  /**
   * Update blocked words list
   */
  async updateBlockedWords(
    words: string[],
    action: 'add' | 'remove' | 'replace',
    user: CurrentUser,
  ) {
    // In a real implementation, you would store blocked words in a database table
    // For now, this is a placeholder that logs the action
    this.logger.log(
      `Blocked words ${action} for brand ${user.brandId}: ${words.length} words`,
    );

    // TODO: Implement actual blocked words storage and retrieval
    return {
      success: true,
      action,
      wordsCount: words.length,
    };
  }

  /**
   * Get blocked words list
   */
  async getBlockedWords(_user: CurrentUser): Promise<string[]> {
    // TODO: Retrieve from database
    // For now, return empty array
    return [];
  }

  /**
   * Extract text content from canvas data
   */
  private extractTextContent(canvasData: Record<string, unknown>): string {
    const texts: string[] = [];

    if (Array.isArray(canvasData.objects)) {
      canvasData.objects.forEach((obj: Record<string, unknown>) => {
        if (obj.type === 'text' && obj.text) {
          texts.push(String(obj.text));
        }
        if (obj.children && Array.isArray(obj.children)) {
          (obj.children as Record<string, unknown>[]).forEach((child: Record<string, unknown>) => {
            if (child.type === 'text' && child.text) {
              texts.push(String(child.text));
            }
          });
        }
      });
    }

    return texts.join(' ');
  }

  /**
   * Check for profanity (basic implementation)
   */
  private checkProfanity(text: string): {
    hasProfanity: boolean;
    confidence?: number;
  } {
    // Basic profanity check - in production, use a proper profanity detection library
    const profanityPatterns = [
      /\b(ass|damn|hell)\b/gi,
      // Add more patterns as needed
    ];

    for (const pattern of profanityPatterns) {
      if (pattern.test(text)) {
        return {
          hasProfanity: true,
          confidence: 0.7,
        };
      }
    }

    return { hasProfanity: false };
  }
}
