import crypto from 'crypto';
import { logger } from '@/lib/logger';

/**
 * PODWebhookHandler.ts - Webhook handler for Print-on-Demand services
 * 
 * Handles webhooks from POD services like Printful, Printify, Gelato, etc.
 * Manages order status updates, shipping notifications, and error handling
 */

export interface PODProvider {
  name: 'printful' | 'printify' | 'gelato' | 'gooten' | 'teespring';
  apiKey: string;
  webhookSecret: string;
  enabled: boolean;
}

export interface PODWebhookEvent {
  provider: string;
  eventType: 'order.created' | 'order.updated' | 'order.shipped' | 'order.failed' | 'order.cancelled';
  orderId: string;
  externalOrderId?: string;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingCarrier?: string;
  estimatedDelivery?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface PODWebhookResponse {
  success: boolean;
  message: string;
  orderId?: string;
  error?: string;
}

export class PODWebhookHandler {
  private providers: Map<string, PODProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize POD providers
   */
  private initializeProviders(): void {
    // These would typically come from environment variables or database
    const providers: PODProvider[] = [
      {
        name: 'printful',
        apiKey: process.env.PRINTFUL_API_KEY || '',
        webhookSecret: process.env.PRINTFUL_WEBHOOK_SECRET || '',
        enabled: !!process.env.PRINTFUL_API_KEY
      },
      {
        name: 'printify',
        apiKey: process.env.PRINTIFY_API_KEY || '',
        webhookSecret: process.env.PRINTIFY_WEBHOOK_SECRET || '',
        enabled: !!process.env.PRINTIFY_API_KEY
      },
      {
        name: 'gelato',
        apiKey: process.env.GELATO_API_KEY || '',
        webhookSecret: process.env.GELATO_WEBHOOK_SECRET || '',
        enabled: !!process.env.GELATO_API_KEY
      },
      {
        name: 'gooten',
        apiKey: process.env.GOOTEN_API_KEY || '',
        webhookSecret: process.env.GOOTEN_WEBHOOK_SECRET || '',
        enabled: !!process.env.GOOTEN_API_KEY
      },
      {
        name: 'teespring',
        apiKey: process.env.TEESPRING_API_KEY || '',
        webhookSecret: process.env.TEESPRING_WEBHOOK_SECRET || '',
        enabled: !!process.env.TEESPRING_API_KEY
      }
    ];

    providers.forEach(provider => {
      if (provider.enabled) {
        this.providers.set(provider.name, provider);
      }
    });
  }

  /**
   * Handle incoming webhook
   */
  public async handleWebhook(
    provider: string,
    payload: Record<string, unknown>,
    signature: string
  ): Promise<PODWebhookResponse> {
    try {
      // Verify webhook signature
      const isValid = await this.verifySignature(provider, payload, signature);
      if (!isValid) {
        return {
          success: false,
          message: 'Invalid webhook signature',
          error: 'INVALID_SIGNATURE'
        };
      }

      // Parse webhook event
      const event = this.parseWebhookEvent(provider, payload);
      if (!event) {
        return {
          success: false,
          message: 'Unable to parse webhook event',
          error: 'PARSE_ERROR'
        };
      }

      // Process webhook event
      const result = await this.processWebhookEvent(event);
      
      return {
        success: result.success,
        message: result.message,
        orderId: result.orderId
      };

    } catch (error) {
      logger.error('Webhook handling error', {
        error,
        provider,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        success: false,
        message: 'Webhook processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Verify webhook signature
   */
  private async verifySignature(
    provider: string,
    payload: Record<string, unknown>,
    signature: string
  ): Promise<boolean> {
    const providerConfig = this.providers.get(provider);
    if (!providerConfig) {
      return false;
    }

    switch (provider) {
      case 'printful':
        return this.verifyPrintfulSignature(payload, signature, providerConfig.webhookSecret);
      case 'printify':
        return this.verifyPrintifySignature(payload, signature, providerConfig.webhookSecret);
      case 'gelato':
        return this.verifyGelatoSignature(payload, signature, providerConfig.webhookSecret);
      case 'gooten':
        return this.verifyGootenSignature(payload, signature, providerConfig.webhookSecret);
      case 'teespring':
        return this.verifyTeespringSignature(payload, signature, providerConfig.webhookSecret);
      default:
        return false;
    }
  }

  /**
   * Verify Printful webhook signature
   */
  private async verifyPrintfulSignature(
    payload: Record<string, unknown>,
    signature: string,
    secret: string
  ): Promise<boolean> {
    try {
      const hmac = crypto.createHmac('sha256', secret);
      const calculatedSignature = hmac.update(JSON.stringify(payload)).digest('hex');
      return signature === calculatedSignature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify Printify webhook signature
   */
  private async verifyPrintifySignature(
    payload: Record<string, unknown>,
    signature: string,
    secret: string
  ): Promise<boolean> {
    // Printify uses HMAC SHA256
    return this.verifyPrintfulSignature(payload, signature, secret);
  }

  /**
   * Verify Gelato webhook signature
   */
  private async verifyGelatoSignature(
    payload: Record<string, unknown>,
    signature: string,
    secret: string
  ): Promise<boolean> {
    // Gelato uses custom signature verification
    return this.verifyPrintfulSignature(payload, signature, secret);
  }

  /**
   * Verify Gooten webhook signature
   */
  private async verifyGootenSignature(
    payload: Record<string, unknown>,
    signature: string,
    secret: string
  ): Promise<boolean> {
    return this.verifyPrintfulSignature(payload, signature, secret);
  }

  /**
   * Verify Teespring webhook signature
   */
  private async verifyTeespringSignature(
    payload: Record<string, unknown>,
    signature: string,
    secret: string
  ): Promise<boolean> {
    return this.verifyPrintfulSignature(payload, signature, secret);
  }

  /**
   * Parse webhook event from different providers
   */
  private parseWebhookEvent(provider: string, payload: Record<string, unknown>): PODWebhookEvent | null {
    try {
      switch (provider) {
        case 'printful':
          return this.parsePrintfulEvent(payload);
        case 'printify':
          return this.parsePrintifyEvent(payload);
        case 'gelato':
          return this.parseGelatoEvent(payload);
        case 'gooten':
          return this.parseGootenEvent(payload);
        case 'teespring':
          return this.parseTeespringEvent(payload);
        default:
          return null;
      }
    } catch (error) {
      logger.error('Parse event error', {
        error,
        provider,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Parse Printful webhook event
   */
  private parsePrintfulEvent(payload: Record<string, unknown>): PODWebhookEvent {
    const data = (payload.data as Record<string, unknown>) || {};
    const order = (data.order as Record<string, unknown>) || {};
    const shipment = data.shipment as Record<string, unknown> | undefined;
    return {
      provider: 'printful',
      eventType: this.mapPrintfulEventType((payload.type as string) ?? ''),
      orderId: (order.external_id as string) || '',
      externalOrderId: order.id != null ? String(order.id) : '',
      status: (order.status as string) || '',
      trackingNumber: (shipment?.tracking_number as string) || '',
      trackingUrl: (shipment?.tracking_url as string) || '',
      shippingCarrier: (shipment?.carrier as string) || '',
      estimatedDelivery: (shipment?.estimated_delivery as string) || '',
      metadata: {
        costs: (order.costs as Record<string, unknown>) || {},
        recipient: (order.recipient as Record<string, unknown>) || {},
        items: (order.items as unknown[]) || []
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Map Printful event types
   */
  private mapPrintfulEventType(type: string): PODWebhookEvent['eventType'] {
    const mapping: Record<string, PODWebhookEvent['eventType']> = {
      'package_shipped': 'order.shipped',
      'order_updated': 'order.updated',
      'order_failed': 'order.failed',
      'order_canceled': 'order.cancelled'
    };
    return mapping[type] || 'order.updated';
  }

  /**
   * Parse Printify webhook event
   */
  private parsePrintifyEvent(payload: Record<string, unknown>): PODWebhookEvent {
    const resource = payload.resource as Record<string, unknown> | undefined;
    const shipments = resource?.shipments as Array<Record<string, unknown>> | undefined;
    const firstShipment = shipments?.[0];
    return {
      provider: 'printify',
      eventType: this.mapPrintifyEventType((payload.type as string) ?? ''),
      orderId: (resource?.metadata as Record<string, unknown>)?.external_id as string || '',
      externalOrderId: (resource?.id as string) || '',
      status: (resource?.status as string) || '',
      trackingNumber: (firstShipment?.tracking_number as string) || '',
      trackingUrl: (firstShipment?.tracking_url as string) || '',
      metadata: (resource || {}) as Record<string, unknown>,
      timestamp: (payload.created_at as string) || new Date().toISOString()
    };
  }

  /**
   * Map Printify event types
   */
  private mapPrintifyEventType(type: string): PODWebhookEvent['eventType'] {
    const mapping: Record<string, PODWebhookEvent['eventType']> = {
      'order:shipped': 'order.shipped',
      'order:updated': 'order.updated',
      'order:failed': 'order.failed',
      'order:cancelled': 'order.cancelled'
    };
    return mapping[type] || 'order.updated';
  }

  /**
   * Parse Gelato webhook event
   */
  private parseGelatoEvent(payload: Record<string, unknown>): PODWebhookEvent {
    const order = payload.order as Record<string, unknown> | undefined;
    const shipment = payload.shipment as Record<string, unknown> | undefined;
    return {
      provider: 'gelato',
      eventType: this.mapGelatoEventType((payload.event_type as string) ?? ''),
      orderId: (order?.external_id as string) || '',
      externalOrderId: (order?.id as string) || '',
      status: (order?.status as string) || '',
      trackingNumber: (shipment?.tracking_code as string) || '',
      trackingUrl: (shipment?.tracking_url as string) || '',
      metadata: (payload || {}) as Record<string, unknown>,
      timestamp: (payload.timestamp as string) || new Date().toISOString()
    };
  }

  /**
   * Map Gelato event types
   */
  private mapGelatoEventType(type: string): PODWebhookEvent['eventType'] {
    const mapping: Record<string, PODWebhookEvent['eventType']> = {
      'order.shipped': 'order.shipped',
      'order.updated': 'order.updated',
      'order.failed': 'order.failed',
      'order.cancelled': 'order.cancelled'
    };
    return mapping[type] || 'order.updated';
  }

  /**
   * Parse Gooten webhook event
   */
  private parseGootenEvent(payload: Record<string, unknown>): PODWebhookEvent {
    return {
      provider: 'gooten',
      eventType: 'order.updated',
      orderId: String(payload.PartnerOrderId || ''),
      externalOrderId: String(payload.Id || ''),
      status: String(payload.OrderStatus || ''),
      trackingNumber: String(payload.TrackingNumber || ''),
      metadata: payload || {},
      timestamp: String(payload.CreatedAt || new Date().toISOString())
    };
  }

  /**
   * Parse Teespring webhook event
   */
  private parseTeespringEvent(payload: Record<string, unknown>): PODWebhookEvent {
    const data = payload.data as Record<string, unknown> | undefined;
    return {
      provider: 'teespring',
      eventType: this.mapTeespringEventType((payload.event as string) ?? ''),
      orderId: (data?.external_order_id as string) || '',
      externalOrderId: (data?.id as string) || '',
      status: (data?.status as string) || '',
      trackingNumber: (data?.tracking_number as string) || '',
      metadata: (data || {}) as Record<string, unknown>,
      timestamp: (payload.timestamp as string) || new Date().toISOString()
    };
  }

  /**
   * Map Teespring event types
   */
  private mapTeespringEventType(type: string): PODWebhookEvent['eventType'] {
    const mapping: Record<string, PODWebhookEvent['eventType']> = {
      'order.shipped': 'order.shipped',
      'order.updated': 'order.updated',
      'order.failed': 'order.failed',
      'order.cancelled': 'order.cancelled'
    };
    return mapping[type] || 'order.updated';
  }

  /**
   * Process webhook event
   */
  private async processWebhookEvent(event: PODWebhookEvent): Promise<{
    success: boolean;
    message: string;
    orderId?: string;
  }> {
    try {
      // Update order status in database
      const updated = await this.updateOrderStatus(event);
      
      if (!updated) {
        return {
          success: false,
          message: 'Failed to update order status'
        };
      }

      // Send notification based on event type
      await this.sendNotification(event);

      return {
        success: true,
        message: `Order ${event.orderId} updated successfully`,
        orderId: event.orderId
      };

    } catch (error) {
      logger.error('Process webhook event error', {
        error,
        event,
        message: error instanceof Error ? error.message : 'Processing failed',
      });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Processing failed'
      };
    }
  }

  /**
   * Update order status in database
   */
  private async updateOrderStatus(event: PODWebhookEvent): Promise<boolean> {
    try {
      // This would typically update the database via backend API
      // For now, we'll return true
      logger.info('Updating order status', {
        orderId: event.orderId,
        status: event.status,
        provider: event.provider,
      });
      return true;
    } catch (error) {
      logger.error('Update order status error', {
        error,
        orderId: event.orderId,
        status: event.status,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Send notification based on event type
   */
  private async sendNotification(event: PODWebhookEvent): Promise<void> {
    try {
      switch (event.eventType) {
        case 'order.shipped':
          // Send shipping notification email
          logger.info('Sending shipping notification', {
            orderId: event.orderId,
            trackingNumber: event.trackingNumber,
          });
          break;
        case 'order.failed':
          // Send failure notification
          logger.info('Sending failure notification', {
            orderId: event.orderId,
            error: event.error,
          });
          break;
        case 'order.cancelled':
          // Send cancellation notification
          logger.info('Sending cancellation notification', {
            orderId: event.orderId,
          });
          break;
        default:
          // Send general update notification
          logger.info('Sending update notification', {
            orderId: event.orderId,
            eventType: event.eventType,
          });
      }
    } catch (error) {
      logger.error('Send notification error', {
        error,
        orderId: event.orderId,
        eventType: event.eventType,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get provider status
   */
  public getProviderStatus(providerName: string): {
    enabled: boolean;
    configured: boolean;
  } {
    const provider = this.providers.get(providerName);
    return {
      enabled: !!provider?.enabled,
      configured: !!(provider?.apiKey && provider?.webhookSecret)
    };
  }

  /**
   * Get all enabled providers
   */
  public getEnabledProviders(): string[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.enabled)
      .map(([name]) => name);
  }
}

// Export singleton instance
export const podWebhookHandler = new PODWebhookHandler();

// Export utility functions
export const handlePODWebhook = async (
  provider: string,
  payload: Record<string, unknown>,
  signature: string
): Promise<PODWebhookResponse> => {
  return podWebhookHandler.handleWebhook(provider, payload, signature);
};

export const getProviderStatus = (providerName: string) => {
  return podWebhookHandler.getProviderStatus(providerName);
};

export const getEnabledPODProviders = (): string[] => {
  return podWebhookHandler.getEnabledProviders();
};
