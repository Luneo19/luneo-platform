import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

// Future: Integrate Azure Content Safety or AWS Rekognition for advanced moderation.
// When scale requires it (>10k images/day), connect via:
// const CONTENT_MODERATION_API_URL = process.env.CONTENT_MODERATION_API_URL;

export type ModerationAction = 'auto_approve' | 'manual_review' | 'auto_reject';

export interface ModerationResult {
  approved: boolean;
  score: number; // 0-100, higher = more risky
  flags: string[];
  action: ModerationAction;
  reason?: string;
}

export interface ImageModerationMetadata {
  width: number;
  height: number;
  size: number;
  mimeType: string;
}

export interface ModerationRequest {
  type: 'text' | 'image' | 'ai_generation';
  content: string; // Text or image URL
  context?: {
    userId?: string;
    brandId?: string;
    designId?: string;
    imageMetadata?: ImageModerationMetadata;
  };
}

/** Default max text length (chars). */
const MAX_TEXT_LENGTH = 10_000;

/** Image: max dimension (width or height). */
const MAX_IMAGE_DIMENSION = 10_000;

/** Image: max file size in bytes (50MB). */
const MAX_IMAGE_SIZE_BYTES = 50 * 1024 * 1024;

/** Allowed image MIME types. */
const VALID_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

/** Score thresholds for actions. */
const SCORE_AUTO_REJECT = 70;
const SCORE_MANUAL_REVIEW = 30;

@Injectable()
export class ContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name);

  /** Regex-based profanity patterns (common offensive terms). Kept minimal; extend as needed. */
  private readonly profanityPatterns: RegExp[] = [
    /\b(shit|fuck|fucking|asshole|bitch|bastard)\b/gi,
    /\b(n[i1]gg[ae]r|n[i1]gger)\b/gi,
    /\b(cunt|dickhead|whore|slut)\b/gi,
    /\b(kill\s+yourself|kys)\b/gi,
    /\b(hate\s+(you|them|jews|gays|blacks))\b/gi,
  ];

  /** Spam: URL-like pattern. */
  private readonly urlPattern = /https?:\/\/[^\s]+/gi;

  /** Spam: excessive repeated characters (e.g. "aaaaaaa", "!!!!!!!"). */
  private readonly repeatedCharPattern = /(.)\1{4,}/g;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Modère du contenu (text, image, or AI generation).
   * Creates a moderation entry in the DB for admin review when flagged.
   */
  async moderate(request: ModerationRequest): Promise<ModerationResult> {
    this.logger.log(`Moderating ${request.type} content`);

    try {
      let result: ModerationResult;

      switch (request.type) {
        case 'text':
          result = await this.moderateText(request.content, request.context);
          break;
        case 'image':
          result = await this.moderateImage(request.content, request.context);
          break;
        case 'ai_generation':
          result = await this.moderateAIGeneration(request.content, request.context);
          break;
        default:
          throw new BadRequestException(`Unsupported moderation type: ${request.type}`);
      }

      await this.saveModerationResult(request, result);
      return result;
    } catch (error) {
      this.logger.error(`Moderation failed:`, error);
      const fallback: ModerationResult = {
        approved: false,
        score: 100,
        flags: ['error'],
        action: 'auto_reject',
        reason: error instanceof Error ? error.message : 'Moderation failed',
      };
      await this.saveModerationResult(request, fallback).catch(() => {});
      return fallback;
    }
  }

  /**
   * Text moderation: profanity, hate speech patterns, spam (URLs, repeated chars), length.
   */
  async moderateText(
    content: string,
    context?: ModerationRequest['context'],
  ): Promise<ModerationResult> {
    const flags: string[] = [];
    let score = 0;

    if (this.containsProfanity(content)) {
      flags.push('profanity');
      score += 40;
    }

    if (this.isSpammy(content)) {
      flags.push('spam');
      score += 30;
    }

    if (content.length > MAX_TEXT_LENGTH) {
      flags.push('too_long');
      score += 10;
    }

    // Brand blacklist (optional)
    if (context?.brandId) {
      const brand = await this.prisma.brand.findUnique({
        where: { id: context.brandId },
        select: { settings: true },
      });
      const blacklist = (brand?.settings as { blacklist?: string[] } | null)?.blacklist ?? [];
      const hasBlacklisted = blacklist.some((word: string) =>
        content.toLowerCase().includes(word.toLowerCase()),
      );
      if (hasBlacklisted) {
        flags.push('blacklist');
        score += 70; // Auto-reject: brand policy violation
      }
    }

    score = Math.min(100, score);
    const action = this.scoreToAction(score);
    return {
      approved: action === 'auto_approve',
      score,
      flags,
      action,
      reason: flags.length ? `Flagged: ${flags.join(', ')}` : undefined,
    };
  }

  /**
   * Image moderation: dimensions, file size, MIME type.
   * Optionally use existing AI service to analyze image content when available.
   */
  async moderateImage(
    imageUrl: string,
    context?: ModerationRequest['context'],
  ): Promise<ModerationResult> {
    const flags: string[] = [];
    let score = 0;

    const metadata = context?.imageMetadata;
    if (metadata) {
      if (
        metadata.width > MAX_IMAGE_DIMENSION ||
        metadata.height > MAX_IMAGE_DIMENSION
      ) {
        flags.push('oversized');
        score += 20;
      }
      if (metadata.size > MAX_IMAGE_SIZE_BYTES) {
        flags.push('file_too_large');
        score += 30;
      }
      if (!VALID_IMAGE_MIME_TYPES.includes(metadata.mimeType)) {
        flags.push('invalid_type');
        score += 70; // Auto-reject: invalid file type
      }
    }
    // When no metadata is provided, we only perform basic checks (e.g. URL format).
    // Future: Integrate Azure Content Safety or AWS Rekognition for advanced moderation.
    // Optional: use existing AI/Vision service here to analyze image content when available.

    score = Math.min(100, score);
    const action = this.scoreToAction(score);
    return {
      approved: action === 'auto_approve',
      score,
      flags,
      action,
      reason: flags.length ? `Flagged: ${flags.join(', ')}` : undefined,
    };
  }

  /**
   * AI generation: same as image moderation (generated image URL + optional metadata).
   */
  private async moderateAIGeneration(
    imageUrl: string,
    context?: ModerationRequest['context'],
  ): Promise<ModerationResult> {
    return this.moderateImage(imageUrl, context);
  }

  private containsProfanity(text: string): boolean {
    const normalized = text.toLowerCase();
    return this.profanityPatterns.some((re) => {
      re.lastIndex = 0;
      return re.test(normalized);
    });
  }

  private isSpammy(text: string): boolean {
    const urlMatches = text.match(this.urlPattern);
    if (urlMatches && urlMatches.length >= 3) {
      return true; // Multiple URLs
    }
    const repeated = text.match(this.repeatedCharPattern);
    if (repeated && repeated.length >= 2) {
      return true; // Multiple long repeated sequences
    }
    return false;
  }

  private scoreToAction(score: number): ModerationAction {
    if (score >= SCORE_AUTO_REJECT) return 'auto_reject';
    if (score >= SCORE_MANUAL_REVIEW) return 'manual_review';
    return 'auto_approve';
  }

  private actionToDbAction(action: ModerationAction): 'allow' | 'review' | 'block' {
    switch (action) {
      case 'auto_approve':
        return 'allow';
      case 'manual_review':
        return 'review';
      case 'auto_reject':
        return 'block';
    }
  }

  /**
   * Saves moderation result to DB (moderation queue). Auto-approved and auto-rejected
   * are still recorded; manual_review entries are the ones admins need to review.
   */
  private async saveModerationResult(
    request: ModerationRequest,
    result: ModerationResult,
  ): Promise<void> {
    const { type, content, context } = request;
    await this.prisma.moderationRecord.create({
      data: {
        type,
        content,
        userId: context?.userId ?? undefined,
        brandId: context?.brandId ?? undefined,
        designId: context?.designId ?? undefined,
        context: (context ?? undefined) as object | undefined,
        approved: result.approved,
        confidence: result.score / 100,
        categories: result.flags,
        reason: result.reason ?? undefined,
        action: this.actionToDbAction(result.action),
      },
    });
    if (result.action !== 'auto_approve') {
      this.logger.warn(`Content moderation flagged:`, {
        type: request.type,
        action: result.action,
        flags: result.flags,
        score: result.score,
        context: request.context,
      });
    }
  }

  /**
   * Returns moderation history. Use action=review to list items queued for manual review.
   */
  async getModerationHistory(
    userId?: string,
    brandId?: string,
    limit: number = 100,
    type?: 'text' | 'image' | 'ai_generation',
    approved?: boolean,
    action?: 'allow' | 'review' | 'block',
  ): Promise<any[]> {
    return this.prisma.moderationRecord.findMany({
      where: {
        ...(userId && { userId }),
        ...(brandId && { brandId }),
        ...(type && { type }),
        ...(approved !== undefined && { approved }),
        ...(action && { action }),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit || 50, 500),
    });
  }
}
