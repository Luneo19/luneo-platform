import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { withTimeout, DEFAULT_TIMEOUTS, TimeoutError } from '@/libs/resilience/timeout.util';

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
    this.defaultFrom = this.configService.get<string>('email.fromEmail') ?? '';

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
  async sendSimpleMessage(options: SendGridEmailOptions): Promise<unknown> {
    if (!this.sendgridAvailable) {
      throw new InternalServerErrorException('SendGrid not initialized. Check your configuration.');
    }

    try {
      const msg: Record<string, unknown> = {
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

      // TIMEOUT-01: Timeout de 30s pour l'envoi d'email
      const result = await withTimeout(
        sgMail.send(msg as unknown as import('@sendgrid/mail').MailDataRequired),
        DEFAULT_TIMEOUTS.SENDGRID_SEND,
        'SendGrid.send',
      );
      
      this.logger.log(`Email sent successfully via SendGrid to ${options.to}`);
      return result;
    } catch (error) {
      if (error instanceof TimeoutError) {
        this.logger.error(`SendGrid email timed out after ${DEFAULT_TIMEOUTS.SENDGRID_SEND}ms`);
      }
      this.logger.error('Failed to send email via SendGrid:', error);
      throw error;
    }
  }

  /**
   * Envoyer un email de bienvenue
   * Utilise le template SendGrid si configuré, sinon HTML inline
   */
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<unknown> {
    const templateId = this.configService.get<string>('emailDomain.emailTemplates.welcome');
    
    // Si un template ID est configuré et n'est pas le placeholder, utiliser le template
    if (templateId && templateId !== 'd-welcome-template-id' && templateId.startsWith('d-')) {
      return this.sendTemplateEmail(
        userEmail,
        templateId,
        {
          userName,
          welcomeMessage: `Bienvenue ${userName} !`,
          nextSteps: [
            'Complétez votre profil',
            'Explorez nos fonctionnalités',
            'Créez votre premier design',
          ],
        },
        'Bienvenue chez Luneo ! 🎉'
      );
    }
    
    // Fallback vers HTML inline si template non configuré
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
  async sendPasswordResetEmail(userEmail: string, resetToken: string, resetUrl: string): Promise<unknown> {
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
  async sendConfirmationEmail(userEmail: string, confirmationToken: string, confirmationUrl: string): Promise<unknown> {
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
    templateData: Record<string, unknown>,
    subject?: string
  ): Promise<unknown> {
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
  ): Promise<unknown> {
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
  ): Promise<unknown> {
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
  ): Promise<unknown> {
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
  async getStats(startDate?: Date, endDate?: Date): Promise<unknown> {
    if (!this.sendgridAvailable) {
      throw new InternalServerErrorException('SendGrid not initialized');
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
   * Envoyer un email de confirmation de commande
   * Utilise le template SendGrid Order Confirmation si configuré, sinon HTML inline
   */
  async sendOrderConfirmationEmail(
    userEmail: string,
    orderData: {
      orderId: string;
      orderNumber: string;
      totalAmount: number;
      currency: string;
      items: Array<{
        name: string;
        quantity: number;
        price: number;
      }>;
      shippingAddress?: string;
      estimatedDelivery?: string;
    }
  ): Promise<unknown> {
    const templateId = this.configService.get<string>('emailDomain.emailTemplates.orderConfirmation');
    
    // Si un template ID est configuré et n'est pas le placeholder, utiliser le template
    if (templateId && templateId !== 'd-order-confirmation-template-id' && templateId.startsWith('d-')) {
      return this.sendTemplateEmail(
        userEmail,
        templateId,
        {
          orderId: orderData.orderId,
          orderNumber: orderData.orderNumber,
          totalAmount: orderData.totalAmount.toFixed(2),
          currency: orderData.currency,
          items: orderData.items,
          shippingAddress: orderData.shippingAddress || 'Non spécifié',
          estimatedDelivery: orderData.estimatedDelivery || 'Sous peu',
          orderDate: new Date().toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        },
        `Confirmation de commande #${orderData.orderNumber}`
      );
    }
    
    // Fallback vers HTML inline si template non configuré
    const itemsHtml = orderData.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">${item.price.toFixed(2)} ${orderData.currency}</td>
      </tr>
    `).join('');
    
    return this.sendSimpleMessage({
      to: userEmail,
      subject: `Confirmation de commande #${orderData.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Confirmation de commande</h1>
          <p>Merci pour votre commande !</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Numéro de commande:</strong> #${orderData.orderNumber}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
            <p><strong>Total:</strong> ${orderData.totalAmount.toFixed(2)} ${orderData.currency}</p>
          </div>
          <h3>Articles commandés:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Article</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Quantité</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Prix</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          ${orderData.shippingAddress ? `<p><strong>Adresse de livraison:</strong> ${orderData.shippingAddress}</p>` : ''}
          ${orderData.estimatedDelivery ? `<p><strong>Livraison estimée:</strong> ${orderData.estimatedDelivery}</p>` : ''}
          <p>Cordialement,<br>L'équipe Luneo</p>
        </div>
      `,
      categories: ['order', 'confirmation'],
    });
  }

  /**
   * Envoyer un email de production prête
   * Utilise le template SendGrid Production Ready si configuré, sinon HTML inline
   */
  async sendProductionReadyEmail(
    userEmail: string,
    productionData: {
      orderId: string;
      orderNumber: string;
      productName: string;
      downloadLinks: Array<{
        name: string;
        url: string;
        format: string;
        size?: string;
      }>;
      previewImageUrl?: string;
    }
  ): Promise<unknown> {
    const templateId = this.configService.get<string>('emailDomain.emailTemplates.productionReady');
    
    // Si un template ID est configuré et n'est pas le placeholder, utiliser le template
    if (templateId && templateId !== 'd-production-ready-template-id' && templateId.startsWith('d-')) {
      return this.sendTemplateEmail(
        userEmail,
        templateId,
        {
          orderId: productionData.orderId,
          orderNumber: productionData.orderNumber,
          productName: productionData.productName,
          downloadLinks: productionData.downloadLinks,
          previewImageUrl: productionData.previewImageUrl || '',
          productionDate: new Date().toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        },
        `Votre commande #${productionData.orderNumber} est prête !`
      );
    }
    
    // Fallback vers HTML inline si template non configuré
    const linksHtml = productionData.downloadLinks.map(link => `
      <div style="margin: 10px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
        <p><strong>${link.name}</strong> (${link.format})${link.size ? ` - ${link.size}` : ''}</p>
        <a href="${link.url}" 
           style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
          Télécharger
        </a>
      </div>
    `).join('');
    
    return this.sendSimpleMessage({
      to: userEmail,
      subject: `Votre commande #${productionData.orderNumber} est prête !`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #28a745;">🎉 Votre commande est prête !</h1>
          <p>Votre commande <strong>#${productionData.orderNumber}</strong> pour <strong>${productionData.productName}</strong> est maintenant prête à être téléchargée.</p>
          ${productionData.previewImageUrl ? `<img src="${productionData.previewImageUrl}" alt="Aperçu" style="max-width: 100%; margin: 20px 0; border-radius: 5px;">` : ''}
          <h3>Fichiers disponibles:</h3>
          ${linksHtml}
          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            Les liens de téléchargement sont valides pendant 30 jours.
          </p>
          <p>Cordialement,<br>L'équipe Luneo</p>
        </div>
      `,
      categories: ['production', 'ready'],
    });
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
