# Internationalisation – Luneo Platform

## 1. Architecture

- **Détection locale côté serveur**  
  - `apps/frontend/src/i18n/server.ts` lit le cookie `luneo_locale` (priorité) puis l’en-tête `Accept-Language`.  
  - Locales supportées : `en`, `fr`, `de`.  
  - Métadonnées associées : devise par défaut, fuseau horaire et libellé (cf. `i18n/config.ts`).  
  - Les messages sont fusionnés avec l’anglais comme fallback (deep merge) pour garantir qu’aucune clé manquante ne casse le rendu.

- **Provider React**  
  - `I18nProvider` (client) expose `t()`, `formatCurrency()`, `formatNumber()`, `formatDateTime()` et la liste des locales disponibles.  
  - `useI18n()` retourne le contexte complet, `useTranslations(namespace)` fournit un helper namespacé.

- **Locale Switcher**  
  - Composant `LocaleSwitcher` (header + menu mobile).  
  - Alimente la query `?lang=xx` → middleware pose le cookie + redirige sur la même URL sans paramètre.

- **Middleware**  
  - `apps/frontend/middleware.ts` gère : rate limiting, auth Supabase, et maintenant la persistance locale (cookie `luneo_locale`, expiration 1 an, `SameSite=lax`).

## 2. Localisation UI actuelle

- **Layout / Header / Notifications** traduits et formatage devise via `Intl.NumberFormat`.  
- **Cookie banner** entièrement localisé (textes, badges, CTA, aria-labels).  
- Les autres pages conservent le contenu historique (FR) mais peuvent être migrées progressivement : `useTranslations('pageName')`.

## 3. Back-end & Prompts IA

- `PromptLocalizationService` :  
  - Détection de langue (lib `franc`).  
  - Traduction automatique vers l’anglais (`@vitalets/google-translate-api`) avec cache mémoire et failover.  
  - Intégré dans `DesignsService` → stocke la locale originale dans `metadata` + propage aux jobs BullMQ.
- Feature flag : `ENABLE_PROMPT_TRANSLATION=false` désactive la traduction (use-case tests / offline).

## 4. Fuseaux & Devises

- Mapping par locale (`config.ts`) utilisé pour :  
  - Formatter les montants dans l’UI (header, notifications…).  
  - Exposé au provider pour usage futur (pricing, dashboard).  
  - Backend Billing : `BillingTaxService`/`BillingInvoiceService` s’appuient sur le pays/locale pour fixer TVA + devise.

## 5. Roadmap i18n

| Priorité | Élément | Détails |
|----------|---------|---------|
| 🟢 | Infrastructure ✅ | Détection, provider, locale switcher, prompts IA. |
| 🟡 | Contenus public | Migrer progressivement les pages marketing `(public)` vers `useTranslations`. |
| 🟡 | Emails & PDFs | Localiser templates emails + factures PDF (actuellement FR). |
| 🟠 | Pluriels & formats | Introduire `Intl.PluralRules` pour formes “{count} tasks”. |
| 🟠 | Analytics | Segmenter dashboards par locale (usage/traduction). |
| 🟠 | QA linguistique | Workflow reviewers + screenshot diff multi-langues (Chromatic / Happo).

## 6. Tests

- `pnpm --filter @luneo/backend-vercel run test` → couvre services i18n backend.  
- `pnpm --filter luneo-frontend run test --coverage` (CI) : à enrichir avec tests Playwright multi-locales (TODO).

## 7. Bonnes pratiques contrib

1. Nouveau texte → ajouter clé dans `apps/frontend/src/i18n/locales/*.ts`.  
2. Préférer un namespace par composant (`header`, `cookieBanner`, `dashboard`, …).  
3. Pour interpoler : `t('header.notifications.items.payment.description', { amount: formatted })`.  
4. Toujours fournir la clé dans `en.ts` (fallback).  
5. Si dépendance aux fuseaux/devise → utiliser `useI18n().formatCurrency/date`.

Document à maintenir à chaque ajout de langue ou refonte de contenu.

