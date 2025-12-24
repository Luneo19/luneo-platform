import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ShopifyService } from '../shopify.service';

@Injectable()
export class ShopifyAuthGuard implements CanActivate {
  private readonly logger = new Logger(ShopifyAuthGuard.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly shopifyService: ShopifyService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Exclure certaines routes de l'authentification
    const excludedRoutes = [
      '/api/v1/auth/install',
      '/api/v1/auth/callback',
      '/api/v1/webhooks',
      '/health',
      '/api/docs',
    ];

    const url = request.url;
    const isExcluded = excludedRoutes.some(route => url.startsWith(route));

    if (isExcluded) {
      return true;
    }

    // Vérifier l'authentification Shopify
    const shop = request.headers['x-shopify-shop-domain'] || request.query.shop;
    const accessToken = request.headers['x-shopify-access-token'] || request.headers['authorization'];

    if (!shop || !accessToken) {
      this.logger.warn('Authentification Shopify manquante');
      throw new UnauthorizedException('Authentification Shopify requise');
    }

    // Valider le shop
    if (!this.isValidShopDomain(shop)) {
      this.logger.warn(`Format de shop invalide: ${shop}`);
      throw new UnauthorizedException('Format de shop invalide');
    }

    // Valider le token (en production, vérifier en base de données)
    const isValidToken = this.validateAccessToken(shop, accessToken);
    
    if (!isValidToken) {
      this.logger.warn(`Token invalide pour le shop: ${shop}`);
      throw new UnauthorizedException('Token d\'accès invalide');
    }

    // Ajouter les informations du shop à la requête
    request.shopifyShop = shop;
    request.shopifyAccessToken = accessToken.replace('Bearer ', '');

    this.logger.log(`Authentification réussie pour le shop: ${shop}`);
    
    return true;
  }

  private isValidShopDomain(shop: string): boolean {
    // Validation du format du domaine Shopify
    const shopifyDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
    return shopifyDomainRegex.test(shop);
  }

  private validateAccessToken(shop: string, accessToken: string): boolean {
    try {
      // En production, vérifier le token en base de données
      // Pour l'instant, on accepte tous les tokens (à implémenter)
      
      // TODO: Implémenter la validation en base de données
      // const shopData = await this.databaseService.getShopByDomain(shop);
      // return shopData && shopData.access_token === accessToken;
      
      return true; // Temporaire
    } catch (error) {
      this.logger.error('Erreur lors de la validation du token:', error);
      return false;
    }
  }
}



