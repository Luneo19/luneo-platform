# Rapport d'audit de sécurité – Luneo (Backend + Frontend)

**Date:** 21 février 2025  
**Périmètre:** `apps/backend`, `apps/frontend`  
**Objectif:** Vérifier la cohérence de la sécurité et du RBAC sur l’ensemble du projet.

---

## 1. Synthèse

| Catégorie | Statut | Commentaire |
|-----------|--------|-------------|
| Guards backend (JWT, Roles, Brand) | ✅ | Cohérent ; CommonModule applique JwtAuthGuard, RolesGuard, BrandScopedGuard globalement |
| Routes publiques @Public() | ✅ | Utilisées pour auth, health, webhooks, widgets, configurator public |
| RBAC (PLATFORM_ADMIN, BRAND_*, CONSUMER) | ✅ | Cohérent ; admin protégé par @Roles(PLATFORM_ADMIN) |
| Tokens (rotation, blacklist, expiration) | ✅ | TokenBlacklistService, rotation refresh, nettoyage |
| Rate limiting | ✅ | ThrottlerModule + GlobalRateLimitGuard (Redis), webhooks exclus |
| CSRF | ✅ | CsrfGuard global (CommonModule), skip GET/HEAD/OPTIONS et @Public() |
| Headers de sécurité | ✅ | Helmet (CSP, HSTS, X-Frame-Options, etc.) dans main.ts |
| Validation des entrées (DTOs) | ✅ | ValidationPipe global (whitelist, forbidNonWhitelisted), DTOs class-validator/Zod |
| Prisma scoped par brandId | ✅ | BrandOwnershipGuard injecte request.brandId ; corrections sur security/audit |
| Secrets | ✅ | Pas de secrets en dur ; config via ConfigService / env |
| Middleware frontend | ✅ | Routes protégées, admin par rôle, CSP, rate limit, CSRF |
| Stockage des tokens (frontend) | ⚠️ | Cookies httpOnly utilisés ; nettoyage localStorage conservé (legacy) |
| XSS | ⚠️ | dangerouslySetInnerHTML limité (JSON-LD, blog CMS, custom CSS) – voir section 6 |
| Fuite d’infos dans erreurs | ✅ | ErrorBoundary n’affiche stack qu’en développement |

---

## 2. Backend – Détail

### 2.1 Guards et endpoints

- **CommonModule** enregistre en **APP_GUARD** (ordre d’exécution) :  
  `CsrfGuard`, `JwtAuthGuard`, `RolesGuard`, `RateLimitGuard`, `BrandScopedGuard`.  
  **AppModule** enregistre en plus : `GlobalRateLimitGuard` (Throttler + Redis).

- Tous les controllers protégés ont soit :
  - un `@UseGuards(JwtAuthGuard, …)` au niveau classe (redondant avec le guard global mais explicite), soit
  - uniquement les guards globaux (JWT requis sauf `@Public()`).

- **Routes publiques** correctement marquées avec `@Public()` :
  - Auth : login, signup, refresh, forgot-password, reset-password, 2FA, OAuth callbacks, etc.
  - Health : `/health`, `/api/v1/health`
  - Webhooks : Stripe, WooCommerce, Shopify, PCE (HMAC/signature)
  - Widgets : try-on widget, widget controller
  - Configurator 3D : endpoints « public » (après correction ConfiguratorPublicAccess)
  - Partagé : designs/share, products (lecture publique), plans (lecture), referral (code), discount (code), billing (Stripe portal), AR viewer, generation (public), industry, monitoring Grafana
  - Admin : `POST /admin/create-admin` (protégé par `X-Setup-Key` + `SETUP_SECRET_KEY`)

- **Admin** : `@Controller('admin')` + `@UseGuards(JwtAuthGuard)` + `@Roles(UserRole.PLATFORM_ADMIN)` → seul PLATFORM_ADMIN peut accéder.

- **Brand / RBAC** :  
  - `BrandOwnershipGuard` (global) : pour BRAND_ADMIN/BRAND_USER, injecte `request.brandId = user.brandId` et bloque l’accès si `params.brandId !== user.brandId`.  
  - PLATFORM_ADMIN et CONSUMER/FABRICATOR ont des règles dédiées (bypass ou scope souple).

### 2.2 Tokens

- **Access** : JWT, expiration via config (`jwt.expiresIn`).
- **Refresh** : stocké en base, familles pour rotation, limite de sessions actives (MAX_SESSIONS_PER_USER), nettoyage par `TokenCleanupScheduler`.
- **Révocation** : `TokenBlacklistService` (Redis) ; `JwtStrategy` vérifie la blacklist via `iat` avant de valider le token.
- **Extraction** : cookie `access_token` / `accessToken` ou header `Authorization: Bearer`.

### 2.3 Rate limiting

- **GlobalRateLimitGuard** : Throttler + Redis (`ThrottlerRedisStorageService`), config `app.rateLimitTtl` / `app.rateLimitLimit`.
- Exclusions : OPTIONS, `/health`, webhooks (billing, woocommerce, shopify, pce/webhooks).
- Tracker : `user:id` si authentifié, sinon `ip:…`.

### 2.4 CSRF

- **CsrfGuard** (global) : pour POST/PUT/PATCH/DELETE, exige header `x-csrf-token` égal au cookie `csrf_token` ; skip pour `@Public()` et méthodes safe.
- Middleware `csrfTokenMiddleware` (main.ts) : pose le cookie `csrf_token` si absent.

### 2.5 Headers de sécurité (main.ts)

- Helmet : CSP, HSTS (maxAge 31536000, includeSubDomains, preload), X-Content-Type-Options, X-Frame-Options (deny), Referrer-Policy, Permissions-Policy.
- En production : HPP, redirection HTTPS si `x-forwarded-proto !== 'https'`.

### 2.6 Validation des entrées

- **ValidationPipe** global : `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- DTOs avec class-validator et/ou Zod selon les modules.

### 2.7 Prisma et brandId

- Les services utilisent `request.brandId` ou `user.brandId` pour filtrer (brand scoping).
- **Correction appliquée** : dans `SecurityController`, pour `getRoleStats`, `searchAuditLogs`, `getAuditStats`, `exportAuditLogsCSV`, le `brandId` effectif est désormais :
  - `queryBrandId` / `dto.brandId` **uniquement** si `user.role === UserRole.PLATFORM_ADMIN`,
  - sinon `user.brandId` (BRAND_ADMIN / BRAND_USER ne peuvent plus voir d’autres marques).

### 2.8 Secrets

- Aucun secret en dur dans le code ; utilisation de `ConfigService` et variables d’environnement.
- `validateRequiredEnvVars()` et `validateEnv()` en bootstrap (production stricte).

---

## 3. Correction : Configurator 3D – accès public

**Problème :** Les endpoints « public » du configurator 3D (ex. calcul de prix public, configuration publique) utilisaient `ConfiguratorPublicAccess()` qui n’appliquait que `ConfiguratorAccessGuard`. Le **JwtAuthGuard global** exigeait quand même un JWT, ce qui bloquait l’accès non authentifié (widgets, embed).

**Correction :** Dans `configurator-permissions.decorator.ts`, `ConfiguratorPublicAccess()` a été modifié pour inclure `Public()`, afin que le guard global saute la route. `ConfiguratorAccessGuard` continue d’appliquer les règles métier (configuration publiée, domaine autorisé, mot de passe si nécessaire).

**Fichier modifié :** `apps/backend/src/modules/configurator-3d/decorators/configurator-permissions.decorator.ts`

---

## 4. Correction : SecurityController – scope brandId (RBAC)

**Problème :** Les endpoints `GET security/roles/stats`, `GET security/audit/search`, `GET security/audit/stats` et `GET security/audit/export/csv` acceptaient un `brandId` en query/body. Un utilisateur **BRAND_ADMIN** pouvait passer un `brandId` d’une autre marque et obtenir des stats/audit d’autres tenants.

**Correction :** Pour ces quatre endpoints, le `brandId` effectif est maintenant :
- si `req.user.role === UserRole.PLATFORM_ADMIN` : utilisation du `brandId` fourni en query/dto ;
- sinon : utilisation de `req.user.brandId` (ignorer le query/dto pour les non–platform-admins).

**Fichier modifié :** `apps/backend/src/modules/security/security.controller.ts`

---

## 5. Frontend – Résumé

### 5.1 Middleware (middleware.ts)

- Routes protégées : `/admin`, `/dashboard`, `/overview`, `/settings`, `/billing`, `/team`, `/ai-studio`, `/onboarding`, et préfixes `/api/designs`, `/api/billing`, etc.
- Vérification cookie `accessToken` / `refreshToken` ; si absents → redirection vers `/login?redirect=…`.
- Vérification d’expiration légère (payload JWT) pour éviter le flash de contenu non authentifié.
- **Admin :** si `pathname.startsWith('/admin')`, lecture du rôle dans le JWT ; si `role !== 'PLATFORM_ADMIN'` → redirection vers `/dashboard`.
- Headers : CSP (avec nonce si `DISABLE_CSP_NONCES !== 'true'`), HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy.
- Rate limiting (Upstash si dispo), CSRF pour mutations sur `/api/`, bot protection, cache-control pour `/admin`.

### 5.2 Tokens et API

- **Client API** : `withCredentials: true` pour envoyer les cookies (httpOnly). Pas d’envoi explicite de Bearer si tout passe en cookie.
- Le code fait encore `localStorage.removeItem('accessToken'/'refreshToken')` dans l’intercepteur (après 401/refresh) : **nettoyage legacy** ; en production les tokens devraient être uniquement en cookies httpOnly. À terme, supprimer toute écriture de tokens dans localStorage si ce n’est plus utilisé.

### 5.3 Routes admin côté client

- Middleware vérifie le rôle dans le JWT pour `/admin` et redirige les non–PLATFORM_ADMIN. La vérification définitive reste côté backend (JwtAuthGuard + RolesGuard).

### 5.4 XSS et erreurs

- **XSS :** Voir section 6.
- **Erreurs :** ErrorBoundary n’affiche le stack qu’en `NODE_ENV === 'development'`. En production, pas d’affichage du stack à l’utilisateur.

---

## 6. Points d’attention (non corrigés dans cet audit)

### 6.1 XSS – dangerouslySetInnerHTML

- **JSON-LD / schémas structurés** : plusieurs layouts/pages injectent du JSON stringifié dans un `<script type="application/ld+json">` via `dangerouslySetInnerHTML`. Le contenu est contrôlé (données métier, pas HTML arbitraire) ; risque faible si les données ne viennent pas d’un CMS utilisateur.
- **Blog `article.content`** : `apps/frontend/src/app/(public)/blog/[id]/page.tsx` fait `dangerouslySetInnerHTML={{ __html: article.content.trim() }}`. Si `article.content` provient d’un CMS ou d’un formulaire, il faut **sanitizer le HTML** (ex. DOMPurify) avant injection.
- **Embed configurator custom CSS** : `decodeURIComponent(customCss)` injecté en `<style>` ; à réserver à des sources de confiance (brand/configurator admin).
- **Recommandation :** Pour tout contenu HTML issu de l’utilisateur ou d’un CMS, utiliser une librairie de sanitization (DOMPurify) avant `dangerouslySetInnerHTML`.

### 6.2 localStorage et tokens

- Les appels à `localStorage.removeItem('accessToken'/'refreshToken')` sont cohérents avec une migration vers cookies uniquement (nettoyage des anciennes clés). S’assurer qu’aucun code ne lit plus les tokens depuis localStorage pour les requêtes API.

---

## 7. Checklist finale

- [x] Tous les endpoints protégés ont les bons guards (JWT global + Roles/BrandOwnership quand nécessaire).
- [x] Routes publiques utilisent `@Public()`.
- [x] RBAC cohérent (PLATFORM_ADMIN, BRAND_ADMIN, BRAND_USER, CONSUMER, FABRICATOR).
- [x] Tokens : rotation, blacklist, expiration, nettoyage.
- [x] Rate limits en place (global + exclusions webhooks).
- [x] CSRF actif sur mutations (guard global + middleware cookie).
- [x] Headers de sécurité (CSP, HSTS, etc.) configurés (backend + frontend).
- [x] Inputs validés (DTOs + ValidationPipe).
- [x] Requêtes sensibles scoped par brandId ; SecurityController corrigé pour audit/roles.
- [x] Pas de secrets en dur.
- [x] Middleware frontend protège dashboard et admin.
- [x] Appels API avec credentials (cookies).
- [x] Routes admin protégées côté client (rôle dans JWT).
- [x] Erreurs : pas de fuite de stack en production dans ErrorBoundary.
- [ ] XSS : sanitization du contenu blog/CMS recommandée (voir 6.1).

---

## 8. Fichiers modifiés (corrections appliquées)

1. **apps/backend/src/modules/configurator-3d/decorators/configurator-permissions.decorator.ts**  
   - Ajout de `Public()` dans `ConfiguratorPublicAccess()` pour permettre l’accès public aux endpoints widget/configurator sans JWT.

2. **apps/backend/src/modules/security/security.controller.ts**  
   - Import de `UserRole` et `Request`.  
   - `getRoleStats`, `searchAuditLogs`, `getAuditStats`, `exportAuditLogsCSV` : utilisation d’un `brandId` effectif scoped par rôle (PLATFORM_ADMIN seul peut choisir une autre marque).

---

*Rapport généré dans le cadre de l’audit de sécurité et RBAC du projet Luneo.*
