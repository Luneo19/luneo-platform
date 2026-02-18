import { Injectable, Logger } from '@nestjs/common';

export interface TextChunk {
  content: string;
  index: number;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class TextSplitterService {
  private readonly logger = new Logger(TextSplitterService.name);
  private readonly DEFAULT_CHUNK_SIZE = 1000;
  private readonly DEFAULT_CHUNK_OVERLAP = 200;

  split(
    text: string,
    options?: {
      chunkSize?: number;
      chunkOverlap?: number;
      separators?: string[];
    },
  ): TextChunk[] {
    const chunkSize = options?.chunkSize || this.DEFAULT_CHUNK_SIZE;
    const overlap = options?.chunkOverlap || this.DEFAULT_CHUNK_OVERLAP;
    const separators = options?.separators || ['\n\n', '\n', '. ', ' ', ''];

    const chunks = this.recursiveSplit(text, separators, chunkSize, overlap);

    return chunks.map((content, index) => ({
      content: content.trim(),
      index,
    })).filter((c) => c.content.length > 0);
  }

  private recursiveSplit(
    text: string,
    separators: string[],
    chunkSize: number,
    overlap: number,
  ): string[] {
    if (text.length <= chunkSize) return [text];

    const separator = separators[0];
    const remainingSeparators = separators.slice(1);

    let splits: string[];
    if (separator === '') {
      splits = text.match(new RegExp(`.{1,${chunkSize}}`, 'g')) || [text];
    } else {
      splits = text.split(separator);
    }

    const chunks: string[] = [];
    let currentChunk = '';

    for (const split of splits) {
      const candidate = currentChunk
        ? currentChunk + separator + split
        : split;

      if (candidate.length <= chunkSize) {
        currentChunk = candidate;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }

        if (split.length > chunkSize && remainingSeparators.length > 0) {
          const subChunks = this.recursiveSplit(split, remainingSeparators, chunkSize, overlap);
          chunks.push(...subChunks);
          currentChunk = '';
        } else {
          currentChunk = split;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    // Apply overlap
    if (overlap > 0 && chunks.length > 1) {
      return this.applyOverlap(chunks, overlap);
    }

    return chunks;
  }

  private applyOverlap(chunks: string[], overlap: number): string[] {
    const result: string[] = [chunks[0]];

    for (let i = 1; i < chunks.length; i++) {
      const prevChunk = chunks[i - 1];
      const overlapText = prevChunk.slice(-overlap);
      result.push(overlapText + chunks[i]);
    }

    return result;
  }
}
