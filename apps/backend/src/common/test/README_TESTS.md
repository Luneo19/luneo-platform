# 🧪 Guide des Tests - Luneo Platform

## Vue d'ensemble

Ce guide explique la structure des tests, comment les exécuter et comment en créer de nouveaux.

## Structure

```
src/
├── common/
│   └── test/
│       ├── test-setup.ts          # Mocks et fixtures réutilisables
│       ├── jest.setup.ts          # Configuration Jest globale
│       └── README_TESTS.md        # Ce fichier
├── modules/
│   ├── auth/
│   │   └── auth.service.spec.ts   # Tests AuthService
│   ├── products/
│   │   └── products.service.spec.ts
│   ├── designs/
│   │   └── designs.service.spec.ts
│   └── orders/
│       └── orders.service.spec.ts
└── libs/
    ├── rate-limit/
    │   └── sliding-window.service.spec.ts
    └── logger/
        └── log-sanitizer.service.spec.ts
```

## Commandes

```bash
# Exécuter tous les tests
npm test

# Exécuter en mode watch
npm run test:watch

# Exécuter avec coverage
npm run test:cov

# Exécuter un fichier spécifique
npm test -- auth.service.spec.ts

# Mode debug
npm run test:debug
```

## Configuration

### Jest Config (`jest.config.js`)

- **Coverage threshold**: 80% (branches, functions, lines, statements)
- **Test timeout**: 30 secondes
- **Max workers**: 4
- **Test regex**: `.*\.spec\.ts$`

### Setup Global (`jest.setup.ts`)

- Mock console methods
- Configuration variables d'environnement de test
- Timeout global

## Mocks et Fixtures

### Mocks disponibles

```typescript
import {
  createMockPrismaService,
  createMockRedisService,
  createMockCacheService,
  createMockConfigService,
  createMockJwtService,
} from '@/common/test/test-setup';
```

### Fixtures disponibles

```typescript
import { testFixtures } from '@/common/test/test-setup';

// Utilisation
const user = testFixtures.user;
const product = testFixtures.product;
const currentUser = testFixtures.currentUser;
```

## Exemples de tests

### Test de service simple

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my.service';
import { createTestingModule, testFixtures } from '@/common/test/test-setup';

describe('MyService', () => {
  let service: MyService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module = await createTestingModule([MyService]);
    service = module.get<MyService>(MyService);
    prismaService = module.get(PrismaService);
  });

  it('should do something', async () => {
    // Arrange
    prismaService.user.findUnique.mockResolvedValue(testFixtures.user as any);

    // Act
    const result = await service.doSomething('id');

    // Assert
    expect(result).toBeDefined();
    expect(prismaService.user.findUnique).toHaveBeenCalled();
  });
});
```

### Test avec erreurs

```typescript
import { AppErrorFactory } from '@/common/errors/app-error';
import { testHelpers } from '@/common/test/test-setup';

it('should throw NotFoundError', async () => {
  // Arrange
  prismaService.product.findUnique.mockResolvedValue(null);

  // Act & Assert
  await expect(service.findOne('invalid_id')).rejects.toThrow();
  testHelpers.expectNotFound(
    await service.findOne('invalid_id').catch(e => e),
    'Product',
  );
});
```

## Bonnes pratiques

1. **Un test = une fonctionnalité**
   ```typescript
   it('should create user successfully', async () => {
     // ...
   });
   ```

2. **Nommage clair**
   - `should [action] when [condition]`
   - `should throw [ErrorType] when [condition]`

3. **Structure AAA**
   - **Arrange** : Préparer les données et mocks
   - **Act** : Exécuter la méthode testée
   - **Assert** : Vérifier les résultats

4. **Isolation**
   - Chaque test est indépendant
   - Utiliser `beforeEach` pour réinitialiser les mocks
   - Utiliser `afterEach` pour nettoyer

5. **Mocks réalistes**
   ```typescript
   // ✅ Bon
   prismaService.user.findUnique.mockResolvedValue(testFixtures.user as any);

   // ❌ Éviter
   prismaService.user.findUnique.mockResolvedValue({} as any);
   ```

6. **Tester les cas limites**
   - Succès
   - Erreurs (NotFound, Forbidden, etc.)
   - Cas limites (valeurs nulles, tableaux vides, etc.)

## Coverage

### Objectifs

- **Branches** : 80%
- **Functions** : 80%
- **Lines** : 80%
- **Statements** : 80%

### Vérification

```bash
npm run test:cov
```

Le rapport est généré dans `coverage/` :
- `coverage/lcov-report/index.html` : Rapport HTML
- `coverage/lcov.info` : Format LCOV
- `coverage/coverage-final.json` : Format JSON

## Services testés

### ✅ Services critiques avec tests

1. **AuthService** : signup, login, refreshToken
2. **ProductsService** : CRUD complet
3. **DesignsService** : create, findOne, upgradeToHighRes
4. **OrdersService** : CRUD complet
5. **AppError** : Toutes les classes d'erreur
6. **SlidingWindowRateLimitService** : Rate limiting
7. **LogSanitizerService** : Sanitization des logs

### 📋 Services à tester (priorité)

1. BillingService
2. EmailService (SendGrid)
3. CacheService
4. ValidationPipe
5. RBACService

## Debugging

### Mode debug

```bash
npm run test:debug
```

Puis ouvrir Chrome DevTools sur `chrome://inspect`

### Logs détaillés

```bash
npm test -- --verbose
```

### Test spécifique

```bash
npm test -- --testNamePattern="should create user"
```

## CI/CD

Les tests sont exécutés automatiquement dans CI avec :

```yaml
- run: npm test
- run: npm run test:cov
```

Le coverage est vérifié et doit être ≥ 80%.

## Ressources

- [Jest Documentation](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](./README_TESTS.md)

