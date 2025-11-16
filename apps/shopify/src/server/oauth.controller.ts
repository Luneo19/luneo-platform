import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  Req,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { ShopifyService } from './shopify.service';

@ApiTags('auth')
@Controller('auth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(
    private readonly shopifyService: ShopifyService,
    private readonly configService: ConfigService,
  ) {}

  @Get('install')
  @ApiOperation({ summary: 'Initier le processus d\'installation OAuth Shopify' })
  @ApiQuery({ name: 'shop', description: 'Domaine du shop Shopify (ex: mystore.myshopify.com)' })
  @ApiResponse({ status: 302, description: 'Redirection vers Shopify pour autorisation' })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  async install(@Query('shop') shop: string, @Res() res: Response) {
    try {
      if (!shop) {
        throw new HttpException('Le paramètre shop est requis', HttpStatus.BAD_REQUEST);
      }

      // Validation du format du shop
      if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(shop)) {
        throw new HttpException('Format de shop invalide', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Installation demandée pour le shop: ${shop}`);

      // Génération du state pour la sécurité CSRF
      const state = crypto.randomBytes(32).toString('hex');
      
      // Stockage temporaire du state (en production, utiliser Redis)
      // TODO: Implémenter le stockage Redis pour le state
      
      // Construction de l'URL d'autorisation Shopify
      const shopifyConfig = this.configService.get('shopify');
      const scopes = shopifyConfig.scopes.join(',');
      const redirectUri = encodeURIComponent(shopifyConfig.redirectUrl);
      
      const authUrl = `https://${shop}/admin/oauth/authorize?` +
        `client_id=${shopifyConfig.apiKey}&` +
        `scope=${scopes}&` +
        `redirect_uri=${redirectUri}&` +
        `state=${state}`;

      this.logger.log(`Redirection vers: ${authUrl}`);

      res.redirect(authUrl);
    } catch (error) {
      this.logger.error('Erreur lors de l\'installation:', error);
      throw new HttpException(
        'Erreur lors de l\'installation de l\'application',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('callback')
  @ApiOperation({ summary: 'Callback OAuth après autorisation Shopify' })
  @ApiQuery({ name: 'code', description: 'Code d\'autorisation retourné par Shopify' })
  @ApiQuery({ name: 'state', description: 'State CSRF pour validation' })
  @ApiQuery({ name: 'shop', description: 'Domaine du shop Shopify' })
  @ApiResponse({ status: 302, description: 'Redirection vers l\'application' })
  @ApiResponse({ status: 400, description: 'Paramètres invalides ou erreur d\'autorisation' })
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('shop') shop: string,
    @Query('hmac') hmac: string,
    @Res() res: Response,
  ) {
    try {
      this.logger.log(`Callback OAuth reçu pour shop: ${shop}`);

      // Validation des paramètres requis
      if (!code || !shop) {
        throw new HttpException('Paramètres requis manquants', HttpStatus.BAD_REQUEST);
      }

      // Validation du HMAC (optionnel mais recommandé)
      if (hmac) {
        const isValidHmac = await this.shopifyService.validateHmac(shop, hmac);
        if (!isValidHmac) {
          throw new HttpException('HMAC invalide', HttpStatus.UNAUTHORIZED);
        }
      }

      // Validation du state CSRF
      // TODO: Vérifier le state stocké en Redis
      
      // Échange du code contre un access token
      const tokenData = await this.shopifyService.exchangeCodeForToken(shop, code);
      
      if (!tokenData.access_token) {
        throw new HttpException('Échec de l\'obtention du token d\'accès', HttpStatus.UNAUTHORIZED);
      }

      // Sauvegarde du shop et du token
      await this.shopifyService.saveShopData(shop, tokenData);

      // Synchronisation des données avec Luneo
      await this.shopifyService.syncShopWithLuneo(shop, tokenData.access_token);

      this.logger.log(`Installation réussie pour le shop: ${shop}`);

      // Redirection vers l'application avec le shop en paramètre
      const appUrl = `${this.configService.get('shopify.appUrl')}/app?shop=${encodeURIComponent(shop)}`;
      res.redirect(appUrl);

    } catch (error) {
      this.logger.error('Erreur lors du callback OAuth:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      const errorUrl = `${this.configService.get('shopify.appUrl')}/error?message=${encodeURIComponent(errorMessage)}`;
      res.redirect(errorUrl);
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rafraîchir le token d\'accès Shopify' })
  @ApiResponse({ status: 200, description: 'Token rafraîchi avec succès' })
  @ApiResponse({ status: 401, description: 'Token invalide ou expiré' })
  async refreshToken(@Req() req: Request) {
    try {
      const shop = req.headers['x-shopify-shop-domain'] as string;
      
      if (!shop) {
        throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
      }

      const newTokenData = await this.shopifyService.refreshAccessToken(shop);
      
      return {
        success: true,
        message: 'Token rafraîchi avec succès',
        data: {
          shop,
          expires_in: newTokenData.expires_in ?? null,
        },
      };
    } catch (error) {
      this.logger.error('Erreur lors du rafraîchissement du token:', error);
      throw new HttpException(
        'Erreur lors du rafraîchissement du token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Vérifier le statut de connexion Shopify' })
  @ApiQuery({ name: 'shop', description: 'Domaine du shop Shopify' })
  @ApiResponse({ status: 200, description: 'Statut de connexion retourné' })
  async getStatus(@Query('shop') shop: string) {
    try {
      if (!shop) {
        throw new HttpException('Le paramètre shop est requis', HttpStatus.BAD_REQUEST);
      }

      const status = await this.shopifyService.getShopStatus(shop);
      
      return {
        success: true,
        data: {
          shop,
          connected: status.connected,
          installed_at: status.installed_at,
          last_sync: status.last_sync,
          plan: status.plan,
          features: status.features,
        },
      };
    } catch (error) {
      this.logger.error('Erreur lors de la vérification du statut:', error);
      throw new HttpException(
        'Erreur lors de la vérification du statut',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('uninstall')
  @ApiOperation({ summary: 'Désinstaller l\'application du shop' })
  @ApiResponse({ status: 200, description: 'Application désinstallée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async uninstall(@Req() req: Request) {
    try {
      const shop = req.headers['x-shopify-shop-domain'] as string;
      
      if (!shop) {
        throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
      }

      await this.shopifyService.uninstallShop(shop);
      
      return {
        success: true,
        message: 'Application désinstallée avec succès',
        data: { shop },
      };
    } catch (error) {
      this.logger.error('Erreur lors de la désinstallation:', error);
      throw new HttpException(
        'Erreur lors de la désinstallation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}



