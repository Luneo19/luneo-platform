import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';

interface ShopifyRequest extends Request {
  shopifyShop?: string;
  shopifyTopic?: string;
}

@Injectable()
export class HmacGuard implements CanActivate {
  private readonly logger = new Logger(HmacGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<ShopifyRequest>();

    const hmacHeader = this.getHeaderValue(request, 'x-shopify-hmac-sha256');
    const shopDomain = this.getHeaderValue(request, 'x-shopify-shop-domain');
    const topic = this.getHeaderValue(request, 'x-shopify-topic');

    if (!this.validateHmac(request.body, hmacHeader)) {
      this.logger.warn(`HMAC invalide pour le shop: ${shopDomain}, topic: ${topic}`);
      throw new UnauthorizedException('HMAC invalide');
    }

    request.shopifyShop = shopDomain;
    request.shopifyTopic = topic;

    this.logger.log(`Webhook validé pour le shop: ${shopDomain}, topic: ${topic}`);
    return true;
  }

  private getHeaderValue(request: ShopifyRequest, headerName: string): string {
    const value = request.headers[headerName];
    if (!value) {
      this.logger.warn(`Header Shopify manquant: ${headerName}`);
      throw new UnauthorizedException(`Header manquant: ${headerName}`);
    }
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  private validateHmac(payload: unknown, receivedHmac: string): boolean {
    try {
      const webhookSecret = this.configService.get<string>('shopify.webhookSecret');
      if (!webhookSecret) {
        this.logger.error('Secret webhook Shopify non configuré');
        return false;
      }

      const bodyString =
        typeof payload === 'string'
          ? payload
          : Buffer.isBuffer(payload)
          ? payload.toString('utf8')
          : JSON.stringify(payload ?? {});

      const calculatedHmac = crypto.createHmac('sha256', webhookSecret).update(bodyString, 'utf8').digest('base64');

      const isValid = crypto.timingSafeEqual(Buffer.from(calculatedHmac), Buffer.from(receivedHmac));

      if (!isValid) {
        this.logger.warn('HMAC mismatch - Calculé:', calculatedHmac, 'Reçu:', receivedHmac);
      }

      return isValid;
    } catch (error) {
      this.logger.error('Erreur lors de la validation HMAC:', error);
      return false;
    }
  }
}



