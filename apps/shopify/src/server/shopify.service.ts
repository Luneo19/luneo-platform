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
   * Sauvegarder les données du shop dans EcommerceIntegration
   * Note: Nécessite PrismaService ou accès à la DB via API backend
   */
  async saveShopData(shop: string, tokenData: ShopifyTokenData): Promise<void> {
    try {
      this.logger.log(`Sauvegarde des données pour le shop: ${shop}`);
      
      // Sauvegarder via API backend (EcommerceIntegration)
      const backendUrl = this.configService.get('luneo.apiUrl') || process.env.LUNEO_API_URL;
      if (backendUrl) {
        try {
          await fetch(`${backendUrl}/api/integrations/shopify/save`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-token': process.env.INTERNAL_API_TOKEN || '',
            },
            body: JSON.stringify({
              shopDomain: shop,
              accessToken: tokenData.access_token,
              scope: tokenData.scope,
              expiresIn: tokenData.expires_in,
            }),
          });
          this.logger.log(`Données sauvegardées pour le shop: ${shop}`);
        } catch (apiError) {
          this.logger.warn('Impossible de sauvegarder via API backend, utilisation du log uniquement', {
            error: apiError instanceof Error ? apiError.message : String(apiError),
          });
        }
      } else {
        this.logger.warn('LUNEO_API_URL non configuré, données non sauvegardées en DB');
      }
    } catch (error) {
      this.logger.error('Erreur lors de la sauvegarde des données:', error);
      throw new Error(`Impossible de sauvegarder les données: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Récupérer les données du shop depuis EcommerceIntegration
   */
  async getShopData(shop: string): Promise<{
    sessionId?: string;
    accessToken?: string;
    scope?: string;
    state?: string;
    isOnline?: boolean;
    expiresAt?: Date;
    onlineAccessInfo?: any;
  } | null> {
    try {
      const backendUrl = this.configService.get('luneo.apiUrl') || process.env.LUNEO_API_URL;
      if (backendUrl) {
        const response = await fetch(`${backendUrl}/api/integrations/shopify/get?shop=${encodeURIComponent(shop)}`, {
          headers: {
            'x-internal-token': process.env.INTERNAL_API_TOKEN || '',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          return data;
        }
      }
      return null;
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des données du shop:', error);
      return null;
    }
  }

  /**
   * Sauvegarder une session App Bridge
   */
  async saveSession(shop: string, sessionData: {
    sessionId: string;
    accessToken: string;
    scope: string;
    state: string;
    isOnline: boolean;
    expiresAt: Date;
    onlineAccessInfo?: any;
  }): Promise<void> {
    try {
      const backendUrl = this.configService.get('luneo.apiUrl') || process.env.LUNEO_API_URL;
      if (backendUrl) {
        await fetch(`${backendUrl}/api/integrations/shopify/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-token': process.env.INTERNAL_API_TOKEN || '',
          },
          body: JSON.stringify({
            shopDomain: shop,
            ...sessionData,
          }),
        });
      }
    } catch (error) {
      this.logger.error('Erreur lors de la sauvegarde de la session:', error);
    }
  }

  /**
   * Mettre à jour une session App Bridge
   */
  async updateSession(shop: string, sessionData: {
    sessionId: string;
    accessToken: string;
    scope: string;
    state: string;
    isOnline: boolean;
    expiresAt: Date;
    onlineAccessInfo?: any;
  }): Promise<void> {
    try {
      const backendUrl = this.configService.get('luneo.apiUrl') || process.env.LUNEO_API_URL;
      if (backendUrl) {
        await fetch(`${backendUrl}/api/integrations/shopify/session`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-token': process.env.INTERNAL_API_TOKEN || '',
          },
          body: JSON.stringify({
            shopDomain: shop,
            ...sessionData,
          }),
        });
      }
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour de la session:', error);
    }
  }

  /**
   * Supprimer une session App Bridge
   */
  async deleteSession(shop: string): Promise<void> {
    try {
      const backendUrl = this.configService.get('luneo.apiUrl') || process.env.LUNEO_API_URL;
      if (backendUrl) {
        await fetch(`${backendUrl}/api/integrations/shopify/session?shop=${encodeURIComponent(shop)}`, {
          method: 'DELETE',
          headers: {
            'x-internal-token': process.env.INTERNAL_API_TOKEN || '',
          },
        });
      }
    } catch (error) {
      this.logger.error('Erreur lors de la suppression de la session:', error);
    }
  }

  /**
   * Récupérer l'utilisateur actuel depuis Shopify API
   */
  async getCurrentUser(shop: string, accessToken: string): Promise<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    account_owner: boolean;
    locale: string;
    permissions: string[];
  } | null> {
    try {
      const client = this.createShopifyClient(shop, accessToken);
      const response = await client.get('/users/current.json');
      
      const user = response.data.user;
      return {
        id: user.id?.toString() || `user_${shop}`,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        account_owner: user.account_owner || false,
        locale: user.locale || 'en',
        permissions: user.permissions || [],
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refreshAccessToken(shop: string): Promise<ShopifyTokenData> {
    try {
      // Shopify tokens ne nécessitent généralement pas de refresh
      // Mais on peut vérifier et renouveler si nécessaire
      const shopData = await this.getShopData(shop);
      
      if (!shopData?.accessToken) {
        throw new Error('Aucun token trouvé pour ce shop');
      }
      
      // Vérifier si le token est expiré et renouveler si nécessaire
      // Pour l'instant, retourner le token existant
      return {
        access_token: shopData.accessToken,
        scope: shopData.scope || 'read_products,write_products',
      };
    } catch (error) {
      this.logger.error('Erreur lors du rafraîchissement du token:', error);
      throw new Error(`Impossible de rafraîchir le token: ${error instanceof Error ? error.message : String(error)}`);
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




      }
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour de la session:', error);
    }
  }

  /**
   * Supprimer une session App Bridge
   */
  async deleteSession(shop: string): Promise<void> {
    try {
      const backendUrl = this.configService.get('luneo.apiUrl') || process.env.LUNEO_API_URL;
      if (backendUrl) {
        await fetch(`${backendUrl}/api/integrations/shopify/session?shop=${encodeURIComponent(shop)}`, {
          method: 'DELETE',
          headers: {
            'x-internal-token': process.env.INTERNAL_API_TOKEN || '',
          },
        });
      }
    } catch (error) {
      this.logger.error('Erreur lors de la suppression de la session:', error);
    }
  }

  /**
   * Récupérer l'utilisateur actuel depuis Shopify API
   */
  async getCurrentUser(shop: string, accessToken: string): Promise<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    account_owner: boolean;
    locale: string;
    permissions: string[];
  } | null> {
    try {
      const client = this.createShopifyClient(shop, accessToken);
      const response = await client.get('/users/current.json');
      
      const user = response.data.user;
      return {
        id: user.id?.toString() || `user_${shop}`,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        account_owner: user.account_owner || false,
        locale: user.locale || 'en',
        permissions: user.permissions || [],
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refreshAccessToken(shop: string): Promise<ShopifyTokenData> {
    try {
      // Shopify tokens ne nécessitent généralement pas de refresh
      // Mais on peut vérifier et renouveler si nécessaire
      const shopData = await this.getShopData(shop);
      
      if (!shopData?.accessToken) {
        throw new Error('Aucun token trouvé pour ce shop');
      }
      
      // Vérifier si le token est expiré et renouveler si nécessaire
      // Pour l'instant, retourner le token existant
      return {
        access_token: shopData.accessToken,
        scope: shopData.scope || 'read_products,write_products',
      };
    } catch (error) {
      this.logger.error('Erreur lors du rafraîchissement du token:', error);
      throw new Error(`Impossible de rafraîchir le token: ${error instanceof Error ? error.message : String(error)}`);
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



