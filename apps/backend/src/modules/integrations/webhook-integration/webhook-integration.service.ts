import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class WebhookIntegrationService {
  private readonly logger = new Logger(WebhookIntegrationService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Test webhook endpoint
   */
  async testEndpoint(config: Record<string, any>): Promise<{ success: boolean; message: string }> {
    try {
      if (!config.url) {
        return {
          success: false,
          message: 'Webhook URL is required',
        };
      }

      const testPayload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Test webhook from Luneo Enterprise',
          status: 'success',
        },
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Luneo-Webhook/1.0',
        'X-Luneo-Event': 'webhook.test',
      };

      if (config.secret) {
        headers['X-Luneo-Signature'] = this.generateSignature(
          JSON.stringify(testPayload),
          config.secret,
        );
      }

      const response = await firstValueFrom(
        this.httpService.post(config.url, testPayload, {
          headers,
          timeout: 5000,
        }),
      );

      return {
        success: response.status >= 200 && response.status < 300,
        message: `Webhook endpoint responded with status ${response.status}`,
      };
    } catch (error) {
      this.logger.error('Webhook test failed:', error);
      return {
        success: false,
        message: error.response?.status 
          ? `Endpoint returned ${error.response.status}`
          : error.message || 'Failed to connect to webhook endpoint',
      };
    }
  }

  /**
   * Send webhook
   */
  async sendWebhook(
    config: Record<string, any>,
    event: string,
    data: Record<string, any>,
  ): Promise<void> {
    try {
      if (!config.url || !config.enabled) {
        return;
      }

      const payload = {
        event,
        timestamp: new Date().toISOString(),
        data,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Luneo-Webhook/1.0',
        'X-Luneo-Event': event,
      };

      if (config.secret) {
        headers['X-Luneo-Signature'] = this.generateSignature(
          JSON.stringify(payload),
          config.secret,
        );
      }

      await firstValueFrom(
        this.httpService.post(config.url, payload, {
          headers,
          timeout: 10000,
        }),
      );

      this.logger.log(`Webhook sent successfully for event: ${event}`);
    } catch (error) {
      this.logger.error(`Failed to send webhook for event ${event}:`, error);
      
      // In a production environment, you might want to:
      // 1. Retry with exponential backoff
      // 2. Store failed webhooks for later retry
      // 3. Alert administrators
      throw error;
    }
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
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = this.generateSignature(payload, secret);
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch (error) {
      this.logger.error('Signature verification failed:', error);
      return false;
    }
  }

  /**
   * Get webhook delivery statistics
   */
  async getDeliveryStats(brandId: string): Promise<{
    total: number;
    successful: number;
    failed: number;
    successRate: number;
  }> {
    // In a real implementation, this would query webhook delivery logs
    // For now, return mock data
    return {
      total: 0,
      successful: 0,
      failed: 0,
      successRate: 0,
    };
  }
}



