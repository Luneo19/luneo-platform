# 🔒 Guide de Sécurité - Luneo Platform

**Documentation complète de la sécurité**

---

## 📋 Vue d'Ensemble

Luneo Platform implémente plusieurs couches de sécurité pour protéger l'application et les données utilisateur.

---

## 🛡️ Headers de Sécurité

### Configuration

Les headers de sécurité sont configurés dans:
- **`middleware.ts`** - Headers dynamiques
- **`next.config.mjs`** - Headers statiques

### Headers Implémentés

#### Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
- Force HTTPS
- Valide 1 an
- Inclut sous-domaines

#### Content Security Policy (CSP)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' ...
```
- Restreint les sources de contenu
- Protection XSS
- Note: `unsafe-inline` et `unsafe-eval` nécessaires pour Next.js

#### X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```
- Empêche le MIME type sniffing

#### X-Frame-Options
```
X-Frame-Options: SAMEORIGIN
```
- Protection clickjacking

#### X-XSS-Protection
```
X-XSS-Protection: 1; mode=block
```
- Protection XSS (legacy)

#### Referrer-Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```
- Contrôle des informations de referrer

#### Permissions-Policy
```
Permissions-Policy: camera=(self), microphone=(), geolocation=(self)
```
- Contrôle des APIs du navigateur

---

## 🚦 Rate Limiting

### Configuration

Rate limiting est configuré dans:
- **`middleware.ts`** - Rate limiting basique (mémoire)
- **`rate-limit.ts`** - Rate limiting distribué (Upstash Redis)

### Limites par Type

#### API Routes
- **Limite:** 100 requêtes/minute
- **Window:** 1 minute
- **Storage:** Redis (production) ou mémoire (dev)

#### Authentication Routes
- **Limite:** 5 tentatives/15 minutes
- **Window:** 15 minutes
- **Storage:** Redis

#### AI Generation
- **Limite:** 10 requêtes/heure
- **Window:** 1 heure
- **Storage:** Redis

#### Public Pages
- **Limite:** 200 requêtes/minute
- **Window:** 1 minute
- **Storage:** Mémoire

### Utilisation

```typescript
import { checkRateLimit, getApiRateLimit } from '@/lib/rate-limit';

const result = await checkRateLimit(identifier, getApiRateLimit());
if (!result.success) {
  return new Response('Too Many Requests', { status: 429 });
}
```

---

## 🔐 CSRF Protection

### Configuration

CSRF protection est implémentée dans:
- **`src/lib/csrf.ts`** - Génération et validation de tokens
- **`middleware.ts`** - Protection automatique

### Fonctionnement

1. **Génération de token:**
   ```typescript
   GET /api/csrf/token
   ```
   - Token généré avec HMAC SHA256
   - Stocké dans cookie HttpOnly

2. **Validation:**
   - Middleware vérifie le token pour mutations (POST, PUT, PATCH, DELETE)
   - Token doit être dans header `X-CSRF-Token`
   - Token doit correspondre au cookie

3. **Exceptions:**
   - Routes webhooks (vérification propre)
   - Routes publiques
   - Routes auth

### Utilisation

```typescript
// Côté client
const token = await fetch('/api/csrf/token').then(r => r.json());
fetch('/api/endpoint', {
  headers: {
    'X-CSRF-Token': token.csrfToken,
  },
});
```

---

## 🔑 Authentification

### Supabase Auth

- **JWT tokens** - Tokens signés
- **Refresh tokens** - Renouvellement automatique
- **OAuth** - Google, GitHub
- **Sessions** - Gestion sécurisée

### Password Requirements

Configuré dans `securityConfig`:
- **Longueur minimale:** 8 caractères
- **Longueur maximale:** 128 caractères
- **Uppercase:** Requis
- **Lowercase:** Requis
- **Number:** Requis
- **Special:** Optionnel
- **Blocked passwords:** Liste de mots de passe communs

### Two-Factor Authentication

- **Support:** Implémenté (`TwoFactorAuth.ts`)
- **Algorithm:** TOTP (SHA1)
- **Digits:** 6
- **Period:** 30 secondes
- **Backup codes:** 10 codes

---

## ✅ Validation des Inputs

### Zod

Tous les inputs sont validés avec Zod:

```typescript
import { z } from 'zod';
import { ApiResponseBuilder } from '@/lib/api-response';

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(schema, request, async (data) => {
    // Data est validé et typé
  });
}
```

### Sanitization

```typescript
import { sanitizeInput } from '@/lib/security/config';

const sanitized = sanitizeInput(userInput);
```

**Fonctionnalités:**
- Supprime angle brackets
- Supprime `javascript:` protocol
- Supprime event handlers (`onclick=`, etc.)

---

## 📁 Upload de Fichiers

### Limitations

- **Taille maximale:** 10MB
- **Types MIME autorisés:**
  - `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`
  - `application/pdf`

### Validation

```typescript
import { isAllowedFileType } from '@/lib/security/config';

if (!isAllowedFileType(file.type, file.name)) {
  throw new Error('File type not allowed');
}
```

---

## 🔍 Security Scanning

### CI/CD

Security scanning est intégré dans GitHub Actions:

1. **npm audit:**
   ```yaml
   - name: Run npm audit
     run: pnpm audit --audit-level=moderate
   ```

2. **Secrets scanning:**
   ```yaml
   - name: Check for secrets
     uses: trufflesecurity/trufflehog@main
   ```

### Local

```bash
# Audit des dépendances
cd apps/frontend
pnpm audit

# Vérifier les secrets
# Utiliser git-secrets ou similaire
```

---

## 🛡️ OWASP Top 10

### A01:2021 – Broken Access Control

**Protection:**
- ✅ Routes protégées vérifiées
- ✅ RBAC (Role-Based Access Control)
- ✅ Vérification d'authentification sur toutes les routes API

### A02:2021 – Cryptographic Failures

**Protection:**
- ✅ HTTPS forcé (HSTS)
- ✅ Secrets dans variables d'environnement
- ✅ Encryption at rest (database)

### A03:2021 – Injection

**Protection:**
- ✅ Validation Zod
- ✅ Prisma ORM (protection SQL injection)
- ✅ Sanitization des inputs
- ✅ Parametrized queries

### A04:2021 – Insecure Design

**Protection:**
- ✅ Architecture sécurisée
- ✅ Security by design
- ✅ Principes de moindre privilège

### A05:2021 – Security Misconfiguration

**Protection:**
- ✅ Headers de sécurité
- ✅ Configuration production sécurisée
- ✅ Pas de debug en production

### A06:2021 – Vulnerable Components

**Protection:**
- ✅ Security scanning dans CI/CD
- ✅ `npm audit` automatique
- ✅ Mise à jour des dépendances

### A07:2021 – Authentication Failures

**Protection:**
- ✅ Supabase Auth
- ✅ Rate limiting auth
- ✅ Password requirements
- ✅ 2FA support

### A08:2021 – Software and Data Integrity Failures

**Protection:**
- ✅ CSRF protection
- ✅ Validation des webhooks (signatures)
- ✅ Integrity checks

### A09:2021 – Security Logging Failures

**Protection:**
- ✅ Logging avec Sentry
- ✅ Redaction des données sensibles
- ✅ Audit logs

### A10:2021 – Server-Side Request Forgery (SSRF)

**Protection:**
- ✅ Validation des URLs
- ✅ Whitelist des domaines autorisés
- ✅ Validation des webhooks

---

## 🔐 Gestion des Secrets

### Variables d'Environnement

**Ne JAMAIS commiter:**
- API keys
- Secrets JWT
- Credentials database
- Tokens OAuth

**Utiliser:**
- `.env.local` pour développement
- Vercel Environment Variables pour production
- GitHub Secrets pour CI/CD

### Redaction dans Logs

```typescript
import { redactSensitiveData } from '@/lib/security/config';

const safeData = redactSensitiveData(data);
logger.info('Action', safeData);
```

**Patterns redactés:**
- `password`, `secret`, `token`
- `api_key`, `authorization`
- `credit_card`, `ssn`
- Numéros de carte de crédit
- SSN

---

## 🚨 Incident Response

### En Cas de Breach

1. **Isoler** - Désactiver les comptes affectés
2. **Analyser** - Identifier l'étendue
3. **Notifier** - Utilisateurs et autorités si nécessaire
4. **Corriger** - Patch la vulnérabilité
5. **Documenter** - Post-mortem

### Contacts

- **Security Team:** security@luneo.app
- **Support:** support@luneo.app

---

## 📊 Checklist Sécurité

### Développement
- [ ] Tous les inputs validés avec Zod
- [ ] Tous les outputs sanitized
- [ ] Pas de secrets dans le code
- [ ] Headers de sécurité configurés
- [ ] Rate limiting activé
- [ ] CSRF protection activée

### Déploiement
- [ ] Variables d'environnement configurées
- [ ] HTTPS activé
- [ ] Headers de sécurité vérifiés
- [ ] Rate limiting fonctionnel
- [ ] Monitoring activé

### Maintenance
- [ ] Dépendances à jour
- [ ] Security scanning régulier
- [ ] Audit logs vérifiés
- [ ] Tests de sécurité passent

---

## 🔗 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [CSP Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Supabase Security](https://supabase.com/docs/guides/auth/security)

---

**Dernière mise à jour:** Décembre 2024










