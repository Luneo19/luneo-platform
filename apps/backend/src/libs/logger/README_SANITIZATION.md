# 🔒 Log Sanitization - Guide d'utilisation

## Vue d'ensemble

Le système de sanitization automatique masque les informations sensibles dans les logs pour éviter les fuites de données.

## Caractéristiques

- ✅ **Détection automatique** : Patterns pour secrets communs
- ✅ **Masquage intelligent** : Masque complet ou partiel selon le type
- ✅ **Récursif** : Sanitize les objets et tableaux imbriqués
- ✅ **Performance** : Optimisé pour ne pas ralentir les logs

## Types de secrets détectés

### Masquage complet
- **Passwords** : `password`, `passwd`, `pwd`
- **Secrets** : `secret`, `secretKey`
- **JWT Secrets** : `jwtSecret`
- **OAuth Secrets** : `clientSecret`, `oauthSecret`
- **Database Passwords** : Dans les URLs de connexion
- **Redis Passwords** : Dans les URLs Redis

### Masquage partiel (début + fin)
- **API Keys** : `api_key`, `apikey` (4 premiers + 4 derniers)
- **Tokens** : `token`, `accessToken`, `refreshToken` (4 premiers + 4 derniers)
- **Stripe Keys** : `stripe_secret_key` (7 premiers + 4 derniers)
- **Email API Keys** : `sendgrid_api_key`, `mailgun_api_key` (4 premiers + 4 derniers)
- **AI API Keys** : `openai_api_key`, `replicate_api_token` (4 premiers + 4 derniers)

## Utilisation

### Avec SafeLoggerService

```typescript
import { SafeLoggerService } from '@/libs/logger/safe-logger.service';

@Injectable()
export class MyService {
  private readonly logger = new SafeLoggerService(MyService.name);

  async login(email: string, password: string) {
    // Le password sera automatiquement masqué dans les logs
    this.logger.log(`Login attempt for ${email} with password: ${password}`);
    // Log: "Login attempt for user@example.com with password: ********"
  }
}
```

### Avec LogSanitizerService directement

```typescript
import { LogSanitizerService } from '@/libs/logger/log-sanitizer.service';

@Injectable()
export class MyService {
  constructor(private sanitizer: LogSanitizerService) {}

  logSensitiveData(data: any) {
    const sanitized = this.sanitizer.sanitizeObject(data);
    console.log('Sanitized data:', sanitized);
  }
}
```

## Exemples

### Exemple 1: Log avec password

```typescript
// AVANT sanitization
logger.log('User login', { email: 'user@example.com', password: 'MySecret123!' });
// Log: User login { email: 'user@example.com', password: 'MySecret123!' }

// APRÈS sanitization
safeLogger.log('User login', { email: 'user@example.com', password: 'MySecret123!' });
// Log: User login { email: 'user@example.com', password: '********' }
```

### Exemple 2: Log avec API key

```typescript
// AVANT
logger.log('API call', { apiKey: 'sk_live_1234567890abcdef' });
// Log: API call { apiKey: 'sk_live_1234567890abcdef' }

// APRÈS
safeLogger.log('API call', { apiKey: 'sk_live_1234567890abcdef' });
// Log: API call { apiKey: 'sk_l****90ab' }
```

### Exemple 3: Log avec token JWT

```typescript
// AVANT
logger.log('Request headers', { authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' });
// Log: Request headers { authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }

// APRÈS
safeLogger.log('Request headers', { authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' });
// Log: Request headers { authorization: 'Bearer eyJh****IkpXVCJ9' }
```

### Exemple 4: Log avec database URL

```typescript
// AVANT
logger.log('Database connection', { url: 'postgresql://user:password123@localhost:5432/db' });
// Log: Database connection { url: 'postgresql://user:password123@localhost:5432/db' }

// APRÈS
safeLogger.log('Database connection', { url: 'postgresql://user:********@localhost:5432/db' });
// Log: Database connection { url: 'postgresql://user:********@localhost:5432/db' }
```

## Patterns détectés

Le système détecte automatiquement :

1. **Dans les chaînes** : `password: "secret"`, `api_key: "abc123"`
2. **Dans les objets JSON** : `{"password": "secret"}`
3. **Dans les URLs** : `postgresql://user:pass@host`
4. **Dans les headers** : `Authorization: Bearer token`
5. **Dans les clés d'objet** : `{ password: "..." }`

## Configuration

### Personnaliser le masquage

```typescript
// Dans log-sanitizer.service.ts, ajouter un nouveau pattern:
{
  pattern: /(?:custom[_-]?key)\s*[:=]\s*["']?([^"'\s]+)["']?/gi,
  name: 'custom_key',
  options: { showStart: 4, showEnd: 4 }, // Montrer 4 premiers + 4 derniers
}
```

### Masquage complet vs partiel

```typescript
// Masquage complet
{ maskFull: true }
// Résultat: "********"

// Masquage partiel
{ showStart: 4, showEnd: 4 }
// Résultat: "abcd****efgh"
```

## Bonnes pratiques

1. **Utiliser SafeLoggerService** pour tous les logs en production
2. **Ne jamais logger** les passwords en clair
3. **Vérifier les logs** avant de les partager
4. **Ajouter des patterns** pour les nouveaux types de secrets
5. **Tester la sanitization** avec des données réelles

## Performance

- **Overhead minimal** : < 1ms par log
- **Cache des patterns** : Patterns compilés une fois
- **Optimisé** : Utilise des regex efficaces

## Sécurité

- ✅ **Masquage automatique** : Aucune action manuelle requise
- ✅ **Détection multiple** : Plusieurs patterns par type de secret
- ✅ **Récursif** : Fonctionne sur objets imbriqués
- ✅ **Fail-safe** : En cas d'erreur, masque tout par sécurité

