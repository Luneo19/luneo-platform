import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContactRequestDto, ContactType } from './dto/contact-request.dto';
import { EmailService } from '@/modules/email/email.service';
import { escapeHtml } from '@/modules/email/template-renderer';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  private async verifyCaptcha(token?: string): Promise<void> {
    const secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    const nodeEnv = this.configService.get<string>('NODE_ENV');

    if (!secretKey) {
      if (nodeEnv === 'production') {
        throw new BadRequestException('CAPTCHA is required but not configured');
      }
      return;
    }

    if (!token) {
      throw new BadRequestException('CAPTCHA token is required');
    }

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!payload?.success) {
      throw new BadRequestException('CAPTCHA verification failed');
    }
    if (payload.action && payload.action !== 'contact') {
      throw new BadRequestException('CAPTCHA action mismatch');
    }
    if (typeof payload.score === 'number' && payload.score < 0.5) {
      throw new BadRequestException('CAPTCHA score too low');
    }
  }

  private getSupportEmail(): string {
    return (
      this.configService.get<string>('SUPPORT_EMAIL')
      || this.configService.get<string>('CONTACT_EMAIL')
      || 'support@luneo.app'
    );
  }

  private normalizeType(type?: ContactType): ContactType {
    return type || ContactType.GENERAL;
  }

  async submitContactMessage(dto: ContactRequestDto): Promise<{ trackingId: string; message: string }> {
    await this.verifyCaptcha(dto.captchaToken);

    const trackingId = `ctc_${Date.now().toString(36)}`;
    const type = this.normalizeType(dto.type);
    const supportEmail = this.getSupportEmail();

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto">
        <h2 style="color:#111827;margin-bottom:8px">Nouveau message de contact</h2>
        <p style="color:#6b7280;margin-top:0">Tracking ID: <strong>${trackingId}</strong></p>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>Nom</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(dto.name)}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>Email</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(dto.email)}</td></tr>
          ${dto.company ? `<tr><td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>Entreprise</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(dto.company)}</td></tr>` : ''}
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>Type</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(type)}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>Sujet</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(dto.subject)}</td></tr>
        </table>
        <h3 style="margin-top:20px;color:#111827">Message</h3>
        <div style="white-space:pre-wrap;background:#f9fafb;padding:16px;border-radius:8px;border:1px solid #e5e7eb">${escapeHtml(dto.message)}</div>
      </div>
    `;

    try {
      await this.emailService.sendEmail({
        to: supportEmail,
        subject: `[Contact ${type}] ${dto.subject} (${trackingId})`,
        html,
        text: `Contact ${type}\nTracking ID: ${trackingId}\n\nFrom: ${dto.name} <${dto.email}>\nSubject: ${dto.subject}\n${dto.company ? `Company: ${dto.company}\n` : ''}\n\n${dto.message}`,
        headers: { 'Reply-To': dto.email },
        tags: ['contact', type],
        provider: 'auto',
      });
    } catch (error) {
      this.logger.error('Failed to send contact message email', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Failed to process contact request');
    }

    this.logger.log(`Contact message delivered to support. trackingId=${trackingId}`);
    return {
      trackingId,
      message: 'Message sent successfully. We will get back to you within 24h.',
    };
  }
}
