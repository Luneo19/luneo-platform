import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

export interface SendGridEmailOptions {
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
  templateId?: string;
  templateData?: Record<string, any>;
  categories?: string[];
  headers?: Record<string, string>;
  sendAt?: Date;
  batchId?: string;
  asm?: {
    groupId: number;
    groupsToDisplay?: number[];
  };
  ipPoolName?: string;
  mailSettings?: {
    bypassListManagement?: boolean;
    bypassSpamManagement?: boolean;
    bypassBounceManagement?: boolean;
    bypassUnsubscribeManagement?: boolean;
    footer?: {
      enable?: boolean;
      text?: string;
      html?: string;
    };
    sandboxMode?: {
      enable?: boolean;
    };
  };
  trackingSettings?: {
    clickTracking?: {
      enable?: boolean;
      enableText?: boolean;
    };
    openTracking?: {
      enable?: boolean;
      substitutionTag?: string;
    };
    subscriptionTracking?: {
      enable?: boolean;
      text?: string;
      html?: string;
      substitutionTag?: string;
    };
    ganalytics?: {
      enable?: boolean;
      utmSource?: string;
      utmMedium?: string;
      utmTerm?: string;
      utmContent?: string;
      utmCampaign?: string;
    };
  };
}

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);
  private sendgridAvailable = false;
  private defaultFrom: string;

  constructor(private configService: ConfigService) {
    this.initializeSendGrid();
  }

  private initializeSendGrid() {
    const apiKey = this.configService.get<string>('email.sendgridApiKey');
    this.defaultFrom = this.configService.get<string>('email.fromEmail');

    if (!apiKey) {
      this.logger.warn('SendGrid API key not configured. Service will not be available.');
      return;
    }

    try {
      sgMail.setApiKey(apiKey);
      this.sendgridAvailable = true;
      this.logger.log('SendGrid initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize SendGrid:', error);
    }
  }

  /**
   * Envoyer un email simple
   */
  async sendSimpleMessage(options: SendGridEmailOptions): Promise<any> {
    if (!this.sendgridAvailable) {
      throw new Error('SendGrid not initialized. Check your configuration.');
    }

    try {
      const msg: any = {
        to: Array.isArray(options.to) ? options.to : [options.to],
        from: options.from || this.defaultFrom,
        subject: options.subject,
      };

      if (options.text) {
        msg.text = options.text;
      }

      if (options.html) {
        msg.html = options.html;
      }

      if (options.cc) {
        msg.cc = Array.isArray(options.cc) ? options.cc : [options.cc];
      }

      if (options.bcc) {
        msg.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
      }

      if (options.attachments) {
        msg.attachments = options.attachments.map(attachment => ({
          filename: attachment.filename,
          content: attachment.data,
          type: attachment.contentType,
          disposition: 'attachment',
        }));
      }

      if (options.templateId) {
        msg.templateId = options.templateId;
        if (options.templateData) {
          msg.dynamicTemplateData = options.templateData;
        }
      }

      if (options.categories) {
        msg.categories = options.categories;
      }

      if (options.headers) {
        msg.headers = options.headers;
      }

      if (options.sendAt) {
        msg.sendAt = Math.floor(options.sendAt.getTime() / 1000);
      }

      if (options.batchId) {
        msg.batchId = options.batchId;
      }

      if (options.asm) {
        msg.asm = options.asm;
      }

      if (options.ipPoolName) {
        msg.ipPoolName = options.ipPoolName;
      }

      if (options.mailSettings) {
        msg.mailSettings = options.mailSettings;
      }

      if (options.trackingSettings) {
        msg.trackingSettings = options.trackingSettings;
      }

      const result = await sgMail.send(msg);
      
      this.logger.log(`Email sent successfully via SendGrid to ${options.to}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to send email via SendGrid:', error);
      throw error;
    }
  }

  /**
   * Envoyer un email de bienvenue
   */
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<any> {
    return this.sendSimpleMessage({
      to: userEmail,
      subject: 'Bienvenue chez Luneo ! 🎉',
      html: `
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
      `,
      categories: ['welcome', 'onboarding'],
    });
  }

  /**
   * Envoyer un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(userEmail: string, resetToken: string, resetUrl: string): Promise<any> {
    return this.sendSimpleMessage({
      to: userEmail,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
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
      `,
      categories: ['password-reset', 'security'],
    });
  }

  /**
   * Envoyer un email de confirmation
   */
  async sendConfirmationEmail(userEmail: string, confirmationToken: string, confirmationUrl: string): Promise<any> {
    return this.sendSimpleMessage({
      to: userEmail,
      subject: 'Confirmez votre adresse email',
      html: `
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
      `,
      categories: ['email-confirmation', 'onboarding'],
    });
  }

  /**
   * Envoyer un email avec template SendGrid
   */
  async sendTemplateEmail(
    userEmail: string, 
    templateId: string, 
    templateData: Record<string, any>,
    subject?: string
  ): Promise<any> {
    return this.sendSimpleMessage({
      to: userEmail,
      subject: subject || 'Email de Luneo',
      templateId,
      templateData,
      categories: ['template'],
    });
  }

  /**
   * Envoyer un email avec pièces jointes
   */
  async sendEmailWithAttachments(
    userEmail: string,
    subject: string,
    html: string,
    attachments: Array<{
      filename: string;
      data: Buffer | string;
      contentType?: string;
    }>
  ): Promise<any> {
    return this.sendSimpleMessage({
      to: userEmail,
      subject,
      html,
      attachments,
      categories: ['attachment'],
    });
  }

  /**
   * Envoyer un email programmé
   */
  async sendScheduledEmail(
    userEmail: string,
    subject: string,
    html: string,
    sendAt: Date
  ): Promise<any> {
    return this.sendSimpleMessage({
      to: userEmail,
      subject,
      html,
      sendAt,
      categories: ['scheduled'],
    });
  }

  /**
   * Envoyer un email avec tracking personnalisé
   */
  async sendEmailWithTracking(
    userEmail: string,
    subject: string,
    html: string,
    trackingSettings?: {
      clickTracking?: boolean;
      openTracking?: boolean;
      subscriptionTracking?: boolean;
    }
  ): Promise<any> {
    const msg: SendGridEmailOptions = {
      to: userEmail,
      subject,
      html,
      categories: ['tracking'],
    };

    if (trackingSettings) {
      msg.trackingSettings = {
        clickTracking: {
          enable: trackingSettings.clickTracking ?? true,
          enableText: true,
        },
        openTracking: {
          enable: trackingSettings.openTracking ?? true,
        },
        subscriptionTracking: {
          enable: trackingSettings.subscriptionTracking ?? true,
        },
      };
    }

    return this.sendSimpleMessage(msg);
  }

  /**
   * Vérifier si le service est disponible
   */
  isAvailable(): boolean {
    return this.sendgridAvailable;
  }

  /**
   * Obtenir les statistiques SendGrid (nécessite une clé API avec permissions)
   */
  async getStats(startDate?: Date, endDate?: Date): Promise<any> {
    if (!this.sendgridAvailable) {
      throw new Error('SendGrid not initialized');
    }

    try {
      // Note: Cette fonction nécessite une implémentation spécifique
      // car SendGrid a une API séparée pour les statistiques
      this.logger.log('SendGrid stats feature requires additional implementation');
      return {
        message: 'SendGrid stats feature requires additional implementation',
        available: this.sendgridAvailable,
      };
    } catch (error) {
      this.logger.error('Failed to get SendGrid stats:', error);
      throw error;
    }
  }

  /**
   * Valider une adresse email
   */
  async validateEmail(email: string): Promise<boolean> {
    // Validation basique d'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Obtenir la configuration actuelle
   */
  getConfig(): { available: boolean; defaultFrom: string } {
    return {
      available: this.sendgridAvailable,
      defaultFrom: this.defaultFrom,
    };
  }
}
