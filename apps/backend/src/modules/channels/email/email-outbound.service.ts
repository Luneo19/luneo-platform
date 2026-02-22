import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendEmailOptions {
  to: string;
  from: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string[];
  agentName?: string;
}

@Injectable()
export class EmailOutboundService {
  private readonly logger = new Logger(EmailOutboundService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendReply(options: SendEmailOptions): Promise<void> {
    const html = this.markdownToHtml(options.body);
    const signature = this.buildSignature(options.agentName);

    const sgApiKey = this.configService.get<string>('email.sendgridApiKey');
    if (!sgApiKey) {
      this.logger.warn('SendGrid API key not configured, skipping email send');
      return;
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sgApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: options.to }] }],
          from: { email: options.from, name: options.agentName || 'Luneo AI' },
          subject: options.subject.startsWith('Re:') ? options.subject : `Re: ${options.subject}`,
          content: [
            { type: 'text/html', value: `${html}${signature}` },
          ],
          headers: {
            ...(options.inReplyTo && { 'In-Reply-To': options.inReplyTo }),
            ...(options.references && { References: options.references.join(' ') }),
          },
        }),
      });

      if (!response.ok) {
        this.logger.error(`SendGrid error: ${response.status} ${await response.text()}`);
      }
    } catch (error: unknown) {
      this.logger.error('Failed to send email', error instanceof Error ? error.message : String(error));
    }
  }

  private markdownToHtml(markdown: string): string {
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  private buildSignature(agentName?: string): string {
    return `
      <br><br>
      <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px; color: #9ca3af; font-size: 12px;">
        <p>${agentName || 'Luneo AI'} — Powered by <a href="https://luneo.app" style="color: #6366f1;">Luneo</a></p>
      </div>
    `;
  }
}
