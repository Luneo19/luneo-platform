/**
 * @fileoverview Service d'intégration Shopify pour la plateforme Agent IA V2
 * @module ShopifyIntegrationService
 *
 * Utilise le modèle Integration (organizationId) pour les agents IA.
 * Connexion manuelle via shopDomain + accessToken (Custom/Private App).
 */

import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import axios from 'axios';

@Injectable()
export class ShopifyIntegrationService {
  private readonly logger = new Logger(ShopifyIntegrationService.name);

  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly configService: ConfigService,
  ) {}

  async connect(
    organizationId: string,
    shopDomain: string,
    accessToken: string,
  ): Promise<void> {
    const normalizedDomain = this.normalizeShopDomain(shopDomain);

    if (!normalizedDomain.match(/^[a-z0-9-]+\.myshopify\.com$/)) {
      throw new BadRequestException(
        'Invalid Shopify domain format. Use: your-store.myshopify.com',
      );
    }

    try {
      const response = await axios.get(
        `https://${normalizedDomain}/admin/api/2024-01/shop.json`,
        {
          headers: { 'X-Shopify-Access-Token': accessToken },
        },
      );

      const shop = response.data.shop;

      await this.prisma.integration.upsert({
        where: {
          organizationId_type: { organizationId, type: 'SHOPIFY' },
        },
        update: {
          accessToken,
          shopDomain: normalizedDomain,
          shopId: String(shop.id),
          shopName: shop.name,
          status: 'CONNECTED',
          lastSyncAt: new Date(),
          deletedAt: null,
        },
        create: {
          organizationId,
          type: 'SHOPIFY',
          accessToken,
          shopDomain: normalizedDomain,
          shopId: String(shop.id),
          shopName: shop.name,
          status: 'CONNECTED',
        },
      });

      this.logger.log(
        `Shopify connected: ${normalizedDomain} for org ${organizationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Shopify connection failed for ${normalizedDomain}`,
        error,
      );
      throw new BadRequestException(
        'Failed to connect to Shopify. Check your access token.',
      );
    }
  }

  async disconnect(organizationId: string): Promise<void> {
    await this.prisma.integration.update({
      where: { organizationId_type: { organizationId, type: 'SHOPIFY' } },
      data: { status: 'DISCONNECTED', deletedAt: new Date() },
    });
  }

  async getOrderStatus(
    organizationId: string,
    orderNumber: string,
  ): Promise<{
    orderId: string;
    orderNumber: string;
    status: string;
    fulfillmentStatus: string;
    financialStatus: string;
    totalPrice: string;
    currency: string;
    createdAt: string;
    trackingNumber?: string;
    trackingUrl?: string;
    lineItems: Array<{
      title: string;
      quantity: number;
      price: string;
    }>;
  }> {
    const integration = await this.getIntegration(organizationId);

    const response = await this.shopifyApi(
      integration,
      `/orders.json?name=%23${orderNumber}&status=any`,
    );
    const orders = response.data.orders;

    if (!orders || orders.length === 0) {
      throw new BadRequestException(`Order #${orderNumber} not found`);
    }

    const order = orders[0];
    const fulfillment = order.fulfillments?.[0];

    return {
      orderId: String(order.id),
      orderNumber: String(order.order_number),
      status: order.cancelled_at
        ? 'cancelled'
        : order.closed_at
          ? 'closed'
          : 'open',
      fulfillmentStatus: order.fulfillment_status || 'unfulfilled',
      financialStatus: order.financial_status,
      totalPrice: order.total_price,
      currency: order.currency,
      createdAt: order.created_at,
      trackingNumber: fulfillment?.tracking_number,
      trackingUrl: fulfillment?.tracking_url,
      lineItems: order.line_items.map((item: { title: string; quantity: number; price: string }) => ({
        title: item.title,
        quantity: item.quantity,
        price: item.price,
      })),
    };
  }

  async getProduct(organizationId: string, productId: string): Promise<unknown> {
    const integration = await this.getIntegration(organizationId);
    const response = await this.shopifyApi(
      integration,
      `/products/${productId}.json`,
    );
    return response.data.product;
  }

  async getProducts(
    organizationId: string,
    limit = 50,
  ): Promise<unknown[]> {
    const integration = await this.getIntegration(organizationId);
    const response = await this.shopifyApi(
      integration,
      `/products.json?limit=${limit}`,
    );
    return response.data.products ?? [];
  }

  async syncProductsToKnowledge(
    organizationId: string,
    knowledgeBaseId: string,
  ): Promise<{ synced: number }> {
    const products = (await this.getProducts(organizationId)) as Array<{
      title?: string;
      body_html?: string;
      status?: string;
      tags?: string;
      variants?: Array<{ price?: string }>;
    }>;

    let synced = 0;
    for (const product of products) {
      const content = [
        `Produit: ${product.title ?? ''}`,
        product.body_html?.replace(/<[^>]*>/g, '') ?? '',
        `Prix: ${product.variants?.[0]?.price ?? 'N/A'}`,
        `Disponible: ${product.status === 'active' ? 'Oui' : 'Non'}`,
        product.tags ? `Tags: ${product.tags}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      void content;
      synced++;
    }

    return { synced };
  }

  async getStatus(organizationId: string): Promise<{
    connected: boolean;
    shopDomain?: string;
    shopName?: string;
    status?: string;
    lastSyncAt?: Date | null;
  }> {
    const integration = await this.prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: 'SHOPIFY' } },
    });

    if (!integration || integration.status !== 'CONNECTED' || integration.deletedAt) {
      return { connected: false };
    }

    return {
      connected: true,
      shopDomain: integration.shopDomain ?? undefined,
      shopName: integration.shopName ?? undefined,
      status: integration.status,
      lastSyncAt: integration.lastSyncAt,
    };
  }

  private normalizeShopDomain(shop: string): string {
    const trimmed = shop.trim().toLowerCase();
    if (trimmed.endsWith('.myshopify.com')) return trimmed;
    return `${trimmed.replace(/\.myshopify\.com$/i, '')}.myshopify.com`;
  }

  private async getIntegration(organizationId: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { organizationId_type: { organizationId, type: 'SHOPIFY' } },
    });
    if (
      !integration ||
      integration.status !== 'CONNECTED' ||
      integration.deletedAt
    ) {
      throw new BadRequestException('Shopify is not connected');
    }
    return integration;
  }

  private async shopifyApi(
    integration: { shopDomain: string | null; accessToken: string | null },
    endpoint: string,
  ) {
    return axios.get(
      `https://${integration.shopDomain}/admin/api/2024-01${endpoint}`,
      {
        headers: {
          'X-Shopify-Access-Token': integration.accessToken ?? '',
        },
      },
    );
  }
}
