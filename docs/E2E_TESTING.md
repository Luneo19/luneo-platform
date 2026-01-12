# 🧪 E2E TESTING - GUIDE COMPLET

**Date**: 15 janvier 2025  
**Status**: ✅ Tests E2E complets

---

## 📋 RÉSUMÉ

Suite complète de tests End-to-End (E2E) avec Playwright pour le frontend et Supertest pour le backend, couvrant tous les workflows critiques de l'application.

---

## 🔧 ARCHITECTURE

### 1. Frontend E2E Tests ✅

**Framework**: Playwright

**Fichiers**:
- `apps/frontend/tests/e2e/` - Tests E2E frontend
- `apps/frontend/playwright.config.ts` - Configuration Playwright
- `apps/frontend/tests/e2e/auth.setup.ts` - Setup d'authentification

**Tests couverts**:
- ✅ Authentication (login, register, OAuth)
- ✅ Dashboard navigation
- ✅ Design workflows
- ✅ Checkout flow
- ✅ CAPTCHA integration
- ✅ Rate limiting
- ✅ Performance monitoring
- ✅ SEO optimization
- ✅ OAuth flows
- ✅ Admin dashboard

---

### 2. Backend E2E Tests ✅

**Framework**: Supertest + Jest

**Fichiers**:
- `apps/backend/test/e2e/` - Tests E2E backend
- `apps/backend/test/e2e/design-to-order.e2e-spec.ts` - Workflow complet
- `apps/backend/test/e2e/auth.e2e-spec.ts` - Tests auth
- `apps/backend/test/e2e/rate-limiting.e2e-spec.ts` - Tests rate limiting
- `apps/backend/test/e2e/web-vitals.e2e-spec.ts` - Tests Web Vitals

**Tests couverts**:
- ✅ Authentication endpoints
- ✅ OAuth endpoints
- ✅ Rate limiting
- ✅ Web Vitals API
- ✅ Design to Order workflow
- ✅ Multi-tenant isolation

---

## 🚀 COMMANDES

### Frontend E2E Tests

```bash
# Tous les tests E2E
cd apps/frontend
npm run test:e2e

# Mode UI (debug)
npm run test:e2e:ui

# Tests smoke (rapides)
npm run test:e2e:smoke

# Tests spécifiques
npx playwright test tests/e2e/auth.spec.ts

# Générer rapport
npx playwright show-report
```

### Backend E2E Tests

```bash
# Tous les tests E2E
cd apps/backend
npm run test:e2e

# Test spécifique
npm run test:e2e -- auth.e2e-spec.ts

# Avec coverage
npm run test:e2e:cov
```

---

## 📊 COUVERTURE DES TESTS

### Workflows Critiques ✅

1. **Authentication Flow**
   - ✅ Signup avec CAPTCHA
   - ✅ Login avec credentials
   - ✅ OAuth Google
   - ✅ OAuth GitHub
   - ✅ Password reset
   - ✅ Email verification

2. **Design Workflow**
   - ✅ Création de design
   - ✅ Personnalisation
   - ✅ Validation
   - ✅ Ajout au panier
   - ✅ Checkout
   - ✅ Commande

3. **Admin Dashboard**
   - ✅ Accès admin
   - ✅ Navigation sidebar
   - ✅ Customer management
   - ✅ Analytics
   - ✅ Marketing automation

4. **Performance & Monitoring**
   - ✅ Web Vitals tracking
   - ✅ API performance
   - ✅ Rate limiting
   - ✅ Error tracking

5. **SEO & Accessibility**
   - ✅ Meta tags
   - ✅ Structured data
   - ✅ Sitemap
   - ✅ Robots.txt
   - ✅ Canonical URLs

---

## 🔐 CONFIGURATION

### Variables d'Environnement

```env
# Test User
E2E_TEST_EMAIL=test@luneo.app
E2E_TEST_PASSWORD=TestPassword123!

# OAuth (optionnel pour tests)
GOOGLE_CLIENT_ID=...
GITHUB_CLIENT_ID=...

# reCAPTCHA (optionnel pour tests)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...

# Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📁 STRUCTURE DES TESTS

```
apps/frontend/tests/e2e/
├── auth.spec.ts                    # Tests authentification
├── auth.setup.ts                   # Setup authentification
├── captcha.spec.ts                 # Tests CAPTCHA
├── rate-limiting.spec.ts           # Tests rate limiting
├── oauth.spec.ts                   # Tests OAuth
├── performance-monitoring.spec.ts  # Tests performance
├── seo.spec.ts                     # Tests SEO
├── admin-dashboard.spec.ts         # Tests admin dashboard
├── dashboard.spec.ts               # Tests dashboard
├── checkout-flow.spec.ts           # Tests checkout
├── workflows/
│   ├── design-to-order.spec.ts    # Workflow complet
│   └── registration-to-design.spec.ts
└── utils/
    ├── auth.ts                     # Helpers authentification
    ├── locale.ts                   # Helpers locale
    └── common.ts                   # Helpers communs

apps/backend/test/e2e/
├── auth.e2e-spec.ts                # Tests auth API
├── rate-limiting.e2e-spec.ts       # Tests rate limiting API
├── web-vitals.e2e-spec.ts          # Tests Web Vitals API
└── design-to-order.e2e-spec.ts     # Workflow complet API
```

---

## 🧪 EXEMPLES DE TESTS

### Test Frontend - Authentication

```typescript
test('should login successfully', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder(/email/i).fill('test@example.com');
  await page.getByPlaceholder(/password/i).fill('password123');
  await page.getByRole('button', { name: /login/i }).click();
  
  await expect(page).toHaveURL(/.*dashboard/);
});
```

### Test Backend - API

```typescript
it('should login with valid credentials', async () => {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({
      email: 'test@example.com',
      password: 'password123',
    });

  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('user');
});
```

---

## ✅ CHECKLIST DE DÉPLOIEMENT

- [x] Playwright configuré ✅
- [x] Tests auth frontend ✅
- [x] Tests auth backend ✅
- [x] Tests CAPTCHA ✅
- [x] Tests OAuth ✅
- [x] Tests rate limiting ✅
- [x] Tests performance monitoring ✅
- [x] Tests SEO ✅
- [x] Tests admin dashboard ✅
- [x] Tests workflows complets ✅
- [x] CI/CD integration ✅
- [ ] Tests de charge (à faire)
- [ ] Tests de régression visuelle (à faire)

---

## 🚀 CI/CD INTEGRATION

### GitHub Actions

Les tests E2E sont exécutés automatiquement dans GitHub Actions :

```yaml
- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true
    E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
    E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
```

---

## 📈 MÉTRIQUES

### Coverage Goals

- **Frontend E2E**: 80% des workflows critiques
- **Backend E2E**: 70% des endpoints API
- **Workflows complets**: 100% des parcours utilisateur critiques

---

## 🔍 DEBUGGING

### Mode Debug Playwright

```bash
# Mode UI interactif
npm run test:e2e:ui

# Mode debug avec breakpoints
PWDEBUG=1 npm run test:e2e

# Mode headed (voir le navigateur)
npx playwright test --headed
```

### Logs

Les tests loggent automatiquement :
- ✅ Succès des tests
- ⚠️ Warnings (tests skippés)
- ❌ Erreurs avec screenshots

---

## 🚀 PROCHAINES ÉTAPES

1. **Visual Regression Testing**:
   - Ajouter Percy ou Chromatic
   - Tests de régression visuelle

2. **Load Testing**:
   - Tests de charge avec k6
   - Tests de stress

3. **Accessibility Testing**:
   - Tests a11y avec axe-core
   - Tests WCAG compliance

---

**Status**: ✅ Tests E2E complets et fonctionnels  
**Score gagné**: +5 points (selon plan de développement)
