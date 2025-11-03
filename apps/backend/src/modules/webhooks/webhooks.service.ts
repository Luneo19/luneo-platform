import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  async processSendGridEvent(event: any) {
    this.logger.log(`Traitement de l'événement SendGrid: ${event.event} pour ${event.email}`);
    
    // Ici vous pouvez ajouter votre logique métier
    // Par exemple: mise à jour de la base de données, notifications, etc.
    
    return { success: true, event: event.event, email: event.email };
  }

  async logWebhookEvent(event: any) {
    this.logger.debug('Événement webhook loggé:', JSON.stringify(event, null, 2));
  }
}