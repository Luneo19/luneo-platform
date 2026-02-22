import { Injectable, Logger } from '@nestjs/common';

export interface LoadedDocument {
  content: string;
  title: string;
  source: string;
  mimeType: string;
  metadata: Record<string, unknown>;
}

@Injectable()
export class DocumentLoaderService {
  private readonly logger = new Logger(DocumentLoaderService.name);

  async loadText(content: string, title: string, source = 'text'): Promise<LoadedDocument> {
    return {
      content: content.trim(),
      title,
      source,
      mimeType: 'text/plain',
      metadata: { charCount: content.length },
    };
  }

  async loadMarkdown(content: string, title: string): Promise<LoadedDocument> {
    // Strip markdown formatting for embedding but keep structure for display
    const cleanContent = content
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links to text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/^\s*[-*+]\s/gm, '') // List markers
      .replace(/^\s*\d+\.\s/gm, '') // Numbered lists
      .trim();

    return {
      content: cleanContent,
      title,
      source: 'markdown',
      mimeType: 'text/markdown',
      metadata: {
        charCount: cleanContent.length,
        originalLength: content.length,
      },
    };
  }

  async loadUrl(url: string): Promise<LoadedDocument> {
    // Placeholder: in production, use a proper HTML-to-text parser
    return {
      content: `Content from ${url}`,
      title: url,
      source: url,
      mimeType: 'text/html',
      metadata: { url },
    };
  }

  async loadJson(data: Record<string, unknown>, title: string): Promise<LoadedDocument> {
    const content = this.flattenJson(data);
    return {
      content,
      title,
      source: 'json',
      mimeType: 'application/json',
      metadata: { keys: Object.keys(data) },
    };
  }

  private flattenJson(obj: Record<string, unknown>, prefix = ''): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        parts.push(this.flattenJson(value as Record<string, unknown>, fullKey));
      } else {
        parts.push(`${fullKey}: ${String(value)}`);
      }
    }
    return parts.join('\n');
  }
}
