// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@Injectable()
export class DocumentParserService {
  private readonly logger = new Logger(DocumentParserService.name);

  async parseFile(
    fileUrl: string,
    mimeType: string,
  ): Promise<{ title: string; content: string; metadata: Record<string, unknown> }> {
    if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
      throw new Error(`Unsupported mime type: ${mimeType}`);
    }

    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 60_000,
      maxContentLength: 50 * 1024 * 1024,
    });

    const buffer = Buffer.from(response.data);

    if (mimeType === 'application/pdf') {
      return this.parsePdf(buffer);
    }
    if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      const content = buffer.toString('utf-8');
      return this.parseText(content);
    }
    if (mimeType === 'text/csv') {
      return this.parseCsv(buffer);
    }
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return this.parseDocx(buffer);
    }

    throw new Error(`Unsupported mime type: ${mimeType}`);
  }

  async parseText(text: string): Promise<{ title: string; content: string }> {
    const lines = text.split('\n').filter((l) => l.trim());
    const firstLine = lines[0] ?? '';
    const title =
      firstLine.length <= 120 && (firstLine.endsWith('.') || !firstLine.includes('.'))
        ? firstLine
        : 'Document';
    const content = lines.join('\n').trim();
    return {
      title,
      content: content || text,
    };
  }

  async parseWebpage(
    url: string,
  ): Promise<{ title: string; content: string; url: string }> {
    const response = await axios.get(url, {
      responseType: 'text',
      timeout: 30_000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; LuneoBot/1.0; +https://luneo.app)',
      },
    });

    const html = response.data as string;
    const $ = cheerio.load(html);

    $('script, style, nav, footer, header, aside, noscript, iframe').remove();
    const title = $('title').text().trim() || $('h1').first().text().trim() || url;
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

    return {
      title,
      content: bodyText,
      url,
    };
  }

  private async parsePdf(
    buffer: Buffer,
  ): Promise<{ title: string; content: string; metadata: Record<string, unknown> }> {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    const title = (data.info?.Title as string) || 'Document PDF';
    return {
      title,
      content: data.text || '',
      metadata: { pages: data.numpages, info: data.info },
    };
  }

  private parseCsv(
    buffer: Buffer,
  ): Promise<{ title: string; content: string; metadata: Record<string, unknown> }> {
    const text = buffer.toString('utf-8');
    const lines = text.split('\n').filter((l) => l.trim());
    const content = lines.map((line) => line.replace(/,/g, ' | ')).join('\n');
    return Promise.resolve({
      title: 'CSV Document',
      content,
      metadata: { rows: lines.length },
    });
  }

  private async parseDocx(
    buffer: Buffer,
  ): Promise<{ title: string; content: string; metadata: Record<string, unknown> }> {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    const content = result.value || '';
    const title = content.split('\n')[0]?.slice(0, 120) || 'Document Word';
    return {
      title,
      content,
      metadata: {},
    };
  }
}
