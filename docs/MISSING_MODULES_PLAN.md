# 📋 PLAN MODULES MANQUANTS - LUNEO ENTERPRISE

## 📋 Vue d'ensemble

Plan détaillé pour créer les modules manquants de Phase 2 : Mobile App, API Publique, Marketplace, Internationalisation, et White-label.

---

## 🎯 Modules à Créer

### **📱 1. Mobile App (React Native)**
**Priorité : HAUTE | Durée : 8 semaines**

### **🔑 2. API Publique**
**Priorité : HAUTE | Durée : 6 semaines**

### **🎨 3. Marketplace**
**Priorité : MOYENNE | Durée : 10 semaines**

### **🌍 4. Internationalisation (i18n)**
**Priorité : MOYENNE | Durée : 4 semaines**

### **⚙️ 5. White-label**
**Priorité : BASSE | Durée : 8 semaines**

---

## 📱 MODULE 1: MOBILE APP (React Native)

### **🏗️ Architecture Mobile**

```
mobile/
├── src/
│   ├── components/           # Composants React Native
│   │   ├── ui/              # Base UI components
│   │   ├── forms/           # Form components
│   │   ├── charts/          # Chart components
│   │   └── camera/          # Camera components
│   ├── screens/             # Écrans de l'app
│   │   ├── auth/            # Authentification
│   │   ├── dashboard/       # Dashboard
│   │   ├── ai-studio/       # Studio IA
│   │   ├── products/        # Gestion produits
│   │   └── profile/         # Profil utilisateur
│   ├── navigation/          # Navigation
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── TabNavigator.tsx
│   ├── services/            # Services API
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── storage.ts
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useDesigns.ts
│   │   └── useCamera.ts
│   ├── store/               # State management
│   │   ├── authStore.ts
│   │   └── appStore.ts
│   └── utils/               # Utilities
│       ├── constants.ts
│       └── helpers.ts
├── android/                 # Android spécifique
├── ios/                     # iOS spécifique
└── package.json
```

### **📦 Dépendances Mobile**

```json
{
  "dependencies": {
    "react-native": "0.73.0",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "react-native-screens": "^3.27.0",
    "react-native-safe-area-context": "^4.8.2",
    "react-native-gesture-handler": "^2.14.0",
    "react-native-reanimated": "^3.6.2",
    "react-native-vector-icons": "^10.0.3",
    "react-native-camera": "^4.2.1",
    "react-native-image-picker": "^7.1.0",
    "react-native-async-storage": "^1.21.0",
    "react-native-keychain": "^8.1.3",
    "react-native-biometrics": "^3.0.1",
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.5.7",
    "react-hook-form": "^7.63.0",
    "react-native-toast-message": "^2.2.0",
    "react-native-paper": "^5.12.3",
    "react-native-chart-kit": "^6.12.0",
    "react-native-svg": "^14.1.0"
  }
}
```

### **🔧 Backend Mobile Endpoints**

```typescript
// backend/src/modules/mobile/mobile.module.ts
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MobileController],
  providers: [MobileService],
})
export class MobileModule {}

// backend/src/modules/mobile/mobile.controller.ts
@Controller('api/v1/mobile')
export class MobileController {
  
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.mobileService.uploadImage(file);
  }

  @Get('designs/:id/preview')
  async getDesignPreview(@Param('id') id: string) {
    return this.mobileService.getDesignPreview(id);
  }

  @Post('designs/generate')
  async generateDesign(@Body() dto: GenerateDesignDto) {
    return this.mobileService.generateDesign(dto);
  }

  @Get('analytics/summary')
  async getAnalyticsSummary(@Query() query: AnalyticsQueryDto) {
    return this.mobileService.getAnalyticsSummary(query);
  }
}
```

### **📊 Timeline Mobile App**

```
Semaine 1-2 : Setup React Native + Navigation
Semaine 3-4 : Authentication + Core Screens
Semaine 5-6 : AI Studio + Camera Integration
Semaine 7-8 : Polish + Testing + Deployment
```

---

## 🔑 MODULE 2: API PUBLIQUE

### **🏗️ Architecture API Publique**

```
backend/src/modules/public-api/
├── public-api.module.ts
├── public-api.controller.ts
├── public-api.service.ts
├── dto/
│   ├── api-key.dto.ts
│   ├── rate-limit.dto.ts
│   └── webhook.dto.ts
├── guards/
│   ├── api-key.guard.ts
│   └── rate-limit.guard.ts
├── interceptors/
│   ├── api-logging.interceptor.ts
│   └── api-response.interceptor.ts
└── schemas/
    ├── api-key.schema.ts
    └── webhook.schema.ts
```

### **📊 Modèles Database API Publique**

```sql
-- backend/prisma/migrations/add_public_api.sql

-- Table pour les clés API
CREATE TABLE "PublicApiKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "brandId" TEXT NOT NULL,
    "permissions" TEXT[] NOT NULL DEFAULT '{}',
    "rateLimit" INTEGER NOT NULL DEFAULT 1000,
    "rateLimitPeriod" INTEGER NOT NULL DEFAULT 3600, -- 1 heure
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicApiKey_pkey" PRIMARY KEY ("id")
);

-- Table pour les webhooks publics
CREATE TABLE "PublicWebhook" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[] NOT NULL,
    "secret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "retryCount" INTEGER NOT NULL DEFAULT 3,
    "lastTriggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicWebhook_pkey" PRIMARY KEY ("id")
);

-- Table pour les logs API
CREATE TABLE "ApiLog" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiLog_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "idx_public_api_key_brand" ON "PublicApiKey"("brandId");
CREATE INDEX "idx_public_webhook_api_key" ON "PublicWebhook"("apiKeyId");
CREATE INDEX "idx_api_log_api_key" ON "ApiLog"("apiKeyId");
CREATE INDEX "idx_api_log_created" ON "ApiLog"("createdAt");
```

### **🔧 Controllers API Publique**

```typescript
// backend/src/modules/public-api/public-api.controller.ts
@Controller('api/v1/public')
@UseGuards(ApiKeyGuard, RateLimitGuard)
@UseInterceptors(ApiLoggingInterceptor, ApiResponseInterceptor)
export class PublicApiController {

  @Get('products')
  async getProducts(@Query() query: GetProductsDto) {
    return this.publicApiService.getProducts(query);
  }

  @Post('designs')
  async createDesign(@Body() dto: CreateDesignDto) {
    return this.publicApiService.createDesign(dto);
  }

  @Get('designs/:id')
  async getDesign(@Param('id') id: string) {
    return this.publicApiService.getDesign(id);
  }

  @Post('orders')
  async createOrder(@Body() dto: CreateOrderDto) {
    return this.publicApiService.createOrder(dto);
  }

  @Get('analytics')
  async getAnalytics(@Query() query: AnalyticsQueryDto) {
    return this.publicApiService.getAnalytics(query);
  }
}
```

### **📱 Frontend API Documentation**

```
frontend/src/app/api-docs/
├── page.tsx                  # Page principale documentation
├── components/
│   ├── ApiExplorer.tsx       # Explorateur API interactif
│   ├── CodeExample.tsx       # Exemples de code
│   ├── SdkGenerator.tsx      # Générateur SDK
│   └── RateLimitInfo.tsx     # Info limites de taux
└── lib/
    ├── api-examples.ts       # Exemples d'utilisation
    └── sdk-generator.ts      # Logique génération SDK
```

### **📊 Timeline API Publique**

```
Semaine 1-2 : Backend Module + Database
Semaine 3-4 : Authentication + Rate Limiting
Semaine 5-6 : Frontend Documentation + SDK
```

---

## 🎨 MODULE 3: MARKETPLACE

### **🏗️ Architecture Marketplace**

```
backend/src/modules/marketplace/
├── marketplace.module.ts
├── marketplace.controller.ts
├── marketplace.service.ts
├── dto/
│   ├── listing.dto.ts
│   ├── purchase.dto.ts
│   └── review.dto.ts
├── entities/
│   ├── marketplace-design.entity.ts
│   └── marketplace-review.entity.ts
└── schemas/
    ├── listing.schema.ts
    └── purchase.schema.ts
```

### **📊 Modèles Database Marketplace**

```sql
-- backend/prisma/migrations/add_marketplace.sql

-- Table pour les designs publics
CREATE TABLE "MarketplaceDesign" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "tags" TEXT[] NOT NULL DEFAULT '{}',
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "license" TEXT NOT NULL DEFAULT 'STANDARD',
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0.0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceDesign_pkey" PRIMARY KEY ("id")
);

-- Table pour les avis
CREATE TABLE "MarketplaceReview" (
    "id" TEXT NOT NULL,
    "marketplaceDesignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
    "comment" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceReview_pkey" PRIMARY KEY ("id")
);

-- Table pour les achats
CREATE TABLE "MarketplacePurchase" (
    "id" TEXT NOT NULL,
    "marketplaceDesignId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "license" TEXT NOT NULL,
    "downloadUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplacePurchase_pkey" PRIMARY KEY ("id")
);
```

### **📱 Frontend Marketplace**

```
frontend/src/app/marketplace/
├── page.tsx                  # Page principale marketplace
├── components/
│   ├── DesignCard.tsx        # Carte design
│   ├── FilterSidebar.tsx     # Filtres sidebar
│   ├── SearchBar.tsx         # Barre de recherche
│   ├── CategoryTabs.tsx      # Onglets catégories
│   ├── DesignPreview.tsx     # Prévisualisation
│   ├── PurchaseModal.tsx     # Modal d'achat
│   └── ReviewSection.tsx     # Section avis
└── lib/
    ├── marketplace-api.ts    # API marketplace
    └── search-utils.ts       # Utilitaires recherche
```

### **📊 Timeline Marketplace**

```
Semaine 1-2 : Backend Module + Database
Semaine 3-4 : Listing + Purchase Logic
Semaine 5-6 : Frontend Marketplace
Semaine 7-8 : Reviews + Search
Semaine 9-10 : Polish + Testing
```

---

## 🌍 MODULE 4: INTERNATIONALISATION (i18n)

### **🏗️ Architecture i18n**

```
backend/src/modules/i18n/
├── i18n.module.ts
├── i18n.service.ts
├── dto/
│   ├── translation.dto.ts
│   └── locale.dto.ts
├── entities/
│   ├── translation.entity.ts
│   └── locale.entity.ts
└── schemas/
    ├── translation.schema.ts
    └── locale.schema.ts
```

### **📊 Modèles Database i18n**

```sql
-- backend/prisma/migrations/add_i18n.sql

-- Table pour les langues supportées
CREATE TABLE "Locale" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "nativeName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Locale_pkey" PRIMARY KEY ("id")
);

-- Table pour les traductions
CREATE TABLE "Translation" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "context" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Translation_pkey" PRIMARY KEY ("id"),
    UNIQUE("key", "locale")
);

-- Table pour les traductions dynamiques (contenu)
CREATE TABLE "DynamicTranslation" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicTranslation_pkey" PRIMARY KEY ("id"),
    UNIQUE("entityType", "entityId", "field", "locale")
);
```

### **📱 Frontend i18n**

```
frontend/src/i18n/
├── index.ts                  # Configuration i18n
├── locales/
│   ├── en/
│   │   ├── common.json
│   │   ├── dashboard.json
│   │   ├── auth.json
│   │   └── marketplace.json
│   ├── fr/
│   │   ├── common.json
│   │   ├── dashboard.json
│   │   ├── auth.json
│   │   └── marketplace.json
│   └── es/
│       ├── common.json
│       ├── dashboard.json
│       ├── auth.json
│       └── marketplace.json
├── components/
│   ├── LanguageSwitcher.tsx
│   └── TranslationProvider.tsx
└── hooks/
    ├── useTranslation.ts
    └── useLocale.ts
```

### **🔧 Configuration Next.js i18n**

```javascript
// frontend/next.config.mjs
export default {
  i18n: {
    locales: ['en', 'fr', 'es', 'de', 'it'],
    defaultLocale: 'en',
    localeDetection: true,
  },
  // Configuration next-intl
  experimental: {
    appDir: true,
  },
};
```

### **📊 Timeline i18n**

```
Semaine 1 : Backend Module + Database
Semaine 2 : Frontend Setup + Translations
Semaine 3 : Dynamic Content + Admin Interface
Semaine 4 : Testing + Polish
```

---

## ⚙️ MODULE 5: WHITE-LABEL

### **🏗️ Architecture White-label**

```
backend/src/modules/white-label/
├── white-label.module.ts
├── white-label.controller.ts
├── white-label.service.ts
├── dto/
│   ├── theme.dto.ts
│   ├── branding.dto.ts
│   └── domain.dto.ts
├── entities/
│   ├── theme.entity.ts
│   ├── branding.entity.ts
│   └── custom-domain.entity.ts
└── schemas/
    ├── theme.schema.ts
    └── branding.schema.ts
```

### **📊 Modèles Database White-label**

```sql
-- backend/prisma/migrations/add_white_label.sql

-- Table pour les thèmes personnalisés
CREATE TABLE "CustomTheme" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,
    "secondaryColor" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL,
    "backgroundColor" TEXT NOT NULL,
    "textColor" TEXT NOT NULL,
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "borderRadius" TEXT NOT NULL DEFAULT '8px',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "customCss" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomTheme_pkey" PRIMARY KEY ("id")
);

-- Table pour les domaines personnalisés
CREATE TABLE "CustomDomain" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "domain" TEXT NOT NULL UNIQUE,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "sslCertificate" TEXT,
    "sslExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomDomain_pkey" PRIMARY KEY ("id")
);

-- Table pour les assets personnalisés
CREATE TABLE "CustomAsset" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- logo, favicon, background, etc.
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomAsset_pkey" PRIMARY KEY ("id")
);
```

### **📱 Frontend White-label**

```
frontend/src/app/white-label/
├── page.tsx                  # Page configuration white-label
├── components/
│   ├── ThemeEditor.tsx       # Éditeur de thème
│   ├── ColorPicker.tsx       # Sélecteur de couleurs
│   ├── FontSelector.tsx      # Sélecteur de polices
│   ├── LogoUploader.tsx      # Upload de logo
│   ├── DomainManager.tsx     # Gestion domaines
│   └── PreviewPanel.tsx      # Panneau de prévisualisation
└── lib/
    ├── theme-generator.ts    # Générateur de thème
    └── domain-utils.ts       # Utilitaires domaines
```

### **🎨 Système de Thèmes Dynamiques**

```typescript
// frontend/src/lib/theme-generator.ts
export class ThemeGenerator {
  static generateCSS(theme: CustomTheme): string {
    return `
      :root {
        --primary-color: ${theme.primaryColor};
        --secondary-color: ${theme.secondaryColor};
        --accent-color: ${theme.accentColor};
        --background-color: ${theme.backgroundColor};
        --text-color: ${theme.textColor};
        --font-family: ${theme.fontFamily};
        --border-radius: ${theme.borderRadius};
      }
      
      ${theme.customCss || ''}
    `;
  }

  static generateTailwindConfig(theme: CustomTheme) {
    return {
      theme: {
        extend: {
          colors: {
            primary: theme.primaryColor,
            secondary: theme.secondaryColor,
            accent: theme.accentColor,
          },
          fontFamily: {
            sans: [theme.fontFamily, 'sans-serif'],
          },
          borderRadius: {
            DEFAULT: theme.borderRadius,
          },
        },
      },
    };
  }
}
```

### **📊 Timeline White-label**

```
Semaine 1-2 : Backend Module + Database
Semaine 3-4 : Theme System + CSS Generation
Semaine 5-6 : Frontend Editor + Preview
Semaine 7-8 : Domain Management + SSL
```

---

## 🎯 PLAN D'IMPLÉMENTATION GLOBAL

### **📅 Timeline Q1 2025**

```
Janvier 2025:
Semaine 1-2  : Mobile App Setup + Navigation
Semaine 3-4  : API Publique Backend + Database

Février 2025:
Semaine 5-6  : Mobile App Core Features
Semaine 7-8  : API Publique Frontend + Documentation

Mars 2025:
Semaine 9-10 : Marketplace Backend + Database
Semaine 11-12: Marketplace Frontend + Reviews
Semaine 13-14: i18n Backend + Frontend
Semaine 15-16: White-label Backend + Theme System
```

### **📊 Ressources Nécessaires**

#### **👥 Équipe**
- **1 Lead Developer** : Architecture et backend
- **1 Frontend Developer** : UI/UX et composants
- **1 Mobile Developer** : React Native
- **1 DevOps** : Infrastructure et déploiement

#### **💰 Budget Estimé**
- **Développement** : 40 semaines × 4 devs = 160 semaines-dev
- **Infrastructure** : Vercel Pro + Hetzner + Services
- **Outils** : Licences développement
- **Total estimé** : €80,000 - €120,000

### **🎯 Objectifs par Module**

#### **Mobile App**
- **Users** : 10,000+ downloads
- **Rating** : 4.5+ stars
- **Performance** : < 2s load time

#### **API Publique**
- **Developers** : 100+ intégrations
- **Endpoints** : 50+ endpoints
- **Documentation** : 100% coverage

#### **Marketplace**
- **Designs** : 1,000+ designs publics
- **Revenue** : €10,000+ monthly
- **Reviews** : 4.0+ average rating

#### **i18n**
- **Languages** : 5+ langues supportées
- **Coverage** : 90%+ traductions
- **Users** : 50%+ utilisateurs non-anglophones

#### **White-label**
- **Clients** : 10+ clients white-label
- **Revenue** : €50,000+ ARR
- **Satisfaction** : 90%+ satisfaction client

---

**🚀 Ce plan garantit l'expansion complète de Luneo Enterprise avec des modules de classe mondiale !**

