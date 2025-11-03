import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

// Controllers
import { OAuthController } from './oauth.controller';
import { WebhooksController } from './webhooks.controller';
import { BillingController } from './billing.controller';
import { AppBridgeController } from './app-bridge.controller';

// Services
import { ShopifyService } from './shopify.service';
import { WebhooksService } from './webhooks.service';
import { BillingService } from './billing.service';
import { AppBridgeService } from './app-bridge.service';

// Guards
import { ShopifyAuthGuard } from './guards/shopify-auth.guard';
import { HmacGuard } from './guards/hmac.guard';

// Utils
import { HmacUtils } from './utils/hmac';
import { RegisterWebhooks } from './utils/register-webhooks';
import { AppProxy } from './utils/app-proxy';

// Configuration
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  controllers: [
    OAuthController,
    WebhooksController,
    BillingController,
    AppBridgeController,
  ],
  providers: [
    // Services
    ShopifyService,
    WebhooksService,
    BillingService,
    AppBridgeService,
    
    // Utils
    HmacUtils,
    RegisterWebhooks,
    AppProxy,
    
    // Guards
    {
      provide: APP_GUARD,
      useClass: ShopifyAuthGuard,
    },
    HmacGuard,
  ],
  exports: [
    ShopifyService,
    WebhooksService,
    BillingService,
    AppBridgeService,
  ],
})
export class ShopifyModule {}



