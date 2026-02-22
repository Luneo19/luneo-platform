// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import * as sharp from 'sharp';
import * as _crypto from 'crypto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

const DEDUP_LIMIT = 100;
const HAMMING_THRESHOLD = 0.9; // 90% same bits = duplicate

/**
 * Hamming distance between two same-length strings (bit strings).
 */
function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Math.max(a.length, b.length);
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) d++;
  }
  return d;
}

/**
 * Similarity in [0, 1]: 1 = identical.
 */
function similarityFromHamming(hashA: string, hashB: string): number {
  const len = Math.max(hashA.length, hashB.length, 1);
  const dist = hammingDistance(hashA, hashB);
  return 1 - dist / len;
}

@Injectable()
export class ImageDeduplicationService {
  private readonly logger = new Logger(ImageDeduplicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Download image, resize to 8x8 grayscale, compute average hash (pHash-like).
   */
  async generateHash(imageUrl: string): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        maxRedirects: 3,
      }),
    );
    const buffer = Buffer.from(response.data);

    const raw = await sharp(buffer)
      .resize(8, 8)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: false });

    const pixels = new Uint8Array(raw);
    let sum = 0;
    for (let i = 0; i < pixels.length; i++) {
      sum += pixels[i];
    }
    const avg = sum / pixels.length;
    let bits = '';
    for (let i = 0; i < pixels.length; i++) {
      bits += pixels[i] >= avg ? '1' : '0';
    }
    return bits;
  }

  /**
   * Check if this hash duplicates an existing generation for the user.
   * Compares against recent AIGeneration resultUrls for this user.
   */
  async findDuplicate(
    hash: string,
    userId: string,
  ): Promise<{
    isDuplicate: boolean;
    matchUrl?: string;
    similarity: number;
  }> {
    const generations = await this.prisma.aIGeneration.findMany({
      where: {
        userId,
        resultUrl: { not: null },
        deletedAt: null,
      },
      select: { resultUrl: true },
      orderBy: { createdAt: 'desc' },
      take: DEDUP_LIMIT,
    });

    let bestSimilarity = 0;
    let matchUrl: string | undefined;

    for (const g of generations) {
      const url = g.resultUrl;
      if (!url) continue;
      try {
        const otherHash = await this.generateHash(url);
        const sim = similarityFromHamming(hash, otherHash);
        if (sim > bestSimilarity) {
          bestSimilarity = sim;
          matchUrl = url;
        }
      } catch (err) {
        this.logger.debug(
          `Could not hash image for dedup: ${url?.substring(0, 50)}`,
          { err: err instanceof Error ? err.message : err },
        );
      }
    }

    return {
      isDuplicate: bestSimilarity >= HAMMING_THRESHOLD,
      matchUrl: bestSimilarity >= HAMMING_THRESHOLD ? matchUrl : undefined,
      similarity: bestSimilarity,
    };
  }
}
