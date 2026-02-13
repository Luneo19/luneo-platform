import { Injectable, Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { MailgunService, MailgunEmailOptions } from './mailgun.service';
import { SendGridService, SendGridEmailOptions } from './sendgrid.service';
import { EmailJobData } from './email.processor';

function emailLayout(content: string, previewText?: string, frontendUrl?: string): string {
  const baseUrl = frontendUrl ?? 'https://app.luneo.app';
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.container{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;margin-top:20px;margin-bottom:20px}
.header{background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:30px;text-align:center;color:#fff}
.content{padding:30px}.footer{padding:20px 30px;text-align:center;font-size:12px;color:#71717a;border-top:1px solid #e4e4e7}
.btn{display:inline-block;background:#6366f1;color:#fff !important;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600}</style>
</head><body>${previewText ? `<div style="display:none;max-height:0;overflow:hidden">${previewText}</div>` : ''}
<div class="container"><div class="header"><h1 style="margin:0;font-size:24px">Luneo</h1></div>
<div class="content">${content}</div>
<div class="footer"><p>© ${new Date().getFullYear()} Luneo. Tous droits réservés.</p><p><a href="${baseUrl}" style="color:#6366f1">luneo.app</a></p></div>
</div></body></html>`;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    data: Buffer | string;
    contentType?: string;
  }>;
  template?: string;
  templateData?: Record<string, unknown>;
  tags?: string[];
  headers?: Record<string, string>;
  provider?: 'sendgrid' | 'mailgun' | 'auto';
}

export interface QueueEmailOptions {
  priority?: 'low' | 'normal' | 'high';
  delay?: number; // milliseconds
  userId?: string;
  brandId?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private sendgridAvailable = false;
  private mailgunAvailable = false;
  private defaultProvider: 'sendgrid' | 'mailgun' = 'sendgrid';

  constructor(
    private configService: ConfigService,
    private mailgunService: MailgunService,
    private sendgridService: SendGridService,
    @InjectQueue('email') private emailQueue: Queue,
  ) {
    this.initializeProviders();
  }

  private getFrontendUrl(): string {
    return this.configService.get<string>('app.frontendUrl')
      ?? this.configService.get<string>('FRONTEND_URL')
      ?? 'https://app.luneo.app';
  }

  private initializeProviders() {
    // Vérifier SendGrid
    this.sendgridAvailable = this.sendgridService.isAvailable();

    // Vérifier Mailgun
    this.mailgunAvailable = this.mailgunService.isAvailable();

    // Déterminer le provider par défaut
    if (this.sendgridAvailable) {
      this.defaultProvider = 'sendgrid';
    } else if (this.mailgunAvailable) {
      this.defaultProvider = 'mailgun';
    }

    this.logger.log(`Email providers - SendGrid: ${this.sendgridAvailable}, Mailgun: ${this.mailgunAvailable}`);
    this.logger.log(`Default provider: ${this.defaultProvider}`);
  }

  /**
   * Envoyer un email en utilisant le provider approprié
   */
  async sendEmail(options: EmailOptions): Promise<unknown> {
    const provider = options.provider || this.defaultProvider;

    try {
      switch (provider) {
        case 'sendgrid':
          return await this.sendWithSendGrid(options);
        case 'mailgun':
          return await this.sendWithMailgun(options);
        case 'auto':
          return await this.sendWithAutoProvider(options);
        default:
          throw new BadRequestException(`Unknown email provider: ${provider}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send email with ${provider}:`, error);
      
      // Fallback vers l'autre provider si disponible
      if (provider !== 'auto') {
        this.logger.log(`Attempting fallback to other provider...`);
        return await this.sendWithAutoProvider(options);
      }
      
      throw error;
    }
  }

  /**
   * Envoyer avec SendGrid
   */
  private async sendWithSendGrid(options: EmailOptions): Promise<unknown> {
    if (!this.sendgridAvailable) {
      throw new ServiceUnavailableException('SendGrid not available');
    }

    const sendgridOptions: SendGridEmailOptions = {
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      from: options.from,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
      templateId: options.template,
      templateData: options.templateData,
      categories: options.tags,
      headers: options.headers,
    };

    return await this.sendgridService.sendSimpleMessage(sendgridOptions);
  }

  /**
   * Envoyer avec Mailgun
   */
  private async sendWithMailgun(options: EmailOptions): Promise<unknown> {
    if (!this.mailgunAvailable) {
      throw new ServiceUnavailableException('Mailgun not available');
    }

    const mailgunOptions: MailgunEmailOptions = {
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      from: options.from,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
      template: options.template,
      templateData: options.templateData,
      tags: options.tags,
      headers: options.headers,
    };

    return await this.mailgunService.sendSimpleMessage(mailgunOptions);
  }

  /**
   * Envoyer avec le provider automatique (fallback)
   */
  private async sendWithAutoProvider(options: EmailOptions): Promise<unknown> {
    // Essayer d'abord le provider par défaut
    try {
      if (this.defaultProvider === 'sendgrid' && this.sendgridAvailable) {
        return await this.sendWithSendGrid(options);
      } else if (this.defaultProvider === 'mailgun' && this.mailgunAvailable) {
        return await this.sendWithMailgun(options);
      }
    } catch (error) {
      this.logger.warn(`Default provider failed, trying alternative...`);
    }

    // Fallback vers l'autre provider
    if (this.defaultProvider === 'sendgrid' && this.mailgunAvailable) {
      return await this.sendWithMailgun(options);
    } else if (this.defaultProvider === 'mailgun' && this.sendgridAvailable) {
      return await this.sendWithSendGrid(options);
    }

    throw new ServiceUnavailableException('No email provider available');
  }

  /**
   * Envoyer un email de bienvenue
   */
  async sendWelcomeEmail(userEmail: string, userName: string, provider?: 'sendgrid' | 'mailgun' | 'auto'): Promise<unknown> {
    const frontendUrl = this.configService.get<string>('app.frontendUrl') ?? this.configService.get<string>('FRONTEND_URL') ?? 'https://app.luneo.app';
    const loginUrl = `${frontendUrl}/login`;
    const content = `
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
      <p><a href="${loginUrl}" class="btn">Se connecter</a></p>
      <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
      <p>Cordialement,<br>L'équipe Luneo</p>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Bienvenue chez Luneo ! 🎉',
      html: emailLayout(content, undefined, frontendUrl),
      text: `Bienvenue sur Luneo, ${userName}!\n\nVotre compte a été créé avec succès.\n\nConnectez-vous: ${loginUrl}\n\nL'équipe Luneo`,
      tags: ['welcome', 'onboarding'],
      provider,
    });
  }

  /**
   * Envoyer un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(userEmail: string, resetToken: string, resetUrl: string, provider?: 'sendgrid' | 'mailgun' | 'auto'): Promise<unknown> {
    const fullResetUrl = `${resetUrl}?token=${resetToken}`;
    const content = `
      <h1 style="color: #333;">Réinitialisation de mot de passe</h1>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${fullResetUrl}" class="btn">Réinitialiser mon mot de passe</a>
      </div>
      <p>Ce lien expirera dans 1 heure.</p>
      <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      <p>Cordialement,<br>L'équipe Luneo</p>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Réinitialisation de votre mot de passe',
      html: emailLayout(content),
      text: `Réinitialisation de votre mot de passe\n\nCliquez sur ce lien pour réinitialiser votre mot de passe:\n${fullResetUrl}\n\nCe lien expire dans 1 heure.\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet email.`,
      tags: ['password-reset', 'security'],
      provider,
    });
  }

  /**
   * Envoyer un email de confirmation
   */
  async sendConfirmationEmail(userEmail: string, confirmationToken: string, confirmationUrl: string, provider?: 'sendgrid' | 'mailgun' | 'auto'): Promise<unknown> {
    const fullConfirmUrl = `${confirmationUrl}?token=${confirmationToken}`;
    const content = `
      <h1 style="color: #333;">Confirmation d'email</h1>
      <p>Merci de vous être inscrit chez Luneo !</p>
      <p>Pour activer votre compte, veuillez confirmer votre adresse email :</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${fullConfirmUrl}" class="btn">Confirmer mon email</a>
      </div>
      <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
      <p style="word-break: break-all; color: #666;">${fullConfirmUrl}</p>
      <p>Cordialement,<br>L'équipe Luneo</p>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: 'Confirmez votre adresse email',
      html: emailLayout(content),
      text: `Confirmez votre adresse email\n\nCliquez sur ce lien pour vérifier votre email:\n${fullConfirmUrl}\n\nL'équipe Luneo`,
      tags: ['email-confirmation', 'onboarding'],
      provider,
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(
    userEmail: string,
    orderData: {
      orderId: string;
      orderNumber: string;
      customerName: string;
      items: Array<{ name: string; quantity: number; price: string }>;
      total: string;
      estimatedDelivery?: string;
    },
  ): Promise<unknown> {
    // Try SendGrid template first
    if (this.sendgridAvailable) {
      try {
        // Adapt to SendGrid's expected format
        const sgOrderData = {
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber,
          totalAmount: parseFloat(orderData.total.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0,
          currency: 'EUR',
          items: orderData.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0,
          })),
          estimatedDelivery: orderData.estimatedDelivery,
        };
        return await this.sendgridService.sendOrderConfirmationEmail(userEmail, sgOrderData);
      } catch (error) {
        this.logger.warn('SendGrid order confirmation failed, falling back to inline email');
      }
    }

    // Fallback to inline HTML
    const itemsHtml = orderData.items
      .map(item => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${item.price}</td></tr>`)
      .join('');

    const content = `
      <h1 style="color: #333;">Confirmation de commande</h1>
      <p>Bonjour ${orderData.customerName},</p>
      <p>Merci pour votre commande <strong>#${orderData.orderNumber}</strong> !</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <thead><tr style="background:#f8f9fa"><th style="padding:8px;text-align:left">Article</th><th style="padding:8px;text-align:center">Qté</th><th style="padding:8px;text-align:right">Prix</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot><tr><td colspan="2" style="padding:8px;font-weight:bold">Total</td><td style="padding:8px;text-align:right;font-weight:bold">${orderData.total}</td></tr></tfoot>
      </table>
      <p>Vous pouvez suivre votre commande depuis votre tableau de bord.</p>
      <p>Cordialement,<br>L'équipe Luneo</p>
    `;

    return this.sendEmail({
      to: userEmail,
      subject: `Confirmation de commande #${orderData.orderNumber}`,
      html: content,
      text: `Confirmation de commande #${orderData.orderNumber}\n\nBonjour ${orderData.customerName},\nMerci pour votre commande!\nTotal: ${orderData.total}\n\nL'équipe Luneo`,
      tags: ['order-confirmation'],
    });
  }

  /**
   * Obtenir le statut des providers
   */
  getProviderStatus(): { sendgrid: boolean; mailgun: boolean; default: string } {
    return {
      sendgrid: this.sendgridAvailable,
      mailgun: this.mailgunAvailable,
      default: this.defaultProvider,
    };
  }

  /**
   * Obtenir les services individuels
   */
  getSendGridService(): SendGridService {
    return this.sendgridService;
  }

  getMailgunService(): MailgunService {
    return this.mailgunService;
  }

  // ============================================
  // ASYNC EMAIL METHODS (via BullMQ queue)
  // ============================================

  /**
   * Queue an email for async sending (non-blocking)
   * Use this for better performance on user-facing operations
   */
  async queueEmail(options: EmailOptions, queueOptions?: QueueEmailOptions): Promise<{ jobId: string }> {
    const jobData: EmailJobData = {
      type: 'generic',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      from: options.from,
      cc: options.cc,
      bcc: options.bcc,
      tags: options.tags,
      headers: options.headers,
      provider: options.provider,
      userId: queueOptions?.userId,
      brandId: queueOptions?.brandId,
      priority: queueOptions?.priority || 'normal',
    };

    const job = await this.emailQueue.add('send', jobData, {
      priority: this.getPriorityValue(queueOptions?.priority),
      delay: queueOptions?.delay,
    });

    this.logger.debug(`Email queued: ${job.id} to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
    return { jobId: job.id as string };
  }

  /**
   * Queue a welcome email (async, non-blocking)
   */
  async queueWelcomeEmail(
    userEmail: string,
    userName: string,
    queueOptions?: QueueEmailOptions,
  ): Promise<{ jobId: string }> {
    const jobData: EmailJobData = {
      type: 'welcome',
      to: userEmail,
      subject: 'Bienvenue chez Luneo ! 🎉',
      data: { userName },
      tags: ['welcome', 'onboarding'],
      userId: queueOptions?.userId,
      priority: queueOptions?.priority || 'normal',
    };

    const job = await this.emailQueue.add('send', jobData, {
      priority: this.getPriorityValue(queueOptions?.priority),
      delay: queueOptions?.delay,
    });

    this.logger.debug(`Welcome email queued: ${job.id} to ${userEmail}`);
    return { jobId: job.id as string };
  }

  /**
   * Queue a password reset email (async, non-blocking)
   */
  async queuePasswordResetEmail(
    userEmail: string,
    resetToken: string,
    resetUrl: string,
    queueOptions?: QueueEmailOptions,
  ): Promise<{ jobId: string }> {
    const jobData: EmailJobData = {
      type: 'password-reset',
      to: userEmail,
      subject: 'Réinitialisation de votre mot de passe',
      data: { resetToken, resetUrl },
      tags: ['password-reset', 'security'],
      userId: queueOptions?.userId,
      priority: queueOptions?.priority || 'high', // High priority for security emails
    };

    const job = await this.emailQueue.add('send', jobData, {
      priority: this.getPriorityValue(queueOptions?.priority || 'high'),
      delay: queueOptions?.delay,
    });

    this.logger.debug(`Password reset email queued: ${job.id} to ${userEmail}`);
    return { jobId: job.id as string };
  }

  /**
   * Queue a confirmation email (async, non-blocking)
   */
  async queueConfirmationEmail(
    userEmail: string,
    confirmationToken: string,
    confirmationUrl: string,
    queueOptions?: QueueEmailOptions,
  ): Promise<{ jobId: string }> {
    const jobData: EmailJobData = {
      type: 'confirmation',
      to: userEmail,
      subject: 'Confirmez votre adresse email',
      data: { confirmationToken, confirmationUrl },
      tags: ['email-confirmation', 'onboarding'],
      userId: queueOptions?.userId,
      priority: queueOptions?.priority || 'high', // High priority for signup flow
    };

    const job = await this.emailQueue.add('send', jobData, {
      priority: this.getPriorityValue(queueOptions?.priority || 'high'),
      delay: queueOptions?.delay,
    });

    this.logger.debug(`Confirmation email queued: ${job.id} to ${userEmail}`);
    return { jobId: job.id as string };
  }

  /**
   * Queue multiple emails as a batch (async, non-blocking)
   */
  async queueBatchEmails(
    emails: Array<{
      to: string | string[];
      subject: string;
      html?: string;
      text?: string;
      tags?: string[];
    }>,
    queueOptions?: QueueEmailOptions,
  ): Promise<{ jobId: string }> {
    const jobData = {
      emails: emails.map(email => ({
        type: 'generic' as const,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        tags: email.tags,
      })),
    };

    const job = await this.emailQueue.add('batch', jobData, {
      priority: this.getPriorityValue(queueOptions?.priority),
    });

    this.logger.debug(`Batch email queued: ${job.id} with ${emails.length} emails`);
    return { jobId: job.id as string };
  }

  /**
   * Get queue stats for monitoring
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Convert priority string to numeric value
   */
  private getPriorityValue(priority?: 'low' | 'normal' | 'high'): number {
    switch (priority) {
      case 'high':
        return 1;
      case 'low':
        return 10;
      case 'normal':
      default:
        return 5;
    }
  }
}
