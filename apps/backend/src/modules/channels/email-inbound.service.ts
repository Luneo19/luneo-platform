import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { IdempotencyService } from '@/libs/idempotency/idempotency.service';
import { OrchestratorService } from '@/modules/orchestrator/orchestrator.service';
import { EmailService } from '@/modules/email/email.service';
import { RagSource } from '@/modules/rag/rag.service';
import { createHmac, timingSafeEqual } from 'crypto';

export interface ParsedEmail {
  from: string;
  fromName: string;
  to: string;
  subject: string;
  body: string;
  messageId: string;
  inReplyTo?: string;
}

@Injectable()
export class EmailInboundService {
  private readonly logger = new Logger(EmailInboundService.name);

  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly configService: ConfigService,
    private readonly idempotencyService: IdempotencyService,
    private readonly orchestratorService: OrchestratorService,
    private readonly emailService: EmailService,
  ) {}

  verifyWebhookSignature(
    rawBody: Record<string, unknown>,
    headers: Record<string, string | string[] | undefined>,
  ): boolean {
    const hmacSecret = this.configService.get<string>('EMAIL_WEBHOOK_SHARED_SECRET');
    const hmacSignature = this.readHeader(
      headers,
      'x-luneo-webhook-signature',
      'x-email-webhook-signature',
      'x-sendgrid-signature',
    );
    if (hmacSecret && hmacSignature) {
      const expected = createHmac('sha256', hmacSecret)
        .update(JSON.stringify(rawBody))
        .digest('hex');
      if (this.safeCompare(expected, hmacSignature.replace(/^sha256=/i, ''))) {
        return true;
      }
    }

    const mailgunKey = this.configService.get<string>('MAILGUN_WEBHOOK_SIGNING_KEY');
    const mailgunSignature =
      this.readHeader(headers, 'x-mailgun-signature') ??
      (typeof rawBody.signature === 'string' ? rawBody.signature : undefined);
    const mailgunTimestamp =
      this.readHeader(headers, 'x-mailgun-timestamp') ??
      (typeof rawBody.timestamp === 'string' ? rawBody.timestamp : undefined);
    const mailgunToken =
      this.readHeader(headers, 'x-mailgun-token') ??
      (typeof rawBody.token === 'string' ? rawBody.token : undefined);

    if (mailgunKey && mailgunSignature && mailgunTimestamp && mailgunToken) {
      const expected = createHmac('sha256', mailgunKey)
        .update(`${mailgunTimestamp}${mailgunToken}`)
        .digest('hex');
      return this.safeCompare(expected, mailgunSignature);
    }

    return false;
  }

  parseInboundEmail(rawBody: Record<string, unknown>): ParsedEmail {
    // Handle SendGrid Inbound Parse format: from, to, subject, text, html, envelope
    // Handle Mailgun format: from, recipient, subject, body-plain, body-html
    const envelope = rawBody.envelope as { from?: string; to?: string[] } | undefined;
    const fromRaw = (rawBody.from as string) || envelope?.from || '';
    const toRaw =
      (rawBody.to as string) ||
      (rawBody.recipient as string) ||
      (Array.isArray(envelope?.to) ? envelope.to[0] : '') ||
      '';

    return {
      from: this.extractEmail(fromRaw),
      fromName: this.extractName(fromRaw),
      to: this.extractEmail(toRaw),
      subject: (rawBody.subject as string) || '(No subject)',
      body:
        (rawBody.text as string) ||
        (rawBody['body-plain'] as string) ||
        this.stripHtml((rawBody.html as string) || (rawBody['body-html'] as string) || ''),
      messageId:
        (this.getHeader(rawBody, 'Message-ID') as string) ||
        (rawBody['message-id'] as string) ||
        `msg_${Date.now()}`,
      inReplyTo:
        (this.getHeader(rawBody, 'In-Reply-To') as string) ||
        (rawBody['in-reply-to'] as string),
    };
  }

  async processInboundEmail(
    email: ParsedEmail,
    rawPayload?: Record<string, unknown>,
  ): Promise<void> {
    this.logger.log(`Processing inbound email from ${email.from} to ${email.to}`);
    const incomingEventId =
      (typeof rawPayload?.['event-id'] === 'string' ? rawPayload['event-id'] : undefined) ||
      (typeof rawPayload?.['provider-event-id'] === 'string'
        ? rawPayload['provider-event-id']
        : undefined) ||
      email.messageId;
    const idempotencyKey = `email-inbound:${email.to}:${incomingEventId}`;
    const alreadyProcessed = await this.idempotencyService.isProcessed(idempotencyKey);
    if (alreadyProcessed) {
      this.logger.warn(`Skipping duplicate inbound email event key=${idempotencyKey}`);
      return;
    }

    // 1. Find the email channel by the destination address
    const channel = await this.prisma.channel.findFirst({
      where: {
        type: 'EMAIL',
        emailForwardAddress: email.to,
        deletedAt: null,
        status: 'ACTIVE',
      },
      include: {
        agent: {
          include: { organization: true },
        },
      },
    });

    if (!channel) {
      this.logger.warn(`No email channel found for address: ${email.to}`);
      return;
    }

    if (channel.agent.status !== 'ACTIVE') {
      this.logger.warn(`Agent ${channel.agent.id} is not active, skipping email`);
      return;
    }

    // 2. Find or create conversation (by visitor email + agent)
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        agentId: channel.agent.id,
        visitorEmail: email.from,
        status: { in: ['ACTIVE', 'ESCALATED'] },
        channelType: 'EMAIL',
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          organizationId: channel.agent.organizationId,
          agentId: channel.agent.id,
          channelId: channel.id,
          channelType: 'EMAIL',
          visitorEmail: email.from,
          visitorName: email.fromName,
          externalId: email.messageId,
          status: 'ACTIVE',
        },
      });

      // Update counters
      await this.prisma.organization.update({
        where: { id: channel.agent.organizationId },
        data: { conversationsUsed: { increment: 1 } },
      });
      await this.prisma.agent.update({
        where: { id: channel.agent.id },
        data: { totalConversations: { increment: 1 } },
      });
    }

    // 3. Save inbound message
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: `Subject: ${email.subject}\n\n${email.body}`,
        contentType: 'text',
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        messageCount: { increment: 1 },
        userMessageCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    const replyFrom =
      channel.emailFromAddress || channel.emailFromName
        ? `${channel.emailFromName || channel.agent.name} <${channel.emailFromAddress || 'noreply@luneo.app'}>`
        : `${channel.agent.name} <noreply@luneo.app>`;

    // 4. Generate AI response via orchestrator
    try {
      const result = await this.orchestratorService.executeAgent(
        channel.agent.id,
        conversation.id,
        email.body,
      );

      // 5. Send reply email
      const emailOptions: Parameters<EmailService['sendEmail']>[0] = {
        to: email.from,
        from: replyFrom,
        subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
        text: result.content,
        html: this.formatResponseHtml(result.content, result.sources),
      };

      const replyTo = channel.emailReplyTo || channel.emailFromAddress;
      if (replyTo) {
        emailOptions.headers = { ...(emailOptions.headers ?? {}), 'Reply-To': replyTo };
      }

      await this.emailService.sendEmail(emailOptions);

      this.logger.log(`Email reply sent to ${email.from} for conversation ${conversation.id}`);
      await this.idempotencyService.markAsProcessed(
        idempotencyKey,
        { conversationId: conversation.id },
        60 * 60 * 24 * 30,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process email for conversation ${conversation.id}`,
        error,
      );

      // Send fallback if configured
      if (channel.agent.fallbackMessage) {
        await this.emailService.sendEmail({
          to: email.from,
          from: replyFrom,
          subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
          text: channel.agent.fallbackMessage,
        });
      }
    }
  }

  private readHeader(
    headers: Record<string, string | string[] | undefined>,
    ...keys: string[]
  ): string | undefined {
    for (const key of keys) {
      const value = headers[key] ?? headers[key.toLowerCase()] ?? headers[key.toUpperCase()];
      if (Array.isArray(value) && value.length > 0) {
        return value[0];
      }
      if (typeof value === 'string' && value.trim() !== '') {
        return value;
      }
    }
    return undefined;
  }

  private safeCompare(expected: string, provided: string): boolean {
    try {
      const expectedBuffer = Buffer.from(expected);
      const providedBuffer = Buffer.from(provided);
      if (expectedBuffer.length !== providedBuffer.length) {
        return false;
      }
      return timingSafeEqual(expectedBuffer, providedBuffer);
    } catch {
      return false;
    }
  }

  private extractEmail(header: string): string {
    const match = header.match(/<([^>]+)>/);
    return match ? match[1].trim().toLowerCase() : header.trim().toLowerCase();
  }

  private extractName(fromHeader: string): string {
    const match = fromHeader.match(/^"?([^"<]+)"?\s*</);
    return match ? match[1].trim() : fromHeader.split('@')[0];
  }

  private getHeader(rawBody: Record<string, unknown>, name: string): string | undefined {
    const headers = rawBody.headers as Record<string, string> | undefined;
    if (!headers) return undefined;
    const key = Object.keys(headers).find(
      (k) => k.toLowerCase() === name.toLowerCase(),
    );
    return key ? headers[key] : undefined;
  }

  private stripHtml(html: string): string {
    if (!html) return '';
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private formatResponseHtml(content: string, sources?: RagSource[]): string {
    let html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">`;
    html += `<p>${content.replace(/\n/g, '<br>')}</p>`;

    if (sources && sources.length > 0) {
      html += `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">`;
      html += `<p style="font-size: 12px; color: #6b7280;">Sources:</p>`;
      html += `<ul style="font-size: 12px; color: #6b7280;">`;
      for (const source of sources) {
        html += `<li>${source.documentTitle || 'Source'}</li>`;
      }
      html += `</ul>`;
    }

    html += `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">`;
    html += `<p style="font-size: 11px; color: #9ca3af;">Powered by <a href="https://luneo.app" style="color: #6366f1;">Luneo</a></p>`;
    html += `</div>`;

    return html;
  }
}
