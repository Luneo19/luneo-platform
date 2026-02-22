import { Injectable, Logger } from '@nestjs/common';

export type ChunkingStrategy = 'semantic' | 'fixed' | 'sentence';

export interface ChunkingOptions {
  strategy: ChunkingStrategy;
  chunkSize: number;
  chunkOverlap: number;
}

export interface ChunkResult {
  content: string;
  position: number;
  tokenCount: number;
}

/** Approximate chars per token: ~4 for English, ~3 for French */
const CHARS_PER_TOKEN = 3.5;

@Injectable()
export class ChunkingService {
  private readonly logger = new Logger(ChunkingService.name);

  chunkText(text: string, options: ChunkingOptions): ChunkResult[] {
    const normalized = normalizeText(text);
    if (!normalized.trim()) return [];

    switch (options.strategy) {
      case 'fixed':
        return this.fixedChunking(normalized, options.chunkSize, options.chunkOverlap);
      case 'sentence':
        return this.sentenceChunking(normalized, options.chunkSize, options.chunkOverlap);
      case 'semantic':
      default:
        return this.semanticChunking(normalized, options.chunkSize, options.chunkOverlap);
    }
  }

  private fixedChunking(text: string, chunkSize: number, overlap: number): ChunkResult[] {
    const chunks: ChunkResult[] = [];
    const maxChars = Math.floor(chunkSize * CHARS_PER_TOKEN);
    const overlapChars = Math.floor(overlap * CHARS_PER_TOKEN);
    let start = 0;
    let position = 0;

    while (start < text.length) {
      let end = Math.min(start + maxChars, text.length);
      let content = text.slice(start, end);

      if (end < text.length) {
        const lastSpace = content.lastIndexOf(' ');
        if (lastSpace > maxChars * 0.5) {
          end = start + lastSpace + 1;
          content = text.slice(start, end);
        }
      }

      const tokenCount = estimateTokenCount(content);
      chunks.push({ content: content.trim(), position, tokenCount });
      position++;
      start = end - overlapChars;
      if (start >= end) start = end;
    }

    return chunks;
  }

  private sentenceChunking(text: string, chunkSize: number, overlap: number): ChunkResult[] {
    const sentences = splitSentences(text);
    const chunks: ChunkResult[] = [];
    const maxTokens = chunkSize;
    const overlapTokens = overlap;
    let currentChunk: string[] = [];
    let currentTokens = 0;
    let position = 0;

    for (const sentence of sentences) {
      const sentenceTokens = estimateTokenCount(sentence);
      if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
        const content = currentChunk.join(' ').trim();
        if (content) {
          chunks.push({
            content,
            position,
            tokenCount: currentTokens,
          });
          position++;
        }
        const overlapSentences = takeOverlapSentences(currentChunk, overlapTokens);
        currentChunk = overlapSentences;
        currentTokens = overlapSentences.reduce((s, t) => s + estimateTokenCount(t), 0);
      }
      currentChunk.push(sentence);
      currentTokens += sentenceTokens;
    }

    if (currentChunk.length > 0) {
      const content = currentChunk.join(' ').trim();
      if (content) {
        chunks.push({
          content,
          position,
          tokenCount: currentTokens,
        });
      }
    }

    return chunks;
  }

  private semanticChunking(text: string, chunkSize: number, overlap: number): ChunkResult[] {
    const paragraphs = splitParagraphs(text);
    const chunks: ChunkResult[] = [];
    const maxTokens = chunkSize;
    const overlapTokens = overlap;
    let currentChunk: string[] = [];
    let currentTokens = 0;
    let position = 0;

    for (const para of paragraphs) {
      const paraTokens = estimateTokenCount(para);
      if (currentTokens + paraTokens > maxTokens && currentChunk.length > 0) {
        const content = currentChunk.join('\n\n').trim();
        if (content) {
          chunks.push({
            content,
            position,
            tokenCount: currentTokens,
          });
          position++;
        }
        const overlapParas = takeOverlapParagraphs(currentChunk, overlapTokens);
        currentChunk = overlapParas;
        currentTokens = overlapParas.reduce((s, t) => s + estimateTokenCount(t), 0);
      }
      currentChunk.push(para);
      currentTokens += paraTokens;
    }

    if (currentChunk.length > 0) {
      const content = currentChunk.join('\n\n').trim();
      if (content) {
        chunks.push({
          content,
          position,
          tokenCount: currentTokens,
        });
      }
    }

    return chunks;
  }

  estimateTokenCount(text: string): number {
    return Math.ceil(text.length / CHARS_PER_TOKEN);
  }
}

function normalizeText(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function takeOverlapSentences(sentences: string[], overlapTokens: number): string[] {
  let tokens = 0;
  const result: string[] = [];
  for (let i = sentences.length - 1; i >= 0 && tokens < overlapTokens; i--) {
    result.unshift(sentences[i]);
    tokens += estimateTokenCount(sentences[i]);
  }
  return result;
}

function takeOverlapParagraphs(paragraphs: string[], overlapTokens: number): string[] {
  let tokens = 0;
  const result: string[] = [];
  for (let i = paragraphs.length - 1; i >= 0 && tokens < overlapTokens; i--) {
    result.unshift(paragraphs[i]);
    tokens += estimateTokenCount(paragraphs[i]);
  }
  return result;
}
