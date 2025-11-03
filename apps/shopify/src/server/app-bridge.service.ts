import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShopifyService } from './shopify.service';

export interface AppBridgeConfig {
  apiKey: string;
  shopOrigin: string;
  forceRedirect: boolean;
  debug: boolean;
}

export interface AppBridgeSession {
  id: string;
  shop: string;
  state: string;
  isOnline: boolean;
  scope: string;
  expires: Date;
  accessToken: string;
  onlineAccessInfo?: any;
}

export interface AppBridgeUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  account_owner: boolean;
  locale: string;
  permissions: string[];
}

export interface AppBridgeShop {
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

export interface AppBridgeContext {
  shop: AppBridgeShop;
  user: AppBridgeUser;
  session: AppBridgeSession;
  theme: any;
  locale: string;
  currency: string;
}

@Injectable()
export class AppBridgeService {
  private readonly logger = new Logger(AppBridgeService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly shopifyService: ShopifyService,
  ) {}

  /**
   * Obtenir la configuration App Bridge
   */
  async getAppBridgeConfig(shop: string): Promise<AppBridgeConfig> {
    try {
      const apiKey = this.configService.get('shopify.apiKey');
      const shopOrigin = `https://${shop}`;
      
      return {
        apiKey,
        shopOrigin,
        forceRedirect: true,
        debug: this.configService.get('nodeEnv') === 'development',
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de la config App Bridge:', error);
      throw new Error(`Impossible de récupérer la configuration App Bridge: ${error.message}`);
    }
  }

  /**
   * Authentifier l'utilisateur via App Bridge
   */
  async authenticate(shop: string, authData: any): Promise<any> {
    try {
      this.logger.log(`Authentification App Bridge pour le shop: ${shop}`);
      
      // Valider les données d'authentification
      const { state, code, hmac } = authData;
      
      if (!state || !code) {
        throw new Error('Données d\'authentification manquantes');
      }

      // Valider le HMAC si fourni
      if (hmac) {
        const isValidHmac = await this.shopifyService.validateHmac(shop, hmac);
        if (!isValidHmac) {
          throw new Error('HMAC invalide');
        }
      }

      // Échanger le code contre un token
      const tokenData = await this.shopifyService.exchangeCodeForToken(shop, code);
      
      // Créer une session
      const session = await this.createSession(shop, {
        state,
        accessToken: tokenData.access_token,
        scope: tokenData.scope,
        isOnline: false,
      });

      return {
        session,
        redirectUrl: `/app?shop=${encodeURIComponent(shop)}`,
      };
    } catch (error) {
      this.logger.error('Erreur lors de l\'authentification App Bridge:', error);
      throw new Error(`Authentification échouée: ${error.message}`);
    }
  }

  /**
   * Obtenir la session App Bridge
   */
  async getSession(shop: string): Promise<AppBridgeSession | null> {
    try {
      // TODO: Implémenter la récupération de session depuis la base de données
      // Pour l'instant, retourner une session factice
      
      this.logger.log(`Récupération de la session pour le shop: ${shop}`);
      
      return {
        id: `session_${shop}_${Date.now()}`,
        shop,
        state: 'active',
        isOnline: false,
        scope: 'read_products,write_products',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        accessToken: 'fake_access_token',
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de la session:', error);
      throw new Error(`Impossible de récupérer la session: ${error.message}`);
    }
  }

  /**
   * Créer une nouvelle session App Bridge
   */
  async createSession(shop: string, sessionData: any): Promise<AppBridgeSession> {
    try {
      this.logger.log(`Création d'une nouvelle session pour le shop: ${shop}`);
      
      const session: AppBridgeSession = {
        id: `session_${shop}_${Date.now()}`,
        shop,
        state: sessionData.state || 'active',
        isOnline: sessionData.isOnline || false,
        scope: sessionData.scope || 'read_products,write_products',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        accessToken: sessionData.accessToken,
        onlineAccessInfo: sessionData.onlineAccessInfo,
      };

      // TODO: Sauvegarder la session en base de données
      
      return session;
    } catch (error) {
      this.logger.error('Erreur lors de la création de la session:', error);
      throw new Error(`Impossible de créer la session: ${error.message}`);
    }
  }

  /**
   * Mettre à jour la session App Bridge
   */
  async updateSession(shop: string, sessionData: any): Promise<AppBridgeSession> {
    try {
      this.logger.log(`Mise à jour de la session pour le shop: ${shop}`);
      
      const existingSession = await this.getSession(shop);
      
      if (!existingSession) {
        throw new Error('Session non trouvée');
      }

      const updatedSession: AppBridgeSession = {
        ...existingSession,
        ...sessionData,
        updated_at: new Date(),
      };

      // TODO: Mettre à jour la session en base de données
      
      return updatedSession;
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour de la session:', error);
      throw new Error(`Impossible de mettre à jour la session: ${error.message}`);
    }
  }

  /**
   * Supprimer la session App Bridge
   */
  async deleteSession(shop: string): Promise<void> {
    try {
      this.logger.log(`Suppression de la session pour le shop: ${shop}`);
      
      // TODO: Supprimer la session de la base de données
      
      this.logger.log(`Session supprimée avec succès pour le shop: ${shop}`);
    } catch (error) {
      this.logger.error('Erreur lors de la suppression de la session:', error);
      throw new Error(`Impossible de supprimer la session: ${error.message}`);
    }
  }

  /**
   * Obtenir les informations de l'utilisateur connecté
   */
  async getCurrentUser(shop: string): Promise<AppBridgeUser> {
    try {
      const session = await this.getSession(shop);
      
      if (!session) {
        throw new Error('Session non trouvée');
      }

      // TODO: Récupérer les informations utilisateur depuis Shopify API
      // Pour l'instant, retourner un utilisateur factice
      
      return {
        id: 'user_123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        account_owner: true,
        locale: 'en',
        permissions: ['read_products', 'write_products'],
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw new Error(`Impossible de récupérer l'utilisateur: ${error.message}`);
    }
  }

  /**
   * Obtenir les informations du shop
   */
  async getShopInfo(shop: string): Promise<AppBridgeShop> {
    try {
      const session = await this.getSession(shop);
      
      if (!session) {
        throw new Error('Session non trouvée');
      }

      // Récupérer les informations du shop depuis Shopify
      const shopInfo = await this.shopifyService.getShopInfo(shop, session.accessToken);
      
      return {
        id: shopInfo.id,
        name: shopInfo.name,
        domain: shopInfo.domain,
        email: shopInfo.email,
        currency: shopInfo.currency,
        timezone: shopInfo.timezone,
        plan_name: shopInfo.plan_name,
        created_at: shopInfo.created_at,
        updated_at: shopInfo.updated_at,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des infos du shop:', error);
      throw new Error(`Impossible de récupérer les informations du shop: ${error.message}`);
    }
  }

  /**
   * Naviguer vers une page dans l'admin Shopify
   */
  async navigateToPage(shop: string, navigationData: any): Promise<any> {
    try {
      const { path, resource, id } = navigationData;
      
      this.logger.log(`Navigation vers: ${path} pour le shop: ${shop}`);
      
      // Construire l'URL de navigation
      let navigationUrl = `https://${shop}/admin`;
      
      if (path) {
        navigationUrl += path;
      } else if (resource && id) {
        navigationUrl += `/${resource}/${id}`;
      }
      
      return {
        success: true,
        url: navigationUrl,
        action: 'navigate',
      };
    } catch (error) {
      this.logger.error('Erreur lors de la navigation:', error);
      throw new Error(`Navigation échouée: ${error.message}`);
    }
  }

  /**
   * Ouvrir une modal dans l'admin Shopify
   */
  async openModal(shop: string, modalData: any): Promise<any> {
    try {
      const { title, content, actions } = modalData;
      
      this.logger.log(`Ouverture de modal: ${title} pour le shop: ${shop}`);
      
      return {
        success: true,
        modal: {
          title,
          content,
          actions: actions || [],
        },
        action: 'open_modal',
      };
    } catch (error) {
      this.logger.error('Erreur lors de l\'ouverture de la modal:', error);
      throw new Error(`Ouverture de modal échouée: ${error.message}`);
    }
  }

  /**
   * Afficher un toast dans l'admin Shopify
   */
  async showToast(shop: string, toastData: any): Promise<any> {
    try {
      const { message, type = 'info', duration = 5000 } = toastData;
      
      this.logger.log(`Affichage du toast: ${message} pour le shop: ${shop}`);
      
      return {
        success: true,
        toast: {
          message,
          type,
          duration,
        },
        action: 'show_toast',
      };
    } catch (error) {
      this.logger.error('Erreur lors de l\'affichage du toast:', error);
      throw new Error(`Affichage du toast échoué: ${error.message}`);
    }
  }

  /**
   * Obtenir le contexte complet de l'application
   */
  async getAppContext(shop: string, contextData: any): Promise<AppBridgeContext> {
    try {
      this.logger.log(`Récupération du contexte pour le shop: ${shop}`);
      
      const [session, user, shopInfo] = await Promise.all([
        this.getSession(shop),
        this.getCurrentUser(shop),
        this.getShopInfo(shop),
      ]);
      
      if (!session) {
        throw new Error('Session non trouvée');
      }
      
      return {
        shop: shopInfo,
        user,
        session,
        theme: contextData.theme || null,
        locale: contextData.locale || 'en',
        currency: shopInfo.currency,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération du contexte:', error);
      throw new Error(`Impossible de récupérer le contexte: ${error.message}`);
    }
  }

  /**
   * Valider la session App Bridge
   */
  async validateSession(shop: string, sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(shop);
      
      if (!session) {
        return false;
      }
      
      // Vérifier si la session n'est pas expirée
      if (session.expires < new Date()) {
        this.logger.warn(`Session expirée pour le shop: ${shop}`);
        return false;
      }
      
      // Vérifier l'ID de session
      return session.id === sessionId;
    } catch (error) {
      this.logger.error('Erreur lors de la validation de la session:', error);
      return false;
    }
  }

  /**
   * Rafraîchir la session App Bridge
   */
  async refreshSession(shop: string): Promise<AppBridgeSession> {
    try {
      this.logger.log(`Rafraîchissement de la session pour le shop: ${shop}`);
      
      const existingSession = await this.getSession(shop);
      
      if (!existingSession) {
        throw new Error('Session non trouvée');
      }
      
      // Rafraîchir le token d'accès
      const newTokenData = await this.shopifyService.refreshAccessToken(shop);
      
      // Mettre à jour la session
      const refreshedSession = await this.updateSession(shop, {
        accessToken: newTokenData.access_token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      });
      
      return refreshedSession;
    } catch (error) {
      this.logger.error('Erreur lors du rafraîchissement de la session:', error);
      throw new Error(`Impossible de rafraîchir la session: ${error.message}`);
    }
  }
}



