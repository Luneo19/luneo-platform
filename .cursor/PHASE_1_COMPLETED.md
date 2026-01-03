# Phase 1 Completed - Schema Prisma

## Date: 2024-12-19
## Durée: ~30 minutes

## ✅ Modifications Effectuées

### 1. Enums Ajoutés

- ✅ `SubscriptionPlan` (FREE, STARTER, PROFESSIONAL, ENTERPRISE)
- ✅ `SubscriptionStatus` (ACTIVE, PAST_DUE, CANCELED, TRIALING)
- ✅ `GenerationStatus` (PENDING, PROCESSING, COMPLETED, FAILED, EXPIRED)
- ✅ `CustomizationType` (TEXT, IMAGE, COLOR, PATTERN, FONT, SIZE, POSITION)
- ✅ `ProductStatus` (DRAFT, ACTIVE, ARCHIVED)
- ✅ `WebhookEvent` (GENERATION_STARTED, GENERATION_COMPLETED, GENERATION_FAILED, AR_VIEW)

### 2. Modèle Brand Mis à Jour

**Champs ajoutés**:
- `subscriptionPlan` (SubscriptionPlan, default: FREE)
- `subscriptionStatus` (SubscriptionStatus, default: TRIALING)
- `trialEndsAt` (DateTime?)
- `monthlyGenerations` (Int, default: 0)
- `maxMonthlyGenerations` (Int, default: 100)
- `maxProducts` (Int, default: 5)
- `arEnabled` (Boolean, default: false)
- `whiteLabel` (Boolean, default: false)
- `deletedAt` (DateTime?)

**Relations ajoutées**:
- `clientSettings` (ClientSettings?)
- `generations` (Generation[])
- `templates` (Template[])
- `invoices` (Invoice[])

**Index ajoutés**:
- `subscriptionPlan`
- `subscriptionStatus`
- `deletedAt`

### 3. Modèle ClientSettings Créé

Nouveau modèle séparé pour les settings du client (extrait de `Brand.settings` JSON):

- `primaryColor`, `secondaryColor`
- `fontFamily`, `borderRadius`
- `defaultAiProvider`, `customApiKey`
- `defaultQuality`, `defaultStyle`
- `arTrackingType`, `arQuality`
- `emailNotifications`, `webhookEnabled`

### 4. Modèle Product Mis à Jour

**Champs ajoutés**:
- `slug` (String) - Pour URLs
- `baseImage`, `baseImageUrl`, `thumbnailUrl`
- `promptTemplate`, `negativePrompt`
- `aiProvider` (default: "openai")
- `generationQuality` (default: "standard")
- `outputFormat` (default: "png")
- `outputWidth`, `outputHeight` (default: 1024)
- `arEnabled` (default: true)
- `arTrackingType` (default: "surface")
- `arScale` (default: 1.0)
- `arOffset` (Json?)
- `status` (ProductStatus, default: DRAFT)
- `category`, `tags`
- `publishedAt`

**Relations ajoutées**:
- `customizationZones` (CustomizationZone[])
- `generations` (Generation[])
- `templates` (Template[])

**Index ajoutés**:
- `status`
- `@@unique([brandId, slug])`

### 5. Modèle CustomizationZone Créé

Nouveau modèle pour les zones de personnalisation du widget:

- Position & dimensions (positionX, positionY, width, height, rotation)
- Type (CustomizationType)
- Contraintes (maxLength, allowedChars, allowedFonts, allowedColors, etc.)
- Valeurs par défaut (defaultValue, defaultFont, defaultColor, defaultSize)
- `renderStyle` (default: "engraved")
- `order`, `required`

### 6. Modèle Template Créé

Nouveau modèle pour les templates de prompts:

- `promptTemplate`, `negativePrompt`
- `variables` (Json)
- `aiProvider`, `model`, `quality`, `style`
- `exampleOutputs` (String[])
- `isDefault`, `isActive`

### 7. Modèle Generation Créé

Nouveau modèle pour les générations depuis le widget (distinct de `Design` et `AIGeneration`):

- `publicId` (unique, pour accès public)
- `sessionId` (pour tracking)
- `customizations` (Json)
- `userPrompt`, `finalPrompt`, `negativePrompt`
- `aiProvider`, `model`, `quality`
- `status` (GenerationStatus)
- `outputUrl`, `thumbnailUrl`, `arModelUrl`
- `aiResponse`, `processingTime`, `tokensUsed`, `cost`
- `errorMessage`, `errorCode`, `retryCount`
- Tracking: `ipAddress`, `userAgent`, `referrer`
- Analytics: `viewedInAr`, `arViewCount`, `downloadCount`, `sharedCount`
- `expiresAt` (pour nettoyage automatique)

### 8. Modèle Invoice Créé

Nouveau modèle pour la facturation:

- `stripeInvoiceId` (unique)
- `amount`, `currency`, `status`
- `periodStart`, `periodEnd`
- `pdfUrl`
- `paidAt`

### 9. Modèle UsageRecord Créé

Nouveau modèle pour le tracking d'usage:

- `type` (generation, ar_view, api_call, etc.)
- `count`
- `metadata` (Json)
- `recordedAt`

### 10. Modèle Webhook Mis à Jour

**Champs modifiés/ajoutés**:
- `name` (String)
- `secret` (String) - Pour signature
- `events` (WebhookEvent[]) - Array d'events supportés
- `isActive` (Boolean)
- `lastCalledAt`, `lastStatusCode`, `failureCount`

**Relations ajoutées**:
- `webhookLogs` (WebhookLog[])

### 11. Modèle WebhookLog Mis à Jour

**Champs modifiés**:
- `event` (au lieu de `topic`)
- `statusCode`, `response`, `error`, `duration`
- Supprimé: `topic`, `shopDomain`, `status`, `processedAt`

**Relations ajoutées**:
- `webhook` (Webhook?)

## 📊 Statistiques

- **Enums ajoutés**: 6
- **Modèles créés**: 5 (ClientSettings, CustomizationZone, Template, Generation, Invoice, UsageRecord)
- **Modèles modifiés**: 4 (Brand, Product, Webhook, WebhookLog)
- **Champs ajoutés**: ~40
- **Relations ajoutées**: ~10
- **Index ajoutés**: ~15

## ✅ Validation

- ✅ Schema formaté avec `prisma format`
- ✅ Schema validé avec `prisma validate`
- ✅ Aucune erreur de syntaxe
- ✅ Toutes les relations sont correctes

## ⚠️ Prochaines Étapes

### Migration Prisma

**IMPORTANT**: Avant d'exécuter la migration, il faut:

1. **Backup de la base de données** (obligatoire)
2. **Migration incrémentale**:
   ```bash
   cd apps/backend
   npx prisma migrate dev --name add_saas_personalization_models
   ```
3. **Générer le client Prisma**:
   ```bash
   npx prisma generate
   ```

### Points d'Attention

1. **Brand.settings (JSON)**: Les données existantes dans `Brand.settings` doivent être migrées vers `ClientSettings`
2. **Product.slug**: Tous les produits existants doivent avoir un `slug` généré
3. **Relations**: Vérifier que les relations avec les modèles existants (Design, AIGeneration) ne causent pas de conflits

## 📝 Notes

- Le modèle `Brand` est conservé (pas renommé en `Client`) pour éviter de casser le code existant
- Le modèle `Generation` est distinct de `Design` et `AIGeneration` pour éviter les conflits
- Les champs AR sont ajoutés à `Product` pour supporter le widget AR
- Les templates de prompts sont séparés pour permettre la réutilisation

---

**Phase 1 terminée avec succès** ✅
