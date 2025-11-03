import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class ZapierService {
  private readonly logger = new Logger(ZapierService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Test Zapier webhook
   */
  async testWebhook(config: Record<string, any>): Promise<{ success: boolean; message: string }> {
    try {
      if (!config.webhookUrl) {
        return {
          success: false,
          message: 'Zapier webhook URL is required',
        };
      }

      const testPayload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Test de connexion Zapier depuis Luneo Enterprise',
          status: 'success',
        },
      };

      const response = await firstValueFrom(
        this.httpService.post(config.webhookUrl, testPayload, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Luneo-Zapier/1.0',
          },
          timeout: 5000,
        }),
      );

      return {
        success: response.status === 200,
        message: 'Zapier webhook connection successful',
      };
    } catch (error) {
      this.logger.error('Zapier test failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to connect to Zapier',
      };
    }
  }

  /**
   * Trigger Zapier Zap
   */
  async triggerZap(
    config: Record<string, any>,
    event: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      if (!config.webhookUrl || !config.enabled) {
        return;
      }

      const payload = {
        event,
        timestamp: new Date().toISOString(),
        data: this.transformDataForZapier(event, data),
      };

      // Add signature if secret is configured
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Luneo-Zapier/1.0',
      };

      if (config.secret) {
        headers['X-Luneo-Signature'] = this.generateSignature(
          JSON.stringify(payload),
          config.secret,
        );
      }

      await firstValueFrom(
        this.httpService.post(config.webhookUrl, payload, {
          headers,
          timeout: 10000,
        }),
      );

      this.logger.log(`Zapier zap triggered for event: ${event}`);
    } catch (error) {
      this.logger.error(`Failed to trigger Zapier zap for event ${event}:`, error);
      throw error;
    }
  }

  /**
   * Transform data for Zapier format
   */
  private transformDataForZapier(event: string, data: Record<string, any>): Record<string, any> {
    // Zapier prefers flat structures
    const flatData: Record<string, any> = {};
    
    const flatten = (obj: any, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}_${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flatten(value, newKey);
        } else {
          flatData[newKey] = value;
        }
      }
    };

    flatten(data);
    return flatData;
  }

  /**
   * Generate HMAC signature for webhook verification
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Register Zapier triggers
   */
  async getAvailableTriggers(): Promise<Array<{
    key: string;
    name: string;
    description: string;
  }>> {
    return [
      {
        key: 'design.created',
        name: 'Nouveau Design Créé',
        description: 'Déclenché lorsqu\'un nouveau design est créé',
      },
      {
        key: 'design.completed',
        name: 'Design Terminé',
        description: 'Déclenché lorsqu\'un design est complété par l\'IA',
      },
      {
        key: 'order.created',
        name: 'Nouvelle Commande',
        description: 'Déclenché lorsqu\'une nouvelle commande est créée',
      },
      {
        key: 'order.paid',
        name: 'Paiement Reçu',
        description: 'Déclenché lorsqu\'un paiement est confirmé',
      },
      {
        key: 'user.registered',
        name: 'Nouvel Utilisateur',
        description: 'Déclenché lors de l\'inscription d\'un nouvel utilisateur',
      },
    ];
  }
}



