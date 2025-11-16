import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import type { ShopifyWebhook } from '../types/shopify.types';

export interface WebhookSubscription {
  topic: string;
  uri: string;
  format?: 'json' | 'xml';
}

@Injectable()
export class RegisterWebhooks {
  private readonly logger = new Logger(RegisterWebhooks.name);

  constructor(private readonly configService: ConfigService) {}

  private getAppUrl(): string {
    const appUrl = this.configService.get<string>('shopify.appUrl');
    if (!appUrl) {
      throw new Error('shopify.appUrl non configuré');
    }
    return appUrl;
  }

  private getApiVersion(): string {
    const apiVersion = this.configService.get<string>('shopify.apiVersion');
    if (!apiVersion) {
      throw new Error('shopify.apiVersion non configuré');
    }
    return apiVersion;
  }

  /**
   * Enregistrer tous les webhooks nécessaires pour l'application
   */
  async registerAllWebhooks(shop: string, accessToken: string): Promise<void> {
    try {
      this.logger.log(`Enregistrement des webhooks pour le shop: ${shop}`);

      const webhooks = this.getRequiredWebhooks();
      const appUrl = this.getAppUrl();

      for (const webhook of webhooks) {
        await this.registerWebhook(shop, accessToken, {
          ...webhook,
          uri: `${appUrl}${webhook.uri}`,
        });
      }

      this.logger.log(`Tous les webhooks enregistrés avec succès pour le shop: ${shop}`);
    } catch (error) {
      this.logger.error("Erreur lors de l'enregistrement des webhooks:", error);
      throw error instanceof Error ? error : new Error('Registration webhooks failed');
    }
  }

  /**
   * Enregistrer un webhook spécifique
   */
  async registerWebhook(
    shop: string,
    accessToken: string,
    webhook: WebhookSubscription
  ): Promise<void> {
    try {
      const apiUrl = `https://${shop}/admin/api/${this.getApiVersion()}/webhooks.json`;
      
      const webhookData = {
        webhook: {
          topic: webhook.topic,
          address: webhook.uri,
          format: webhook.format || 'json',
        },
      };

      const response = await axios.post<{ webhook: ShopifyWebhook }>(apiUrl, webhookData, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.webhook) {
        this.logger.log(`Webhook ${webhook.topic} enregistré avec succès`);
      } else {
        this.logger.warn(`Échec de l'enregistrement du webhook ${webhook.topic}`);
      }
    } catch (error) {
      this.logger.error(`Erreur lors de l'enregistrement du webhook ${webhook.topic}:`, error);
      throw error instanceof Error ? error : new Error(`Registration webhook ${webhook.topic} failed`);
    }
  }

  /**
   * Supprimer tous les webhooks de l'application
   */
  async unregisterAllWebhooks(shop: string, accessToken: string): Promise<void> {
    try {
      this.logger.log(`Suppression des webhooks pour le shop: ${shop}`);

      const existingWebhooks = await this.getExistingWebhooks(shop, accessToken);
      const appUrl = this.getAppUrl();

      for (const webhook of existingWebhooks) {
        if (webhook.address.includes(appUrl)) {
          await this.deleteWebhook(shop, accessToken, webhook.id);
        }
      }

      this.logger.log(`Tous les webhooks supprimés avec succès pour le shop: ${shop}`);
    } catch (error) {
      this.logger.error('Erreur lors de la suppression des webhooks:', error);
      throw error;
    }
  }

  /**
   * Supprimer un webhook spécifique
   */
  async deleteWebhook(shop: string, accessToken: string, webhookId: string): Promise<void> {
    try {
      const apiUrl = `https://${shop}/admin/api/${this.getApiVersion()}/webhooks/${webhookId}.json`;
      
      await axios.delete(apiUrl, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      });

      this.logger.log(`Webhook ${webhookId} supprimé avec succès`);
    } catch (error) {
      this.logger.error(`Erreur lors de la suppression du webhook ${webhookId}:`, error);
      throw error instanceof Error ? error : new Error(`Deletion webhook ${webhookId} failed`);
    }
  }

  /**
   * Obtenir la liste des webhooks existants
   */
  async getExistingWebhooks(shop: string, accessToken: string): Promise<ShopifyWebhook[]> {
    try {
      const apiUrl = `https://${shop}/admin/api/${this.getApiVersion()}/webhooks.json`;
      
      const response = await axios.get<{ webhooks: ShopifyWebhook[] }>(apiUrl, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      });

      return response.data.webhooks ?? [];
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des webhooks existants:', error);
      throw error instanceof Error ? error : new Error('Récupération des webhooks existants échouée');
    }
  }

  /**
   * Vérifier si un webhook existe déjà
   */
  async webhookExists(shop: string, accessToken: string, topic: string): Promise<boolean> {
    try {
      const existingWebhooks = await this.getExistingWebhooks(shop, accessToken);
      const appUrl = this.getAppUrl();

      return existingWebhooks.some(webhook => 
        webhook.topic === topic && webhook.address.includes(appUrl)
      );
    } catch (error) {
      this.logger.error("Erreur lors de la vérification de l'existence du webhook:", error);
      return false;
    }
  }

  /**
   * Obtenir la liste des webhooks requis pour l'application
   */
  private getRequiredWebhooks(): WebhookSubscription[] {
    return [
      // Webhooks d'application
      {
        topic: 'app/uninstalled',
        uri: '/api/v1/webhooks/app/uninstalled',
      },
      
      // Webhooks de commandes
      {
        topic: 'orders/create',
        uri: '/api/v1/webhooks/orders/create',
      },
      {
        topic: 'orders/updated',
        uri: '/api/v1/webhooks/orders/updated',
      },
      {
        topic: 'orders/paid',
        uri: '/api/v1/webhooks/orders/paid',
      },
      {
        topic: 'orders/cancelled',
        uri: '/api/v1/webhooks/orders/cancelled',
      },
      {
        topic: 'orders/fulfilled',
        uri: '/api/v1/webhooks/orders/fulfilled',
      },
      {
        topic: 'orders/partially_fulfilled',
        uri: '/api/v1/webhooks/orders/partially_fulfilled',
      },
      
      // Webhooks de produits
      {
        topic: 'products/create',
        uri: '/api/v1/webhooks/products/create',
      },
      {
        topic: 'products/update',
        uri: '/api/v1/webhooks/products/update',
      },
      {
        topic: 'products/delete',
        uri: '/api/v1/webhooks/products/delete',
      },
      
      // Webhooks de clients
      {
        topic: 'customers/create',
        uri: '/api/v1/webhooks/customers/create',
      },
      {
        topic: 'customers/update',
        uri: '/api/v1/webhooks/customers/update',
      },
      {
        topic: 'customers/delete',
        uri: '/api/v1/webhooks/customers/delete',
      },
      
      // Webhooks d'inventaire
      {
        topic: 'inventory_levels/update',
        uri: '/api/v1/webhooks/inventory_levels/update',
      },
      {
        topic: 'inventory_levels/connect',
        uri: '/api/v1/webhooks/inventory_levels/connect',
      },
      {
        topic: 'inventory_levels/disconnect',
        uri: '/api/v1/webhooks/inventory_levels/disconnect',
      },
      {
        topic: 'inventory_items/create',
        uri: '/api/v1/webhooks/inventory_items/create',
      },
      {
        topic: 'inventory_items/update',
        uri: '/api/v1/webhooks/inventory_items/update',
      },
      {
        topic: 'inventory_items/delete',
        uri: '/api/v1/webhooks/inventory_items/delete',
      },
      
      // Webhooks de localisation
      {
        topic: 'locations/create',
        uri: '/api/v1/webhooks/locations/create',
      },
      {
        topic: 'locations/update',
        uri: '/api/v1/webhooks/locations/update',
      },
      {
        topic: 'locations/delete',
        uri: '/api/v1/webhooks/locations/delete',
      },
    ];
  }

  /**
   * Valider la configuration des webhooks
   */
  async validateWebhookConfiguration(shop: string, accessToken: string): Promise<boolean> {
    try {
      const requiredWebhooks = this.getRequiredWebhooks();
      const existingWebhooks = await this.getExistingWebhooks(shop, accessToken);
      const appUrl = this.getAppUrl();

      let allWebhooksPresent = true;

      for (const requiredWebhook of requiredWebhooks) {
        const exists = existingWebhooks.some(webhook => 
          webhook.topic === requiredWebhook.topic && 
          webhook.address.includes(appUrl)
        );

        if (!exists) {
          this.logger.warn(`Webhook manquant: ${requiredWebhook.topic}`);
          allWebhooksPresent = false;
        }
      }

      return allWebhooksPresent;
    } catch (error) {
      this.logger.error('Erreur lors de la validation de la configuration des webhooks:', error);
      return false;
    }
  }

  /**
   * Réparer la configuration des webhooks (supprimer les doublons, ajouter les manquants)
   */
  async repairWebhookConfiguration(shop: string, accessToken: string): Promise<void> {
    try {
      this.logger.log(`Réparation de la configuration des webhooks pour le shop: ${shop}`);

      // Supprimer tous les webhooks existants
      await this.unregisterAllWebhooks(shop, accessToken);

      // Réenregistrer tous les webhooks requis
      await this.registerAllWebhooks(shop, accessToken);

      this.logger.log(`Configuration des webhooks réparée avec succès pour le shop: ${shop}`);
    } catch (error) {
      this.logger.error('Erreur lors de la réparation de la configuration des webhooks:', error);
      throw error;
    }
  }
}



