# QA automatisée (Playwright)

## 1. Lancement local

```
pnpm install
pnpm --filter luneo-frontend run dev # localhost:3000
pnpm --filter luneo-frontend run test:e2e
```

Les tests utilisent Playwright avec :
- Navigation / dropdowns (`navigation.spec.ts`)
- Authentification (présence UI) (`auth.spec.ts`)
- Pricing (`pricing.spec.ts`)
- Internationalisation & bannière cookies (`internationalization.spec.ts`)

Helper `tests/e2e/utils/locale.ts` :
- `setLocale(page, 'fr' | 'en' | 'de')`
- `ensureCookieBannerClosed(page)`

## 2. Configuration

`apps/frontend/playwright.config.ts` :
- Multi-navigateurs (chromium, firefox, webkit + mobiles).  
- `use.baseURL = http://localhost:3000` (modifiable via `PLAYWRIGHT_BASE_URL`).  
- `trace: on-first-retry`, `screenshot: only-on-failure`.

## 3. Bonnes pratiques

- Utiliser `data-testid` pour des sélecteurs robustes.  
- Respecter `setLocale` pour stabiliser la langue.  
- Veiller à fermer la bannière cookies via helper.  
- Découpler les tests des intégrations externes (Supabase, Stripe) — tests se limitent à la couche UI.

## 4. CI

La tâche `turbo run test:e2e` (script racine `test:e2e`) exécute Playwright. À intégrer dans `ci.yml` après build si besoin (option `pnpm install --with-deps` + `npx playwright install --with-deps`).

