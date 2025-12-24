import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class HmacGuard implements CanActivate {
  private readonly logger = new Logger(HmacGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Vérifier si c'est un webhook Shopify
    const hmac = request.headers['x-shopify-hmac-sha256'];
    const shop = request.headers['x-shopify-shop-domain'];
    const topic = request.headers['x-shopify-topic'];

    if (!hmac || !shop || !topic) {
      this.logger.warn('Headers Shopify manquants dans la requête');
      throw new UnauthorizedException('Headers Shopify manquants');
    }

    // Valider le HMAC
    const isValidHmac = this.validateHmac(request.body, hmac);
    
    if (!isValidHmac) {
      this.logger.warn(`HMAC invalide pour le shop: ${shop}, topic: ${topic}`);
      throw new UnauthorizedException('HMAC invalide');
    }

    // Ajouter les informations du shop à la requête
    request.shopifyShop = shop;
    request.shopifyTopic = topic;

    this.logger.log(`Webhook validé pour le shop: ${shop}, topic: ${topic}`);
    
    return true;
  }

  private validateHmac(body: any, hmac: string): boolean {
    try {
      const webhookSecret = this.configService.get('shopify.webhookSecret');
      
      if (!webhookSecret) {
        this.logger.error('Secret webhook Shopify non configuré');
        return false;
      }

      // Convertir le body en string si c'est un objet
      let bodyString: string;
      if (typeof body === 'string') {
        bodyString = body;
      } else {
        bodyString = JSON.stringify(body);
      }

      // Calculer le HMAC
      const calculatedHmac = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyString, 'utf8')
        .digest('base64');

      // Comparer les HMAC
      const isValid = calculatedHmac === hmac;
      
      if (!isValid) {
        this.logger.warn('HMAC mismatch - Calculé:', calculatedHmac, 'Reçu:', hmac);
      }

      return isValid;
    } catch (error) {
      this.logger.error('Erreur lors de la validation HMAC:', error);
      return false;
    }
  }
}



