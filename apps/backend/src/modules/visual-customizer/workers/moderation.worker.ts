import { Processor, Process, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CUSTOMIZER_QUEUES } from '../visual-customizer.constants';

interface ModerationJobData {
  designId: string | null;
  canvasData: {
    objects?: Array<{
      type: string;
      text?: string;
      [key: string]: unknown;
    }>;
  };
  brandId: string;
  userId: string | null;
}

// Basic profanity word list (in production, use a proper library)
const PROFANITY_WORDS: string[] = [
  // Add common profanity words here
  // This is a basic implementation - consider using a library like bad-words
];

@Processor(CUSTOMIZER_QUEUES.MODERATION)
export class ModerationWorker {
  private readonly logger = new Logger(ModerationWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process()
  async process(job: Job<ModerationJobData>) {
    const { designId, canvasData, brandId, userId } = job.data;
    this.logger.log(`Processing moderation job ${job.id} for design ${designId || 'new'}`);

    try {
      // Get brand's customizer settings for blocked words
      const customizer = await this.prisma.visualCustomizer.findFirst({
        where: { brandId },
        select: {
          blockedWords: true,
          profanityFilter: true,
          moderationEnabled: true,
        },
      });

      if (!customizer?.moderationEnabled) {
        this.logger.log(`Moderation disabled for brand ${brandId}, skipping`);
        return { skipped: true, reason: 'moderation_disabled' };
      }

      // Extract text content from canvas data
      const textContent = this.extractTextContent(canvasData);
      const reasons: string[] = [];
      let confidence = 0;

      // Check for blocked words
      if (customizer.blockedWords && customizer.blockedWords.length > 0) {
        const blockedCheck = this.checkBlockedWords(textContent, customizer.blockedWords);
        if (blockedCheck.isBlocked) {
          reasons.push('blocked_words');
          confidence = Math.max(confidence, 0.8);
          this.logger.warn(`Blocked words detected: ${blockedCheck.foundWords.join(', ')}`);
        }
      }

      // Check for profanity if enabled
      if (customizer.profanityFilter) {
        const profanityCheck = this.checkProfanity(textContent);
        if (profanityCheck.isBlocked) {
          reasons.push('profanity');
          confidence = Math.max(confidence, 0.9);
          this.logger.warn(`Profanity detected in text content`);
        }
      }

      // If flagged, create moderation record
      if (reasons.length > 0) {
        const moderationRecord = await this.prisma.customizerModerationRecord.create({
          data: {
            brandId,
            designId,
            contentType: 'design',
            flaggedContent: canvasData as unknown as Prisma.InputJsonValue,
            detectionMethod: 'automated',
            reasons,
            confidence,
            status: 'PENDING',
            contentUserId: userId || undefined,
          },
        });

        this.logger.warn(`Moderation record created: ${moderationRecord.id} for design ${designId || 'new'}`);

        // Update design moderation status if designId exists
        if (designId) {
          await this.prisma.customizerSavedDesign.update({
            where: { id: designId },
            data: {
              moderationStatus: 'PENDING',
              moderationReasons: reasons,
            },
          }).catch((error) => {
            this.logger.warn(`Failed to update design moderation status: ${error}`);
          });
        }

        return {
          flagged: true,
          recordId: moderationRecord.id,
          reasons,
          confidence,
        };
      }

      // If not flagged and designId exists, ensure status is APPROVED
      if (designId) {
        await this.prisma.customizerSavedDesign.update({
          where: { id: designId },
          data: {
            moderationStatus: 'APPROVED',
            moderationReasons: [],
          },
        }).catch((error) => {
          this.logger.warn(`Failed to update design moderation status: ${error}`);
        });
      }

      this.logger.log(`Moderation check passed for design ${designId || 'new'}`);
      return { flagged: false };
    } catch (error) {
      this.logger.error(`Moderation job ${job.id} failed: ${error}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Moderation job ${job.id} completed`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Moderation job ${job.id} failed: ${error.message}`, error.stack);
  }

  private extractTextContent(canvasData: ModerationJobData['canvasData']): string {
    const texts: string[] = [];
    const objects = canvasData.objects || [];

    for (const obj of objects) {
      if (obj.type === 'text' && obj.text && typeof obj.text === 'string') {
        texts.push(obj.text);
      }
    }

    return texts.join(' ');
  }

  private checkBlockedWords(
    text: string,
    blockedWords: string[],
  ): { isBlocked: boolean; foundWords: string[] } {
    if (!text || !blockedWords || blockedWords.length === 0) {
      return { isBlocked: false, foundWords: [] };
    }

    const lowerText = text.toLowerCase();
    const foundWords = blockedWords.filter((word) =>
      lowerText.includes(word.toLowerCase()),
    );

    return {
      isBlocked: foundWords.length > 0,
      foundWords,
    };
  }

  private checkProfanity(text: string): { isBlocked: boolean } {
    if (!text || PROFANITY_WORDS.length === 0) {
      return { isBlocked: false };
    }

    const lowerText = text.toLowerCase();
    const found = PROFANITY_WORDS.some((word) =>
      lowerText.includes(word.toLowerCase()),
    );

    return { isBlocked: found };
  }
}
