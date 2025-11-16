import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Test Slack connection
   */
  async testConnection(config: Record<string, any>): Promise<{ success: boolean; message: string }> {
    try {
      if (!config.webhookUrl) {
        return {
          success: false,
          message: 'Slack webhook URL is required',
        };
      }

      const response = await firstValueFrom(
        this.httpService.post(config.webhookUrl, {
          text: '🎉 Luneo Enterprise - Test de connexion Slack réussi !',
          attachments: [{
            color: '#4CAF50',
            title: 'Test de Connexion',
            text: 'Votre intégration Slack est correctement configurée.',
            footer: 'Luneo Enterprise',
            ts: Math.floor(Date.now() / 1000),
          }],
        }),
      );

      return {
        success: response.status === 200,
        message: 'Slack connection successful',
      };
    } catch (error) {
      this.logger.error('Slack test failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to connect to Slack',
      };
    }
  }

  /**
   * Send message to Slack
   */
  async sendMessage(
    config: Record<string, any>,
    event: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      if (!config.webhookUrl || !config.enabled) {
        return;
      }

      const message = this.formatMessage(event, data);

      await firstValueFrom(
        this.httpService.post(config.webhookUrl, message, {
          timeout: 5000,
        }),
      );

      this.logger.log(`Slack notification sent for event: ${event}`);
    } catch (error) {
      this.logger.error(`Failed to send Slack message for event ${event}:`, error);
      throw error;
    }
  }

  /**
   * Format message for Slack
   */
  private formatMessage(event: string, data: Record<string, any>): any {
    const eventConfig: Record<string, { color: string; title: string; emoji: string }> = {
      'design.created': {
        color: '#2196F3',
        title: '🎨 Nouveau Design Créé',
        emoji: ':art:',
      },
      'design.completed': {
        color: '#4CAF50',
        title: '✅ Design Terminé',
        emoji: ':white_check_mark:',
      },
      'order.created': {
        color: '#FF9800',
        title: '🛒 Nouvelle Commande',
        emoji: ':shopping_cart:',
      },
      'order.paid': {
        color: '#4CAF50',
        title: '💰 Paiement Reçu',
        emoji: ':moneybag:',
      },
      'quota.alert': {
        color: '#FFA000',
        title: '⚠️ Alerte Quota',
        emoji: ':warning:',
      },
    };

    const config = eventConfig[event] || {
      color: '#9E9E9E',
      title: `📢 ${event}`,
      emoji: ':bell:',
    };

    const severityColorMap: Record<string, string> = {
      critical: '#EF5350',
      warning: '#FFB300',
      info: '#42A5F5',
    };

    const severity = typeof data.severity === 'string' ? data.severity.toLowerCase() : '';
    const attachmentColor = severityColorMap[severity] ?? config.color;

    return {
      text: `${config.emoji} ${config.title}`,
      attachments: [{
        color: attachmentColor,
        title: config.title,
        fields: Object.entries(data).map(([key, value]) => ({
          title: this.formatFieldName(key),
          value: String(value),
          short: true,
        })),
        footer: 'Luneo Enterprise',
        ts: Math.floor(Date.now() / 1000),
      }],
    };
  }

  private formatFieldName(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}



