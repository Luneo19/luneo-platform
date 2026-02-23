/**
 * @fileoverview Agent Tool pour rechercher le statut d'une commande Shopify
 * @module ShopifyOrderTool
 */

import { Injectable, Logger } from '@nestjs/common';
import { ShopifyIntegrationService } from '@/modules/integrations/shopify/shopify-integration.service';

export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<
    string,
    { type: string; description: string; required?: boolean }
  >;
  execute: (
    params: Record<string, unknown>,
    context: { organizationId: string },
  ) => Promise<string>;
}

@Injectable()
export class ShopifyOrderTool implements AgentTool {
  name = 'get_order_status';
  description =
    "Recherche le statut d'une commande Shopify par son numero";
  parameters = {
    orderNumber: {
      type: 'string',
      description: 'Le numero de commande (ex: 1001)',
      required: true,
    },
  };

  private readonly logger = new Logger(ShopifyOrderTool.name);

  constructor(
    private readonly shopifyService: ShopifyIntegrationService,
  ) {}

  async execute(
    params: Record<string, unknown>,
    context: { organizationId: string },
  ): Promise<string> {
    try {
      const orderNumber = String(params.orderNumber ?? '');
      if (!orderNumber) {
        return 'Veuillez fournir un numero de commande.';
      }

      const order = await this.shopifyService.getOrderStatus(
        context.organizationId,
        orderNumber,
      );

      return [
        `Commande #${order.orderNumber}:`,
        `- Statut: ${order.status}`,
        `- Livraison: ${order.fulfillmentStatus}`,
        `- Paiement: ${order.financialStatus}`,
        `- Total: ${order.totalPrice} ${order.currency}`,
        order.trackingNumber ? `- Tracking: ${order.trackingNumber}` : '',
        order.trackingUrl ? `- Lien suivi: ${order.trackingUrl}` : '',
        `- Articles:`,
        ...order.lineItems.map(
          (item) => `  * ${item.title} x${item.quantity} (${item.price})`,
        ),
      ]
        .filter(Boolean)
        .join('\n');
    } catch (error: unknown) {
      const orderNumber = String(params.orderNumber ?? '');
      this.logger.warn(`Order lookup failed for #${orderNumber}`, error);
      return `Impossible de trouver la commande #${orderNumber}. Verifiez le numero.`;
    }
  }
}
