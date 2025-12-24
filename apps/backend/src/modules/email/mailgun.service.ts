import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';

export interface MailgunEmailOptions {
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
  templateData?: Record<string, any>;
  tags?: string[];
  headers?: Record<string, string>;
}

@Injectable()
export class MailgunService {
  private readonly logger = new Logger(MailgunService.name);
  private mailgun: any;
  private domain: string;
  private defaultFrom: string;

  constructor(private configService: ConfigService) {
    this.initializeMailgun();
  }

  private initializeMailgun() {
    const apiKey = this.configService.get<string>('email.mailgunApiKey');
    const domain = this.configService.get<string>('email.mailgunDomain');
    const _url = this.configService.get<string>('email.mailgunUrl');
    this.defaultFrom = this.configService.get<string>('email.fromEmail') || 'noreply@luneo.app';

    if (!apiKey || !domain) {
      this.logger.warn('Mailgun configuration incomplete. Service will not be available.');
      return;
    }

    try {
      this.mailgun = new Mailgun(FormData);
      this.domain = domain;
      
      this.logger.log(`Mailgun initialized for domain: ${domain}`);
    } catch (error) {
      this.logger.error('Failed to initialize Mailgun:', error);
    }
  }

  /**
   * Envoyer un email simple
   */
  async sendSimpleMessage(options: MailgunEmailOptions): Promise<any> {
    if (!this.mailgun) {
      throw new Error('Mailgun not initialized. Check your configuration.');
    }

    try {
      const mg = this.mailgun.client({
        username: 'api',
        key: this.configService.get<string>('email.mailgunApiKey'),
        url: this.configService.get<string>('email.mailgunUrl'),
      });

      const messageData: any = {
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
      };

      if (options.text) {
        messageData.text = options.text;
      }

      if (options.html) {
        messageData.html = options.html;
      }

      if (options.cc) {
        messageData.cc = Array.isArray(options.cc) ? options.cc : [options.cc];
      }

      if (options.bcc) {
        messageData.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
      }

      if (options.tags) {
        messageData['o:tag'] = options.tags;
      }

      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          messageData[`h:${key}`] = value;
        });
      }

      // Gestion des pièces jointes
      if (options.attachments && options.attachments.length > 0) {
        options.attachments.forEach((attachment, index) => {
          messageData[`attachment[${index}]`] = attachment.data;
          if (attachment.filename) {
            messageData[`attachment[${index}].filename`] = attachment.filename;
          }
          if (attachment.contentType) {
            messageData[`attachment[${index}].content-type`] = attachment.contentType;
          }
        });
      }

      // Gestion des templates
      if (options.template) {
        messageData.template = options.template;
        if (options.templateData) {
          Object.entries(options.templateData).forEach(([key, value]) => {
            messageData[`v:${key}`] = value;
          });
        }
      }

      const result = await mg.messages.create(this.domain, messageData);
      
      this.logger.log(`Email sent successfully to ${options.to}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to send email:', error);
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
      tags: ['welcome', 'onboarding'],
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
      tags: ['password-reset', 'security'],
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
      tags: ['email-confirmation', 'onboarding'],
    });
  }

  /**
   * Envoyer un email de notification
   */
  async sendNotificationEmail(userEmail: string, title: string, message: string, actionUrl?: string, actionText?: string): Promise<any> {
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">${title}</h1>
        <p>${message}</p>
    `;

    if (actionUrl && actionText) {
      html += `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            ${actionText}
          </a>
        </div>
      `;
    }

    html += `
        <p>Cordialement,<br>L'équipe Luneo</p>
      </div>
    `;

    return this.sendSimpleMessage({
      to: userEmail,
      subject: title,
      html,
      tags: ['notification'],
    });
  }

  /**
   * Vérifier si le service est disponible
   */
  isAvailable(): boolean {
    return !!this.mailgun;
  }

  /**
   * Obtenir les statistiques d'envoi
   */
  async getStats(): Promise<any> {
    if (!this.mailgun) {
      throw new Error('Mailgun not initialized');
    }

    try {
      const mg = this.mailgun.client({
        username: 'api',
        key: this.configService.get<string>('email.mailgunApiKey'),
        url: this.configService.get<string>('email.mailgunUrl'),
      });

      const stats = await mg.stats.get(this.domain, {});
      return stats;
    } catch (error) {
      this.logger.error('Failed to get Mailgun stats:', error);
      throw error;
    }
  }
}
