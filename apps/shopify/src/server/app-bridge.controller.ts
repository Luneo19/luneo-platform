import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  AppBridgeService,
  AppBridgeConfig,
  AppBridgeSession,
  AppBridgeUser,
  AppBridgeShop,
  AppBridgeContext,
  ModalResult,
  ToastResult,
  NavigationResult,
  AuthResult,
  AuthenticationDto,
  CreateSessionDto,
  ModalData,
  ToastData,
  NavigationData,
  AppContextDto,
} from './app-bridge.service';

const SHOP_HEADER = 'x-shopify-shop-domain';

type SuccessWithData<T> = { success: true; data: T };
type SuccessMessage = { success: true; message: string };

@ApiTags('app-bridge')
@Controller('app-bridge')
export class AppBridgeController {
  private readonly logger = new Logger(AppBridgeController.name);

  constructor(private readonly appBridgeService: AppBridgeService) {}

  private extractShopDomain(shopDomain?: string): string {
    if (!shopDomain) {
      throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
    }
    return shopDomain;
  }

  private extractShopFromQuery(shop?: string): string {
    if (!shop) {
      throw new HttpException('Le paramètre shop est requis', HttpStatus.BAD_REQUEST);
    }
    return shop;
  }

  private handleError(context: string, error: unknown): never {
    this.logger.error(context, error);
    throw new HttpException(context, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @Get('config')
  @ApiOperation({ summary: 'Obtenir la configuration App Bridge' })
  @ApiQuery({ name: 'shop', description: 'Domaine du shop Shopify' })
  @ApiResponse({ status: 200, description: 'Configuration App Bridge retournée' })
  async getAppBridgeConfig(@Query('shop') shop: string): Promise<SuccessWithData<AppBridgeConfig>> {
    try {
      const config = await this.appBridgeService.getAppBridgeConfig(this.extractShopFromQuery(shop));
      return { success: true, data: config };
    } catch (error) {
      this.handleError("Erreur lors de la récupération de la configuration App Bridge", error);
    }
  }

  @Post('authenticate')
  @ApiOperation({ summary: "Authentifier l'utilisateur via App Bridge" })
  @ApiResponse({ status: 200, description: 'Authentification réussie' })
  async authenticate(
    @Body() body: AuthenticationDto,
    @Headers(SHOP_HEADER) shopDomain?: string,
  ): Promise<SuccessWithData<AuthResult>> {
    try {
      const result = await this.appBridgeService.authenticate(this.extractShopDomain(shopDomain), body);
      return { success: true, data: result };
    } catch (error) {
      this.handleError("Erreur lors de l'authentification App Bridge", error);
    }
  }

  @Get('session')
  @ApiOperation({ summary: 'Obtenir la session App Bridge' })
  @ApiQuery({ name: 'shop', description: 'Domaine du shop Shopify' })
  @ApiResponse({ status: 200, description: 'Session retournée' })
  async getSession(@Query('shop') shop: string): Promise<SuccessWithData<AppBridgeSession | null>> {
    try {
      const session = await this.appBridgeService.getSession(this.extractShopFromQuery(shop));
      return { success: true, data: session };
    } catch (error) {
      this.handleError('Erreur lors de la récupération de la session', error);
    }
  }

  @Post('session')
  @ApiOperation({ summary: 'Créer une nouvelle session App Bridge' })
  @ApiResponse({ status: 200, description: 'Session créée avec succès' })
  async createSession(
    @Body() body: CreateSessionDto,
    @Headers(SHOP_HEADER) shopDomain?: string,
  ): Promise<SuccessWithData<AppBridgeSession>> {
    try {
      const session = await this.appBridgeService.createSession(this.extractShopDomain(shopDomain), body);
      return { success: true, data: session };
    } catch (error) {
      this.handleError('Erreur lors de la création de la session', error);
    }
  }

  @Put('session')
  @ApiOperation({ summary: 'Mettre à jour la session App Bridge' })
  @ApiResponse({ status: 200, description: 'Session mise à jour avec succès' })
  async updateSession(
    @Body() body: Partial<AppBridgeSession>,
    @Headers(SHOP_HEADER) shopDomain?: string,
  ): Promise<SuccessWithData<AppBridgeSession>> {
    try {
      const session = await this.appBridgeService.updateSession(this.extractShopDomain(shopDomain), body);
      return { success: true, data: session };
    } catch (error) {
      this.handleError('Erreur lors de la mise à jour de la session', error);
    }
  }

  @Delete('session')
  @ApiOperation({ summary: 'Supprimer la session App Bridge' })
  @ApiResponse({ status: 200, description: 'Session supprimée avec succès' })
  async deleteSession(
    @Headers(SHOP_HEADER) shopDomain?: string,
  ): Promise<SuccessMessage> {
    try {
      await this.appBridgeService.deleteSession(this.extractShopDomain(shopDomain));
      return { success: true, message: 'Session supprimée avec succès' };
    } catch (error) {
      this.handleError('Erreur lors de la suppression de la session', error);
    }
  }

  @Get('user')
  @ApiOperation({ summary: "Obtenir les informations de l'utilisateur connecté" })
  @ApiQuery({ name: 'shop', description: 'Domaine du shop Shopify' })
  @ApiResponse({ status: 200, description: 'Informations utilisateur retournées' })
  async getCurrentUser(@Query('shop') shop: string): Promise<SuccessWithData<AppBridgeUser>> {
    try {
      const user = await this.appBridgeService.getCurrentUser(this.extractShopFromQuery(shop));
      return { success: true, data: user };
    } catch (error) {
      this.handleError("Erreur lors de la récupération de l'utilisateur", error);
    }
  }

  @Get('shop')
  @ApiOperation({ summary: 'Obtenir les informations du shop' })
  @ApiQuery({ name: 'shop', description: 'Domaine du shop Shopify' })
  @ApiResponse({ status: 200, description: 'Informations du shop retournées' })
  async getShopInfo(@Query('shop') shop: string): Promise<SuccessWithData<AppBridgeShop>> {
    try {
      const shopInfo = await this.appBridgeService.getShopInfo(this.extractShopFromQuery(shop));
      return { success: true, data: shopInfo };
    } catch (error) {
      this.handleError('Erreur lors de la récupération des informations du shop', error);
    }
  }

  @Post('navigation')
  @ApiOperation({ summary: "Naviguer vers une page dans l'admin Shopify" })
  @ApiResponse({ status: 200, description: 'Navigation effectuée avec succès' })
  async navigateToPage(
    @Body() body: NavigationData,
    @Headers(SHOP_HEADER) shopDomain?: string,
  ): Promise<SuccessWithData<NavigationResult>> {
    try {
      const result = await this.appBridgeService.navigateToPage(this.extractShopDomain(shopDomain), body);
      return { success: true, data: result };
    } catch (error) {
      this.handleError('Erreur lors de la navigation', error);
    }
  }

  @Post('modal')
  @ApiOperation({ summary: "Ouvrir une modal dans l'admin Shopify" })
  @ApiResponse({ status: 200, description: 'Modal ouverte avec succès' })
  async openModal(
    @Body() body: ModalData,
    @Headers(SHOP_HEADER) shopDomain?: string,
  ): Promise<SuccessWithData<ModalResult>> {
    try {
      const result = await this.appBridgeService.openModal(this.extractShopDomain(shopDomain), body);
      return { success: true, data: result };
    } catch (error) {
      this.handleError("Erreur lors de l'ouverture de la modal", error);
    }
  }

  @Post('toast')
  @ApiOperation({ summary: "Afficher un toast dans l'admin Shopify" })
  @ApiResponse({ status: 200, description: 'Toast affiché avec succès' })
  async showToast(
    @Body() body: ToastData,
    @Headers(SHOP_HEADER) shopDomain?: string,
  ): Promise<SuccessWithData<ToastResult>> {
    try {
      const result = await this.appBridgeService.showToast(this.extractShopDomain(shopDomain), body);
      return { success: true, data: result };
    } catch (error) {
      this.handleError("Erreur lors de l'affichage du toast", error);
    }
  }

  @Post('context')
  @ApiOperation({ summary: "Obtenir le contexte de l'application" })
  @ApiResponse({ status: 200, description: 'Contexte retourné' })
  async getAppContext(
    @Body() body: AppContextDto,
    @Headers(SHOP_HEADER) shopDomain?: string,
  ): Promise<SuccessWithData<AppBridgeContext>> {
    try {
      const context = await this.appBridgeService.getAppContext(this.extractShopDomain(shopDomain), body);
      return { success: true, data: context };
    } catch (error) {
      this.handleError('Erreur lors de la récupération du contexte', error);
    }
  }
}