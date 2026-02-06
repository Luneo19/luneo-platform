import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SMTPEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  headers?: Record<string, string>;
  priority?: 'high' | 'normal' | 'low';
}

@Injectable()
export class SMTPService {
  private readonly logger = new Logger(SMTPService.name);
  private transporter: nodemailer.Transporter;
  private smtpAvailable = false;
  private defaultFrom: string;
  private defaultReplyTo: string;

  constructor(private configService: ConfigService) {
    this.initializeSMTP();
  }

  private initializeSMTP() {
    const sendgridApiKey = this.configService.get<string>('email.sendgridApiKey');
    const smtpHost = this.configService.get<string>('emailDomain.smtpHost');
    const smtpPort = this.configService.get<number>('emailDomain.smtpPort');
    const smtpSecure = this.configService.get<boolean>('emailDomain.smtpSecure');
    
    this.defaultFrom = this.configService.get<string>('emailDomain.smtpFrom');
    this.defaultReplyTo = this.configService.get<string>('emailDomain.sendgridReplyTo');

    if (!sendgridApiKey) {
      this.logger.warn('SendGrid API key not configured. SMTP service will not be available.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: 'apikey', // Always 'apikey' for SendGrid
          pass: sendgridApiKey,
        },
        // Additional options for better deliverability
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        rateLimit: 14, // SendGrid allows 14 emails per second
        rateDelta: 1000, // Per second
      });

      this.smtpAvailable = true;
      this.logger.log(`SMTP service initialized with ${smtpHost}:${smtpPort}`);
    } catch (error) {
      this.logger.error('Failed to initialize SMTP service:', error);
    }
  }

  /**
   * Envoyer un email via SMTP
   */
  async sendEmail(options: SMTPEmailOptions): Promise<any> {
    if (!this.smtpAvailable) {
      throw new InternalServerErrorException('SMTP service not initialized. Check your configuration.');
    }

    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo || this.defaultReplyTo,
      };

      if (options.cc) {
        mailOptions.cc = Array.isArray(options.cc) ? options.cc.join(', ') : options.cc;
      }

      if (options.bcc) {
        mailOptions.bcc = Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc;
      }

      if (options.attachments) {
        mailOptions.attachments = options.attachments.map(attachment => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType,
        }));
      }

      if (options.headers) {
        mailOptions.headers = options.headers;
      }

      if (options.priority) {
        mailOptions.priority = options.priority;
      }

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Email sent successfully via SMTP to ${options.to}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to send email via SMTP:', error);
      throw error;
    }
  }

  /**
   * Envoyer un email de bienvenue
   */
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<any> {
    return this.sendEmail({
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
      priority: 'high',
    });
  }

  /**
   * Envoyer un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(userEmail: string, resetToken: string, resetUrl: string): Promise<any> {
    return this.sendEmail({
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
      priority: 'high',
    });
  }

  /**
   * Envoyer un email de confirmation
   */
  async sendConfirmationEmail(userEmail: string, confirmationToken: string, confirmationUrl: string): Promise<any> {
    return this.sendEmail({
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
      priority: 'high',
    });
  }

  /**
   * Envoyer un email de facture
   */
  async sendInvoiceEmail(userEmail: string, invoiceData: {
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    downloadUrl: string;
  }): Promise<any> {
    return this.sendEmail({
      to: userEmail,
      subject: `Facture #${invoiceData.invoiceNumber} - Luneo`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Facture #${invoiceData.invoiceNumber}</h1>
          <p>Votre facture est prête !</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>Détails de la facture :</h3>
            <ul>
              <li><strong>Numéro :</strong> ${invoiceData.invoiceNumber}</li>
              <li><strong>Montant :</strong> ${invoiceData.amount}</li>
              <li><strong>Date d'échéance :</strong> ${invoiceData.dueDate}</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invoiceData.downloadUrl}" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Télécharger la facture
            </a>
          </div>
          <p>Cordialement,<br>L'équipe Luneo</p>
        </div>
      `,
      priority: 'normal',
    });
  }

  /**
   * Envoyer un email de newsletter
   */
  async sendNewsletterEmail(userEmail: string, newsletterData: {
    title: string;
    content: string;
    unsubscribeUrl: string;
  }): Promise<any> {
    return this.sendEmail({
      to: userEmail,
      subject: newsletterData.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">${newsletterData.title}</h1>
          <div style="margin: 20px 0;">
            ${newsletterData.content}
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            <a href="${newsletterData.unsubscribeUrl}" style="color: #666;">Se désabonner</a>
          </p>
          <p>Cordialement,<br>L'équipe Luneo</p>
        </div>
      `,
      priority: 'low',
    });
  }

  /**
   * Vérifier la connexion SMTP
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.smtpAvailable) {
      return false;
    }

    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error('SMTP connection verification failed:', error);
      return false;
    }
  }

  /**
   * Vérifier si le service est disponible
   */
  isAvailable(): boolean {
    return this.smtpAvailable;
  }

  /**
   * Obtenir la configuration actuelle
   */
  getConfig(): { available: boolean; defaultFrom: string; defaultReplyTo: string } {
    return {
      available: this.smtpAvailable,
      defaultFrom: this.defaultFrom,
      defaultReplyTo: this.defaultReplyTo,
    };
  }
}
