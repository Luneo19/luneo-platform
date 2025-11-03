import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Req,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { AppBridgeService } from './app-bridge.service';

@ApiTags('app-bridge')
@Controller('app-bridge')
export class AppBridgeController {
  private readonly logger = new Logger(AppBridgeController.name);

  constructor(private readonly appBridgeService: AppBridgeService) {}

  @Get('config')
  @ApiOperation({ summary: 'Obtenir la configuration App Bridge' })
  @ApiQuery({ name: 'shop', description: 'Domaine du shop Shopify' })
  @ApiResponse({ status: 200, description: 'Configuration App Bridge retournée' })
  async getAppBridgeConfig(@Query('shop') shop: string) {
    try {
      if (!shop) {
        throw new HttpException('Le paramètre shop est requis', HttpStatus.BAD_REQUEST);
      }

      const config = await this.appBridgeService.getAppBridgeConfig(shop);
      
      return {
        success: true,
        data: config,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de la config App Bridge:', error);
      throw new HttpException(
        'Erreur lors de la récupération de la configuration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('authenticate')
  @ApiOperation({ summary: 'Authentifier l\'utilisateur via App Bridge' })
  @ApiResponse({ status: 200, description: 'Authentification réussie' })
  async authenticate(@Body() body: any, @Req() req: Request) {
    try {
      const shop = req.headers['x-shopify-shop-domain'] as string;
      
      if (!shop) {
        throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
      }

      const authResult = await this.appBridgeService.authenticate(shop, body);
      
      return {
        success: true,
        data: authResult,
      };
    } catch (error) {
      this.logger.error('Erreur lors de l\'authentification App Bridge:', error);
      throw new HttpException(
        'Erreur lors de l\'authentification',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('session')
  @ApiOperation({ summary: 'Obtenir la session App Bridge' })
  @ApiQuery({ name: 'shop', description: 'Domaine du shop Shopify' })
  @ApiResponse({ status: 200, description: 'Session retournée' })
  async getSession(@Query('shop') shop: string) {
    try {
      if (!shop) {
        throw new HttpException('Le paramètre shop est requis', HttpStatus.BAD_REQUEST);
      }

      const session = await this.appBridgeService.getSession(shop);
      
      return {
        success: true,
        data: session,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de la session:', error);
      throw new HttpException(
        'Erreur lors de la récupération de la session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('session')
  @ApiOperation({ summary: 'Créer une nouvelle session App Bridge' })
  @ApiResponse({ status: 200, description: 'Session créée avec succès' })
  async createSession(@Body() body: any, @Req() req: Request) {
    try {
      const shop = req.headers['x-shopify-shop-domain'] as string;
      
      if (!shop) {
        throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
      }

      const session = await this.appBridgeService.createSession(shop, body);
      
      return {
        success: true,
        data: session,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la création de la session:', error);
      throw new HttpException(
        'Erreur lors de la création de la session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('session')
  @ApiOperation({ summary: 'Mettre à jour la session App Bridge' })
  @ApiResponse({ status: 200, description: 'Session mise à jour avec succès' })
  async updateSession(@Body() body: any, @Req() req: Request) {
    try {
      const shop = req.headers['x-shopify-shop-domain'] as string;
      
      if (!shop) {
        throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
      }

      const session = await this.appBridgeService.updateSession(shop, body);
      
      return {
        success: true,
        data: session,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour de la session:', error);
      throw new HttpException(
        'Erreur lors de la mise à jour de la session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('session')
  @ApiOperation({ summary: 'Supprimer la session App Bridge' })
  @ApiResponse({ status: 200, description: 'Session supprimée avec succès' })
  async deleteSession(@Req() req: Request) {
    try {
      const shop = req.headers['x-shopify-shop-domain'] as string;
      
      if (!shop) {
        throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
      }

      await this.appBridgeService.deleteSession(shop);
      
      return {
        success: true,
        message: 'Session supprimée avec succès',
      };
    } catch (error) {
      this.logger.error('Erreur lors de la suppression de la session:', error);
      throw new HttpException(
        'Erreur lors de la suppression de la session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('user')
  @ApiOperation({ summary: 'Obtenir les informations de l\'utilisateur connecté' })
  @ApiQuery({ name: 'shop', description: 'Domaine du shop Shopify' })
  @ApiResponse({ status: 200, description: 'Informations utilisateur retournées' })
  async getCurrentUser(@Query('shop') shop: string) {
    try {
      if (!shop) {
        throw new HttpException('Le paramètre shop est requis', HttpStatus.BAD_REQUEST);
      }

      const user = await this.appBridgeService.getCurrentUser(shop);
      
      return {
        success: true,
        data: user,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw new HttpException(
        'Erreur lors de la récupération de l\'utilisateur',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('shop')
  @ApiOperation({ summary: 'Obtenir les informations du shop' })
  @ApiQuery({ name: 'shop', description: 'Domaine du shop Shopify' })
  @ApiResponse({ status: 200, description: 'Informations du shop retournées' })
  async getShopInfo(@Query('shop') shop: string) {
    try {
      if (!shop) {
        throw new HttpException('Le paramètre shop est requis', HttpStatus.BAD_REQUEST);
      }

      const shopInfo = await this.appBridgeService.getShopInfo(shop);
      
      return {
        success: true,
        data: shopInfo,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des infos du shop:', error);
      throw new HttpException(
        'Erreur lors de la récupération des informations du shop',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('navigation')
  @ApiOperation({ summary: 'Naviguer vers une page dans l\'admin Shopify' })
  @ApiResponse({ status: 200, description: 'Navigation effectuée avec succès' })
  async navigateToPage(@Body() body: any, @Req() req: Request) {
    try {
      const shop = req.headers['x-shopify-shop-domain'] as string;
      
      if (!shop) {
        throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
      }

      const result = await this.appBridgeService.navigateToPage(shop, body);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la navigation:', error);
      throw new HttpException(
        'Erreur lors de la navigation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('modal')
  @ApiOperation({ summary: 'Ouvrir une modal dans l\'admin Shopify' })
  @ApiResponse({ status: 200, description: 'Modal ouverte avec succès' })
  async openModal(@Body() body: any, @Req() req: Request) {
    try {
      const shop = req.headers['x-shopify-shop-domain'] as string;
      
      if (!shop) {
        throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
      }

      const result = await this.appBridgeService.openModal(shop, body);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Erreur lors de l\'ouverture de la modal:', error);
      throw new HttpException(
        'Erreur lors de l\'ouverture de la modal',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('toast')
  @ApiOperation({ summary: 'Afficher un toast dans l\'admin Shopify' })
  @ApiResponse({ status: 200, description: 'Toast affiché avec succès' })
  async showToast(@Body() body: any, @Req() req: Request) {
    try {
      const shop = req.headers['x-shopify-shop-domain'] as string;
      
      if (!shop) {
        throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
      }

      const result = await this.appBridgeService.showToast(shop, body);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Erreur lors de l\'affichage du toast:', error);
      throw new HttpException(
        'Erreur lors de l\'affichage du toast',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('context')
  @ApiOperation({ summary: 'Obtenir le contexte de l\'application' })
  @ApiResponse({ status: 200, description: 'Contexte retourné' })
  async getAppContext(@Body() body: any, @Req() req: Request) {
    try {
      const shop = req.headers['x-shopify-shop-domain'] as string;
      
      if (!shop) {
        throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
      }

      const context = await this.appBridgeService.getAppContext(shop, body);
      
      return {
        success: true,
        data: context,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération du contexte:', error);
      throw new HttpException(
        'Erreur lors de la récupération du contexte',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}



