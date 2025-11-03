import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface ShopifyTokenData {
  access_token: string;
  scope: string;
  expires_in?: number;
  associated_user?: any;
  associated_user_scope?: string;
}

export interface ShopifyShop {
  id: string;
  name: string;
  domain: string;
  email: string;
  currency: string;
  timezone: string;
  plan_name: string;
  created_at: string;
  updated_at: string;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  template_suffix: string;
  status: string;
  published_scope: string;
  tags: string;
  admin_graphql_api_id: string;
  variants: any[];
  options: any[];
  images: any[];
  image: any;
}

export interface ShopifyOrder {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  cancelled_at: string;
  closed_at: string;
  processed_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string;
  line_items: any[];
  customer: any;
  shipping_address: any;
  billing_address: any;
}

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);
  private readonly shopifyConfig: any;

  constructor(private readonly configService: ConfigService) {
    this.shopifyConfig = this.configService.get('shopify');
  }

  /**
   * Valider le HMAC Shopify pour la sécurité
   */
  async validateHmac(shop: string, hmac: string): Promise<boolean> {
    try {
      const apiSecret = this.shopifyConfig.apiSecret;
      const calculatedHmac = crypto
        .createHmac('sha256', apiSecret)
        .update(shop)
        .digest('hex');
      
      return calculatedHmac === hmac;
    } catch (error) {
      this.logger.error('Erreur lors de la validation HMAC:', error);
      return false;
    }
  }

  /**
   * Échanger le code d'autorisation contre un token d'accès
   */
  async exchangeCodeForToken(shop: string, code: string): Promise<ShopifyTokenData> {
    try {
      const tokenUrl = `https://${shop}/admin/oauth/access_token`;
      
      const response = await axios.post(tokenUrl, {
        client_id: this.shopifyConfig.apiKey,
        client_secret: this.shopifyConfig.apiSecret,
        code: code,
      });

      if (!response.data.access_token) {
        throw new Error('Token d\'accès non reçu de Shopify');
      }

      this.logger.log(`Token d'accès obtenu pour le shop: ${shop}`);
      
      return response.data;
    } catch (error) {
      this.logger.error('Erreur lors de l\'échange du code:', error);
      throw new Error(`Échec de l'obtention du token d'accès: ${error.message}`);
    }
  }

  /**
   * Créer une instance Axios configurée pour les appels API Shopify
   */
  private createShopifyClient(shop: string, accessToken: string): AxiosInstance {
    return axios.create({
      baseURL: `https://${shop}/admin/api/${this.shopifyConfig.apiVersion}`,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Obtenir les informations du shop
   */
  async getShopInfo(shop: string, accessToken: string): Promise<ShopifyShop> {
    try {
      const client = this.createShopifyClient(shop, accessToken);
      const response = await client.get('/shop.json');
      
      return response.data.shop;
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des infos du shop:', error);
      throw new Error(`Impossible de récupérer les informations du shop: ${error.message}`);
    }
  }

  /**
   * Obtenir la liste des produits
   */
  async getProducts(shop: string, accessToken: string, limit = 50): Promise<ShopifyProduct[]> {
    try {
      const client = this.createShopifyClient(shop, accessToken);
      const response = await client.get(`/products.json?limit=${limit}`);
      
      return response.data.products;
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des produits:', error);
      throw new Error(`Impossible de récupérer les produits: ${error.message}`);
    }
  }

  /**
   * Obtenir un produit spécifique
   */
  async getProduct(shop: string, accessToken: string, productId: string): Promise<ShopifyProduct> {
    try {
      const client = this.createShopifyClient(shop, accessToken);
      const response = await client.get(`/products/${productId}.json`);
      
      return response.data.product;
    } catch (error) {
      this.logger.error('Erreur lors de la récupération du produit:', error);
      throw new Error(`Impossible de récupérer le produit: ${error.message}`);
    }
  }

  /**
   * Obtenir les commandes récentes
   */
  async getOrders(shop: string, accessToken: string, limit = 50): Promise<ShopifyOrder[]> {
    try {
      const client = this.createShopifyClient(shop, accessToken);
      const response = await client.get(`/orders.json?limit=${limit}&status=any`);
      
      return response.data.orders;
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des commandes:', error);
      throw new Error(`Impossible de récupérer les commandes: ${error.message}`);
    }
  }

  /**
   * Obtenir une commande spécifique
   */
  async getOrder(shop: string, accessToken: string, orderId: string): Promise<ShopifyOrder> {
    try {
      const client = this.createShopifyClient(shop, accessToken);
      const response = await client.get(`/orders/${orderId}.json`);
      
      return response.data.order;
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de la commande:', error);
      throw new Error(`Impossible de récupérer la commande: ${error.message}`);
    }
  }

  /**
   * Créer un script tag pour l'intégration
   */
  async createScriptTag(shop: string, accessToken: string, scriptTagData: any): Promise<any> {
    try {
      const client = this.createShopifyClient(shop, accessToken);
      const response = await client.post('/script_tags.json', {
        script_tag: scriptTagData,
      });
      
      this.logger.log(`Script tag créé pour le shop: ${shop}`);
      return response.data.script_tag;
    } catch (error) {
      this.logger.error('Erreur lors de la création du script tag:', error);
      throw new Error(`Impossible de créer le script tag: ${error.message}`);
    }
  }

  /**
   * Supprimer un script tag
   */
  async deleteScriptTag(shop: string, accessToken: string, scriptTagId: string): Promise<void> {
    try {
      const client = this.createShopifyClient(shop, accessToken);
      await client.delete(`/script_tags/${scriptTagId}.json`);
      
      this.logger.log(`Script tag supprimé pour le shop: ${shop}`);
    } catch (error) {
      this.logger.error('Erreur lors de la suppression du script tag:', error);
      throw new Error(`Impossible de supprimer le script tag: ${error.message}`);
    }
  }

  /**
   * Sauvegarder les données du shop (en production, utiliser une base de données)
   */
  async saveShopData(shop: string, tokenData: ShopifyTokenData): Promise<void> {
    try {
      // TODO: Implémenter la sauvegarde en base de données
      // Pour l'instant, on log les données
      this.logger.log(`Sauvegarde des données pour le shop: ${shop}`);
      this.logger.log(`Token: ${tokenData.access_token.substring(0, 10)}...`);
      this.logger.log(`Scopes: ${tokenData.scope}`);
      
      // En production, sauvegarder en base de données
      // await this.databaseService.saveShop({
      //   domain: shop,
      //   access_token: tokenData.access_token,
      //   scope: tokenData.scope,
      //   installed_at: new Date(),
      //   expires_at: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
      // });
    } catch (error) {
      this.logger.error('Erreur lors de la sauvegarde des données:', error);
      throw new Error(`Impossible de sauvegarder les données: ${error.message}`);
    }
  }

  /**
   * Synchroniser le shop avec Luneo
   */
  async syncShopWithLuneo(shop: string, accessToken: string): Promise<void> {
    try {
      this.logger.log(`Synchronisation du shop ${shop} avec Luneo`);
      
      // Obtenir les informations du shop
      const shopInfo = await this.getShopInfo(shop, accessToken);
      
      // Obtenir les produits
      const products = await this.getProducts(shop, accessToken, 10);
      
      // Envoyer les données à Luneo
      const luneoApiUrl = this.configService.get('luneo.apiUrl');
      const luneoApiKey = this.configService.get('luneo.apiKey');
      
      if (luneoApiUrl && luneoApiKey) {
        await axios.post(`${luneoApiUrl}/integrations/shopify/sync`, {
          shop: {
            domain: shop,
            name: shopInfo.name,
            email: shopInfo.email,
            currency: shopInfo.currency,
            timezone: shopInfo.timezone,
            plan: shopInfo.plan_name,
          },
          products: products.map(product => ({
            shopify_id: product.id,
            title: product.title,
            vendor: product.vendor,
            product_type: product.product_type,
            tags: product.tags,
            status: product.status,
          })),
        }, {
          headers: {
            'Authorization': `Bearer ${luneoApiKey}`,
            'Content-Type': 'application/json',
          },
        });
        
        this.logger.log(`Synchronisation réussie pour le shop: ${shop}`);
      }
    } catch (error) {
      this.logger.error('Erreur lors de la synchronisation avec Luneo:', error);
      // Ne pas faire échouer l'installation si la synchronisation échoue
    }
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refreshAccessToken(shop: string): Promise<ShopifyTokenData> {
    try {
      // TODO: Implémenter le rafraîchissement du token
      // Pour l'instant, retourner une erreur
      throw new Error('Rafraîchissement de token non implémenté');
    } catch (error) {
      this.logger.error('Erreur lors du rafraîchissement du token:', error);
      throw new Error(`Impossible de rafraîchir le token: ${error.message}`);
    }
  }

  /**
   * Obtenir le statut du shop
   */
  async getShopStatus(shop: string): Promise<any> {
    try {
      // TODO: Implémenter la vérification du statut en base de données
      return {
        connected: true,
        installed_at: new Date(),
        last_sync: new Date(),
        plan: 'basic',
        features: ['ai-studio', 'ar-viewer', 'widget-embed'],
      };
    } catch (error) {
      this.logger.error('Erreur lors de la vérification du statut:', error);
      throw new Error(`Impossible de vérifier le statut: ${error.message}`);
    }
  }

  /**
   * Désinstaller le shop
   */
  async uninstallShop(shop: string): Promise<void> {
    try {
      this.logger.log(`Désinstallation du shop: ${shop}`);
      
      // TODO: Implémenter la désinstallation complète
      // 1. Supprimer les script tags
      // 2. Nettoyer les données en base
      // 3. Notifier Luneo
      
      this.logger.log(`Shop ${shop} désinstallé avec succès`);
    } catch (error) {
      this.logger.error('Erreur lors de la désinstallation:', error);
      throw new Error(`Impossible de désinstaller le shop: ${error.message}`);
    }
  }
}



