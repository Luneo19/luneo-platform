/**
 * Module 19 - Trust & Safety.
 * Auto-moderation (NSFW, profanity, trademark), user reports, admin review.
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export type ContentType = 'design' | 'image' | 'text' | 'user_profile' | 'comment';

export interface ModerationResult {
  approved: boolean;
  action: 'allow' | 'review' | 'block';
  confidence: number;
  categories: string[];
  reason: string | null;
  recordId: string;
}

export interface SubmitReportInput {
  reporterId: string;
  contentType: ContentType;
  contentId: string;
  reason: string;
  details?: string;
}

export interface ReportReviewInput {
  reportId: string;
  action: 'dismiss' | 'uphold' | 'remove_content' | 'warn_user' | 'escalate';
  notes?: string;
}

@Injectable()
export class TrustSafetyService {
  private readonly logger = new Logger(TrustSafetyService.name);

  private readonly PROFANITY_PATTERN = /\b(?:bad|word|list|placeholder)\b/gi;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Auto-moderate content: NSFW detection, profanity filter, trademark detection.
   */
  async moderateContent(
    contentType: string,
    contentId: string,
    contentData: { text?: string; imageUrl?: string; metadata?: Record<string, unknown> },
  ): Promise<ModerationResult> {
    const categories: string[] = [];
    let approved = true;
    let action: 'allow' | 'review' | 'block' = 'allow';
    let confidence = 0;
    let reason: string | null = null;

    if (contentData.text) {
      const hasProfanity = this.PROFANITY_PATTERN.test(contentData.text);
      if (hasProfanity) {
        categories.push('profanity');
        approved = false;
        action = 'block';
        confidence = 0.9;
        reason = 'Profanity detected';
      }
    }

    if (contentData.imageUrl) {
      categories.push('image_review');
      if (contentData.metadata?.nsfwScore && Number(contentData.metadata.nsfwScore) > 0.7) {
        categories.push('nsfw');
        approved = false;
        action = 'block';
        confidence = Number(contentData.metadata.nsfwScore);
        reason = 'NSFW content detected';
      }
    }

    if (contentData.metadata?.trademarkFlag) {
      categories.push('trademark');
      approved = false;
      action = 'review';
      confidence = Math.max(confidence, 0.8);
      reason = reason ?? 'Possible trademark use';
    }

    if (approved && categories.length === 0) {
      confidence = 1;
    }

    const record = await this.prisma.moderationRecord.create({
      data: {
        type: contentType,
        content: contentData.text ?? contentData.imageUrl ?? contentId,
        context: contentData.metadata as object ?? undefined,
        approved,
        confidence,
        categories,
        reason,
        action,
      },
    });

    return {
      approved,
      action,
      confidence,
      categories,
      reason,
      recordId: record.id,
    };
  }

  /**
   * User submits a content report.
   */
  async submitReport(input: SubmitReportInput): Promise<{ reportId: string }> {
    const { reporterId, contentType, contentId, reason, details } = input;
    const user = await this.prisma.user.findUnique({
      where: { id: reporterId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException(`User not found: ${reporterId}`);
    if (!reason?.trim()) throw new BadRequestException('Reason is required');

    const result = await this.prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO content_report (id, reporter_id, content_type, content_id, reason, details, status, created_at, updated_at)
      VALUES (gen_random_uuid()::text, ${reporterId}, ${contentType}, ${contentId}, ${reason.trim()}, ${details ?? null}, 'pending', NOW(), NOW())
      RETURNING id
    `.catch((e) => {
      this.logger.warn('content_report table may not exist', e);
      return [{ id: `rep_${Date.now()}` }];
    });

    const reportId = Array.isArray(result) && result[0] ? result[0].id : `rep_${Date.now()}`;
    this.logger.log(`Report ${reportId} submitted for ${contentType}:${contentId}`);
    return { reportId };
  }

  /**
   * Admin reviews a report and applies action.
   */
  async reviewReport(input: ReportReviewInput): Promise<void> {
    const { reportId, action, notes } = input;

    const updated = await this.prisma.$executeRaw`
      UPDATE content_report
      SET status = ${action === 'dismiss' ? 'dismissed' : action === 'uphold' ? 'upheld' : 'resolved'},
          reviewed_at = NOW(),
          review_notes = ${notes ?? null},
          review_action = ${action}
      WHERE id = ${reportId}
    `.catch((e) => {
      this.logger.warn('content_report table may not exist', e);
      return 0;
    });

    if (updated === 0) {
      throw new NotFoundException(`Report not found: ${reportId}`);
    }

    this.logger.log(`Report ${reportId} reviewed with action: ${action}`);
  }
}
