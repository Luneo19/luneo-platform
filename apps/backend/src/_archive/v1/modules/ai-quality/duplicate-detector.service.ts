// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import sharp from 'sharp';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  similarity: number;
  existingUrl?: string;
}

const AVERAGE_HASH_SIZE = 8;
const MAX_RECENT_GENERATIONS = 100;
const DUPLICATE_THRESHOLD = 0.9; // 90% similarity = duplicate

@Injectable()
export class DuplicateDetectorService {
  private readonly logger = new Logger(DuplicateDetectorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a perceptual (average) hash for an image and compares against
   * existing generations for the user. Uses simple average hash: resize to 8x8,
   * grayscale, compare each pixel to mean.
   */
  async checkDuplicate(
    imageUrl: string,
    userId: string,
  ): Promise<DuplicateCheckResult> {
    try {
      const newHash = await this.computeAverageHash(imageUrl);
      if (!newHash) {
        return { isDuplicate: false, similarity: 0 };
      }

      const recent = await this.prisma.aIGeneration.findMany({
        where: { userId, deletedAt: null, resultUrl: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: MAX_RECENT_GENERATIONS,
        select: { resultUrl: true },
      });

      const urls = recent
        .map((r) => r.resultUrl)
        .filter((u): u is string => !!u);

      for (const existingUrl of urls) {
        if (existingUrl === imageUrl) continue;
        const existingHash = await this.computeAverageHash(existingUrl);
        if (!existingHash) continue;
        const similarity = this.hashSimilarity(newHash, existingHash);
        if (similarity >= DUPLICATE_THRESHOLD) {
          this.logger.debug('Duplicate image detected', {
            userId,
            similarity,
            existingUrl: existingUrl.substring(0, 60),
          });
          return { isDuplicate: true, similarity, existingUrl };
        }
      }

      return { isDuplicate: false, similarity: 0 };
    } catch (error) {
      this.logger.warn('Duplicate check failed', {
        userId,
        imageUrl: imageUrl.substring(0, 50),
        error: error instanceof Error ? error.message : error,
      });
      return { isDuplicate: false, similarity: 0 };
    }
  }

  /**
   * Average hash: resize to 8x8, grayscale, then each pixel > mean ? 1 : 0.
   * Returns 64-character binary string.
   */
  async computeAverageHash(imageUrl: string): Promise<string | null> {
    try {
      const buffer = await this.fetchImageBuffer(imageUrl);
      if (!buffer || buffer.length === 0) return null;

      const raw = await sharp(buffer)
        .resize(AVERAGE_HASH_SIZE, AVERAGE_HASH_SIZE, { fit: 'fill' })
        .grayscale()
        .raw()
        .toBuffer();

      const pixels = new Uint8Array(raw);
      let sum = 0;
      for (let i = 0; i < pixels.length; i++) sum += pixels[i];
      const mean = sum / pixels.length;

      let hash = '';
      for (let i = 0; i < pixels.length; i++) {
        hash += pixels[i] >= mean ? '1' : '0';
      }
      return hash;
    } catch {
      return null;
    }
  }

  private hashSimilarity(hashA: string, hashB: string): number {
    if (hashA.length !== hashB.length) return 0;
    let same = 0;
    for (let i = 0; i < hashA.length; i++) {
      if (hashA[i] === hashB[i]) same++;
    }
    return same / hashA.length;
  }

  private async fetchImageBuffer(url: string): Promise<Buffer | null> {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  }
}
