# i18n Migration Guide – Replacing Hardcoded French Strings

This guide explains how to gradually migrate hardcoded French (or any) strings in the Luneo frontend to the centralized i18n system.

## Overview

- **Translation files**: `src/i18n/locales/fr.ts` (French) and `src/i18n/locales/en.ts` (English).
- **Hook**: `useI18n()` from `@/i18n/useI18n` (or `@/i18n`) provides `t(key)`, `locale`, and `setLocale`.
- **Nested keys**: Use dot notation, e.g. `t('common.error')`, `t('auth.login')`.
- **Variables**: In locale files use `{{name}}`; when calling `t()`, pass a second argument: `t('forms.maxLength', { max: 100 })`.

## How to Migrate a Component

1. **Use the hook** (in client components):

   ```tsx
   'use client';
   import { useI18n } from '@/i18n/useI18n';

   export function MyComponent() {
     const { t } = useI18n();
     return <h1>{t('dashboard.title')}</h1>;
   }
   ```

2. **Replace hardcoded strings** with `t('...')`:

   | Before (hardcoded)           | After (i18n)                |
   |-----------------------------|-----------------------------|
   | `<h1>Tableau de bord</h1>`  | `<h1>{t('dashboard.title')}</h1>` |
   | `"Chargement..."`           | `{t('common.loading')}`     |
   | `"Connexion"`               | `{t('auth.login')}`        |
   | `"Enregistrer"`             | `{t('common.save')}`       |
   | `"Erreur"`                  | `{t('common.error')}`      |

3. **With variables**:

   ```tsx
   t('forms.maxLength', { max: 100 })  // "Maximum 100 caractères" / "Maximum 100 characters"
   ```

4. **Optional: namespace helper** for a section:

   ```tsx
   const { t } = useI18n();
   const tAuth = (key: string, params?: Record<string, string | number>) => t(`auth.${key}`, params);
   // then: tAuth('login'), tAuth('email')
   ```

   Or use `useTranslations('auth')` which returns a function `(key, params) => t(\`auth.${key}\`, params)`.

## Most Common Translation Keys

Use these keys from `src/i18n/locales/fr.ts` / `en.ts` when migrating:

- **common**: `error`, `loading`, `success`, `create`, `edit`, `delete`, `cancel`, `save`, `confirm`, `close`, `search`, `filter`, `back`, `next`, `previous`, `submit`, `reset`, `free`, `yes`, `no`, `actions`, `noResults`, `required`, `optional`, `viewAll`, `learnMore`, `copy`, `copied`, `refresh`, `retry`, `notFound`, `unauthorized`, `forbidden`, `serverError`, `settings`
- **auth**: `login`, `logout`, `register`, `email`, `password`, `confirmPassword`, `forgotPassword`, `resetPassword`, `rememberMe`, `loginWithGoogle`, `loginWithGithub`, `noAccount`, `hasAccount`, `signUp`, `signIn`
- **dashboard**: `title`, `overview`, `recentActivity`, `quickActions`, `totalDesigns`, `totalOrders`, `revenue`, `activeUsers`
- **designs**: `title`, `create`, `edit`, `delete`, `duplicate`, `preview`, `publish`, `unpublish`, `noDesigns`
- **orders**: `title`, `orderNumber`, `status`, `pending`, `processing`, `completed`, `cancelled`, `refunded`, `total`, `date`, `noOrders`
- **billing**: `title`, `currentPlan`, `upgrade`, `downgrade`, `invoices`, `paymentMethods`, `credits`, `buyCredits`, `balance`
- **integrations**: `title`, `connect`, `disconnect`, `connected`, `notConnected`, `apiKeys`, `webhooks`
- **notifications**: `title`, `markAllRead`, `noNotifications`, `settings`
- **errors**: `generic`, `network`, `notFound`, `unauthorized`, `forbidden`, `validation`, `tryAgain`, `contactSupport`
- **forms**: `required`, `invalidEmail`, `passwordTooShort`, `passwordMismatch`, `maxLength`, `minLength`

## Adding New Strings

1. Add the key to both `src/i18n/locales/fr.ts` and `src/i18n/locales/en.ts` in the right section (`common`, `auth`, `dashboard`, etc.).
2. Use the same nested path in the component: `t('section.key')`.
3. For variable substitution, use `{{name}}` in the locale string and pass the object as the second argument to `t()`.

## Server components and layout

For server-rendered trees, the app uses `loadI18nConfig()` and `I18nProvider` from `src/i18n/server` and `src/i18n/provider`. Those use the same locale files (default export from `fr.ts` / `en.ts`). Prefer the client `useI18n()` + `t()` for gradual migration of existing components.

## Checklist for a page or component

- [ ] Import `useI18n` from `@/i18n/useI18n` (or `@/i18n`).
- [ ] Replace visible French (or hardcoded) text with `t('section.key')`.
- [ ] For dynamic text, use `t('key', { var: value })` and `{{var}}` in the locale files.
- [ ] Add any new strings to both `fr.ts` and `en.ts`.
