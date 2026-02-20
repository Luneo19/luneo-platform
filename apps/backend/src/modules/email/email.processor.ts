import { Process, Processor } from '@nestjs/bull';
import { Inject, forwardRef } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailService } from './email.service';

export interface EmailJobData {
  type: 'welcome' | 'password-reset' | 'confirmation' | 'generic';
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  templateId?: string;
  templateData?: Record<string, unknown>;
  tags?: string[];
  headers?: Record<string, string>;
  provider?: 'sendgrid' | 'mailgun' | 'auto';
  // Données spécifiques aux types d'emails
  data?: {
    userName?: string;
    resetToken?: string;
    resetUrl?: string;
    confirmationToken?: string;
    confirmationUrl?: string;
  };
  // Metadata
  userId?: string;
  brandId?: string;
  priority?: 'low' | 'normal' | 'high';
  retryCount?: number;
}

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    @Inject(forwardRef(() => EmailService))
    private readonly emailService: EmailService,
  ) {}

  @Process('send')
  async handleSendEmail(job: Job<EmailJobData>) {
    const { type, to, subject: _subject, data, provider } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing email job ${job.id}: ${type} to ${Array.isArray(to) ? to.join(', ') : to}`);

    try {
      let result;

      switch (type) {
        case 'welcome':
          result = await this.emailService.sendWelcomeEmail(
            Array.isArray(to) ? to[0] : to,
            data?.userName || 'Utilisateur',
            provider,
          );
          break;
        case 'password-reset':
          result = await this.emailService.sendPasswordResetEmail(
            Array.isArray(to) ? to[0] : to,
            data?.resetToken || '',
            data?.resetUrl || '',
            provider,
          );
          break;
        case 'confirmation':
          result = await this.emailService.sendConfirmationEmail(
            Array.isArray(to) ? to[0] : to,
            data?.confirmationToken || '',
            data?.confirmationUrl || '',
            provider,
          );
          break;
        case 'generic':
        default:
          result = await this.emailService.sendEmail({
            to: job.data.to,
            subject: job.data.subject,
            html: job.data.html,
            text: job.data.text,
            from: job.data.from,
            cc: job.data.cc,
            bcc: job.data.bcc,
            tags: job.data.tags,
            headers: job.data.headers,
            provider: job.data.provider,
          });
          break;
      }

      const duration = Date.now() - startTime;
      this.logger.log(`Email job ${job.id} completed in ${duration}ms`);

      return {
        success: true,
        type,
        to,
        duration,
        messageId: result != null && typeof result === 'object' && 'messageId' in result ? (result as { messageId?: string }).messageId : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Email job ${job.id} failed: ${errorMessage}`);

      if (job.data.provider !== 'auto' && job.attemptsMade < 2) {
        this.logger.log(`Attempting fallback for email job ${job.id}`);
        throw error;
      }

      throw error;
    }
  }

  @Process('batch')
  async handleBatchEmails(job: Job<{ emails: EmailJobData[] }>) {
    const { emails } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing batch email job ${job.id}: ${emails.length} emails`);

    const results = await Promise.allSettled(
      emails.map(email =>
        this.emailService.sendEmail({
          to: email.to,
          subject: email.subject,
          html: email.html,
          text: email.text,
          tags: email.tags,
        }),
      ),
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    const duration = Date.now() - startTime;
    this.logger.log(`Batch email job ${job.id} completed in ${duration}ms: ${succeeded} succeeded, ${failed} failed`);

    return {
      success: failed === 0,
      total: emails.length,
      succeeded,
      failed,
      duration,
    };
  }
}
