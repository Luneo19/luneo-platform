import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger, BadRequestException, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

// NOTE: The Stripe webhook is consolidated in BillingController at /api/v1/billing/webhook
// Only SendGrid and other non-Stripe webhooks remain here.

export interface SendGridWebhookEvent {
  email: string;
  timestamp: number;
  event: string;
  reason?: string;
  'smtp-id'?: string;
  sg_event_id?: string;
  sg_message_id?: string;
  response?: string;
  attempt?: string;
  useragent?: string;
  ip?: string;
  url?: string;
  category?: string[];
  unique_args?: Record<string, any>;
  marketing_campaign_id?: string;
  marketing_campaign_name?: string;
}

@ApiTags('webhooks')
@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhooksService: WebhooksService,
  ) {}

  @Post('sendgrid')
  @HttpCode(HttpStatus.OK)
  async handleSendGridWebhook(
    @Body() events: SendGridWebhookEvent[],
    @Headers() headers: Record<string, string>
  ) {
    this.logger.log('📧 Webhook SendGrid reçu');
    this.logger.log(`Nombre d'événements: ${events.length}`);
    
    // Log des headers pour debug
    this.logger.debug('Headers reçus:', {
      'user-agent': headers['user-agent'],
      'content-type': headers['content-type'],
      'content-length': headers['content-length']
    });

    try {
      // Traiter chaque événement
      for (const event of events) {
        await this.processSendGridEvent(event);
      }

      // Log du payload complet pour debug
      this.logger.debug('Payload SendGrid reçu:', JSON.stringify(events, null, 2));

      return { status: 'success', message: 'Webhook traité avec succès', events_processed: events.length };
    } catch (error) {
      this.logger.error('Erreur lors du traitement du webhook SendGrid:', error);
      throw error;
    }
  }

  private async processSendGridEvent(event: SendGridWebhookEvent) {
    const { email, event: eventType, timestamp, reason, 'smtp-id': smtpId } = event;
    
    this.logger.log(`📊 Événement SendGrid: ${eventType} pour ${email}`);
    
    switch (eventType) {
      case 'delivered':
        await this.handleDeliveredEvent(event);
        break;
      case 'bounce':
        await this.handleBounceEvent(event);
        break;
      case 'dropped':
        await this.handleDroppedEvent(event);
        break;
      case 'spam_report':
        await this.handleSpamReportEvent(event);
        break;
      case 'unsubscribe':
        await this.handleUnsubscribeEvent(event);
        break;
      case 'group_unsubscribe':
        await this.handleGroupUnsubscribeEvent(event);
        break;
      case 'processed':
        await this.handleProcessedEvent(event);
        break;
      case 'deferred':
        await this.handleDeferredEvent(event);
        break;
      default:
        this.logger.warn(`Événement SendGrid non géré: ${eventType}`);
    }
  }

  private async handleDeliveredEvent(event: SendGridWebhookEvent) {
    this.logger.log(`✅ Email livré: ${event.email} (${event['smtp-id']})`);
    // Ici vous pouvez mettre à jour votre base de données
    // Par exemple: marquer l'email comme livré
  }

  private async handleBounceEvent(event: SendGridWebhookEvent) {
    this.logger.warn(`❌ Email en bounce: ${event.email} - Raison: ${event.reason}`);
    // Ici vous pouvez:
    // - Marquer l'email comme invalide
    // - Notifier l'équipe
    // - Mettre à jour la liste de suppression
  }

  private async handleDroppedEvent(event: SendGridWebhookEvent) {
    this.logger.warn(`🚫 Email supprimé: ${event.email} - Raison: ${event.reason}`);
    // Ici vous pouvez:
    // - Analyser pourquoi l'email a été supprimé
    // - Mettre à jour vos listes de suppression
  }

  private async handleSpamReportEvent(event: SendGridWebhookEvent) {
    this.logger.warn(`🚨 Email marqué comme spam: ${event.email}`);
    // Ici vous pouvez:
    // - Ajouter l'email à la liste de suppression
    // - Analyser le contenu de l'email
    // - Notifier l'équipe marketing
  }

  private async handleUnsubscribeEvent(event: SendGridWebhookEvent) {
    this.logger.log(`📤 Désabonnement: ${event.email}`);
    // Ici vous pouvez:
    // - Mettre à jour les préférences utilisateur
    // - Marquer comme désabonné dans votre DB
  }

  private async handleGroupUnsubscribeEvent(event: SendGridWebhookEvent) {
    this.logger.log(`📤 Désabonnement groupe: ${event.email}`);
    // Ici vous pouvez:
    // - Mettre à jour les préférences de groupe
  }

  private async handleProcessedEvent(event: SendGridWebhookEvent) {
    this.logger.log(`⚙️ Email traité: ${event.email}`);
    // Ici vous pouvez:
    // - Marquer comme en cours de traitement
  }

  private async handleDeferredEvent(event: SendGridWebhookEvent) {
    this.logger.log(`⏳ Email différé: ${event.email} - Raison: ${event.reason}`);
    // Ici vous pouvez:
    // - Marquer pour retry
    // - Surveiller les tentatives
  }
}