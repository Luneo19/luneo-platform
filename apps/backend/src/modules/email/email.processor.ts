import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailgunService } from './mailgun.service';
import { SendGridService } from './sendgrid.service';
import { ConfigService } from '@nestjs/config';

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
  templateData?: Record<string, any>;
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
  private sendgridAvailable = false;
  private mailgunAvailable = false;
  private defaultProvider: 'sendgrid' | 'mailgun' = 'sendgrid';

  constructor(
    private readonly configService: ConfigService,
    private readonly mailgunService: MailgunService,
    private readonly sendgridService: SendGridService,
  ) {
    this.initializeProviders();
  }

  private initializeProviders() {
    this.sendgridAvailable = this.sendgridService.isAvailable();
    this.mailgunAvailable = this.mailgunService.isAvailable();

    if (this.sendgridAvailable) {
      this.defaultProvider = 'sendgrid';
    } else if (this.mailgunAvailable) {
      this.defaultProvider = 'mailgun';
    }

    this.logger.log(`Email processor initialized - SendGrid: ${this.sendgridAvailable}, Mailgun: ${this.mailgunAvailable}`);
  }

  @Process('send')
  async handleSendEmail(job: Job<EmailJobData>) {
    const { type, to, subject, data, provider } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing email job ${job.id}: ${type} to ${Array.isArray(to) ? to.join(', ') : to}`);

    try {
      let result;

      switch (type) {
        case 'welcome':
          result = await this.sendWelcomeEmail(job.data);
          break;
        case 'password-reset':
          result = await this.sendPasswordResetEmail(job.data);
          break;
        case 'confirmation':
          result = await this.sendConfirmationEmail(job.data);
          break;
        case 'generic':
        default:
          result = await this.sendGenericEmail(job.data);
          break;
      }

      const duration = Date.now() - startTime;
      this.logger.log(`Email job ${job.id} completed in ${duration}ms`);

      return {
        success: true,
        type,
        to,
        duration,
        provider: this.defaultProvider,
        messageId: result?.messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Email job ${job.id} failed: ${errorMessage}`);

      // Si erreur avec le provider principal, tenter le fallback
      if (job.data.provider !== 'auto' && job.attemptsMade < 2) {
        this.logger.log(`Attempting fallback for email job ${job.id}`);
        throw error; // Relancer pour retry avec fallback
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
      emails.map(email => this.sendGenericEmail(email)),
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

  private async sendWelcomeEmail(jobData: EmailJobData): Promise<any> {
    const { to, data } = jobData;
    const userName = data?.userName || 'Utilisateur';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Bienvenue ${userName} !</h1>
        <p>Nous sommes ravis de vous accueillir chez Luneo.</p>
        <p>Votre compte a été créé avec succès.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Prochaines étapes :</h3>
          <ul>
            <li>Complétez votre profil</li>
            <li>Explorez nos fonctionnalités</li>
            <li>Créez votre premier design</li>
          </ul>
        </div>
        <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
        <p>Cordialement,<br>L'équipe Luneo</p>
      </div>
    `;

    return this.sendWithProvider({
      to,
      subject: 'Bienvenue chez Luneo ! 🎉',
      html,
      tags: ['welcome', 'onboarding'],
    });
  }

  private async sendPasswordResetEmail(jobData: EmailJobData): Promise<any> {
    const { to, data } = jobData;
    const resetToken = data?.resetToken || '';
    const resetUrl = data?.resetUrl || '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Réinitialisation de mot de passe</h1>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}?token=${resetToken}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p>Ce lien expirera dans 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        <p>Cordialement,<br>L'équipe Luneo</p>
      </div>
    `;

    return this.sendWithProvider({
      to,
      subject: 'Réinitialisation de votre mot de passe',
      html,
      tags: ['password-reset', 'security'],
    });
  }

  private async sendConfirmationEmail(jobData: EmailJobData): Promise<any> {
    const { to, data } = jobData;
    const confirmationToken = data?.confirmationToken || '';
    const confirmationUrl = data?.confirmationUrl || '';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Confirmation d'email</h1>
        <p>Merci de vous être inscrit chez Luneo !</p>
        <p>Pour activer votre compte, veuillez confirmer votre adresse email :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmationUrl}?token=${confirmationToken}" 
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Confirmer mon email
          </a>
        </div>
        <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
        <p style="word-break: break-all; color: #666;">${confirmationUrl}?token=${confirmationToken}</p>
        <p>Cordialement,<br>L'équipe Luneo</p>
      </div>
    `;

    return this.sendWithProvider({
      to,
      subject: 'Confirmez votre adresse email',
      html,
      tags: ['email-confirmation', 'onboarding'],
    });
  }

  private async sendGenericEmail(jobData: EmailJobData): Promise<any> {
    const { to, subject, html, text, tags } = jobData;

    return this.sendWithProvider({
      to,
      subject,
      html,
      text,
      tags,
    });
  }

  private async sendWithProvider(options: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    tags?: string[];
  }): Promise<any> {
    // Essayer le provider par défaut
    try {
      if (this.defaultProvider === 'sendgrid' && this.sendgridAvailable) {
        return await this.sendgridService.sendSimpleMessage({
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          categories: options.tags,
        });
      } else if (this.defaultProvider === 'mailgun' && this.mailgunAvailable) {
        return await this.mailgunService.sendSimpleMessage({
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          tags: options.tags,
        });
      }
    } catch (error) {
      this.logger.warn(`Primary provider ${this.defaultProvider} failed, trying fallback...`);
    }

    // Fallback
    if (this.defaultProvider === 'sendgrid' && this.mailgunAvailable) {
      return await this.mailgunService.sendSimpleMessage({
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        tags: options.tags,
      });
    } else if (this.defaultProvider === 'mailgun' && this.sendgridAvailable) {
      return await this.sendgridService.sendSimpleMessage({
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        categories: options.tags,
      });
    }

    throw new Error('No email provider available');
  }
}
