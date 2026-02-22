import { Injectable, Logger } from '@nestjs/common';

export interface ParsedEmail {
  from: string;
  fromName: string;
  to: string;
  subject: string;
  body: string;
  textBody: string;
  messageId: string;
  inReplyTo?: string;
  references?: string[];
  date: Date;
  attachments: Array<{ filename: string; contentType: string; size: number }>;
}

@Injectable()
export class EmailParserService {
  private readonly logger = new Logger(EmailParserService.name);

  parse(rawPayload: Record<string, unknown>): ParsedEmail {
    const from = String(rawPayload.from || rawPayload.sender || '');
    const fromMatch = from.match(/^(.+?)\s*<(.+?)>$/);

    const htmlBody = String(rawPayload.html || '');
    const textBody = String(rawPayload.text || '');
    const cleanBody = this.cleanEmailBody(textBody || this.stripHtml(htmlBody));

    const headers = (rawPayload.headers || rawPayload.envelope || '') as string;
    const inReplyTo = this.extractHeader(headers, 'In-Reply-To') || (rawPayload['In-Reply-To'] as string);
    const referencesRaw = this.extractHeader(headers, 'References') || (rawPayload['References'] as string);

    return {
      from: fromMatch?.[2] || from,
      fromName: fromMatch?.[1]?.replace(/"/g, '') || from.split('@')[0],
      to: String(rawPayload.to || ''),
      subject: String(rawPayload.subject || ''),
      body: cleanBody,
      textBody,
      messageId: String(rawPayload['Message-ID'] || rawPayload.messageId || `${Date.now()}@email`),
      inReplyTo: inReplyTo || undefined,
      references: referencesRaw ? referencesRaw.split(/\s+/).filter(Boolean) : undefined,
      date: rawPayload.date ? new Date(rawPayload.date as string) : new Date(),
      attachments: Array.isArray(rawPayload.attachments)
        ? (rawPayload.attachments as Array<Record<string, unknown>>).map((a) => ({
            filename: String(a.filename || a.name || 'attachment'),
            contentType: String(a.contentType || a.type || 'application/octet-stream'),
            size: Number(a.size || a.length || 0),
          }))
        : [],
    };
  }

  private cleanEmailBody(text: string): string {
    const lines = text.split('\n');
    const cleanLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('>')) break;
      if (line.match(/^On .+ wrote:$/)) break;
      if (line.match(/^Le .+ a écrit :$/)) break;
      if (line.startsWith('---')) break;
      if (line.match(/^From:/)) break;
      cleanLines.push(line);
    }

    return cleanLines.join('\n').trim();
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  private extractHeader(headers: string, name: string): string | null {
    if (!headers) return null;
    const match = headers.match(new RegExp(`${name}:\\s*(.+?)(?:\\r?\\n(?!\\s)|$)`, 'i'));
    return match?.[1]?.trim() || null;
  }
}
