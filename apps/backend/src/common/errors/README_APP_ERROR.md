# 🔧 Système de Gestion d'Erreurs Typé - AppError

## Vue d'ensemble

Le système `AppError` fournit une gestion d'erreurs standardisée, typée et professionnelle pour toute l'application backend.

## Caractéristiques

- ✅ **Codes d'erreur standardisés** : Enum `ErrorCode` avec codes uniques
- ✅ **Catégories d'erreur** : Classification automatique des erreurs
- ✅ **Métadonnées structurées** : Contexte et informations supplémentaires
- ✅ **Intégration logging** : Sanitization automatique des secrets
- ✅ **Type safety** : TypeScript strict avec types complets
- ✅ **Classes spécialisées** : Erreurs typées par domaine

## Structure

### Codes d'erreur

Les codes suivent le format `CATEGORY_XXXX` :

- **1xxx** : Authentication & Authorization
- **2xxx** : Validation
- **3xxx** : Not Found
- **4xxx** : Business Logic
- **5xxx** : External Services
- **6xxx** : Database
- **7xxx** : Rate Limiting
- **9xxx** : Internal Server

### Catégories

```typescript
enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  RATE_LIMITING = 'rate_limiting',
  INTERNAL = 'internal',
}
```

## Utilisation

### Créer une erreur simple

```typescript
import { AppErrorFactory } from '@/common/errors/app-error';

// Erreur de ressource non trouvée
throw AppErrorFactory.notFound('Product', productId);

// Erreur d'authentification
throw AppErrorFactory.authRequired({ userId: user.id });

// Erreur de validation
throw AppErrorFactory.validationFailed(
  'Invalid input data',
  [
    { field: 'email', message: 'Email is required' },
    { field: 'password', message: 'Password must be at least 8 characters' },
  ],
);
```

### Utiliser les classes spécialisées

```typescript
import { NotFoundError, ValidationError, BusinessError } from '@/common/errors/app-error';

// Erreur de ressource non trouvée
throw new NotFoundError('Product', productId);

// Erreur de validation
throw new ValidationError(
  'Invalid input',
  ErrorCode.VALIDATION_INVALID_INPUT,
  { field: 'email' },
  [{ field: 'email', message: 'Invalid email format' }],
);

// Erreur métier
throw new BusinessError(
  'Product is out of stock',
  ErrorCode.BUSINESS_INVALID_STATE,
  { productId, availableStock: 0 },
);
```

### Erreurs avec métadonnées

```typescript
throw new AppError(
  'Operation failed',
  ErrorCode.BUSINESS_OPERATION_NOT_ALLOWED,
  ErrorCategory.BUSINESS_LOGIC,
  HttpStatus.CONFLICT,
  {
    resourceId: order.id,
    resourceType: 'Order',
    userId: user.id,
    operation: 'cancel',
    context: {
      orderStatus: order.status,
      reason: 'Order already shipped',
    },
  },
);
```

## Exemples par cas d'usage

### Authentication

```typescript
// Token invalide
throw AppErrorFactory.invalidToken({ tokenId: token.id });

// Credentials invalides
throw AppErrorFactory.invalidCredentials({ email });

// Permissions insuffisantes
throw AppErrorFactory.insufficientPermissions('delete_product', {
  userId: user.id,
  resourceId: product.id,
});
```

### Validation

```typescript
// Validation échouée
throw AppErrorFactory.validationFailed(
  'Invalid request data',
  [
    { field: 'email', message: 'Email is required' },
    { field: 'age', message: 'Age must be between 18 and 100' },
  ],
  { requestBody: sanitizedBody },
);
```

### Not Found

```typescript
// Ressource non trouvée
throw AppErrorFactory.notFound('User', userId);

// Ressource non trouvée avec métadonnées
throw AppErrorFactory.notFound('Product', productId, {
  brandId: brand.id,
  searchQuery: query,
});
```

### Business Logic

```typescript
// Conflit métier
throw AppErrorFactory.conflict('User already exists', { email });

// Quota dépassé
throw AppErrorFactory.quotaExceeded('designs_per_month', {
  userId: user.id,
  currentUsage: 100,
  limit: 50,
});
```

### External Services

```typescript
// Erreur service externe
throw AppErrorFactory.externalService(
  'Stripe',
  'Payment processing failed',
  { paymentId, errorCode: 'card_declined' },
);
```

### Database

```typescript
// Erreur base de données
throw AppErrorFactory.database('Failed to save order', {
  orderId: order.id,
  operation: 'create',
});
```

## Format de réponse

Toutes les erreurs retournent un format standardisé :

```json
{
  "success": false,
  "error": "NOTFOUND_3003",
  "message": "Product with id 'prod_123' not found",
  "category": "not_found",
  "metadata": {
    "resourceType": "Product",
    "resourceId": "prod_123"
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "statusCode": 404,
  "path": "/api/products/prod_123"
}
```

## Intégration avec le logging

Le `AppErrorFilter` :
- ✅ Sanitize automatiquement les secrets dans les logs
- ✅ Log les erreurs avec le niveau approprié (error/warn)
- ✅ Inclut le stack trace pour les erreurs serveur
- ✅ Ajoute le contexte de la requête

## Migration depuis HttpException

### Avant

```typescript
throw new NotFoundException('Product not found');
throw new BadRequestException('Invalid input');
throw new ForbiddenException('Access denied');
```

### Après

```typescript
throw AppErrorFactory.notFound('Product', productId);
throw AppErrorFactory.validationFailed('Invalid input', validationErrors);
throw AppErrorFactory.insufficientPermissions('view_product', { productId });
```

## Bonnes pratiques

1. **Utiliser AppErrorFactory** pour les erreurs communes
2. **Ajouter des métadonnées** pour le contexte de débogage
3. **Utiliser les codes d'erreur appropriés** selon le domaine
4. **Ne pas exposer les détails internes** dans les messages utilisateur
5. **Sanitizer automatiquement** les données sensibles dans les métadonnées

## Tests

```typescript
import { AppErrorFactory } from '@/common/errors/app-error';

describe('AppErrorFactory', () => {
  it('should create not found error', () => {
    const error = AppErrorFactory.notFound('Product', 'prod_123');
    
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.category).toBe(ErrorCategory.NOT_FOUND);
    expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
  });
});
```

