# Standards de Réponses API - Guide Professionnel

## 📋 Vue d'ensemble

Ce document décrit les standards professionnels pour les réponses API de la plateforme Luneo, garantissant une cohérence et une qualité mondiale.

## 🎯 Principes Fondamentaux

### 1. Structure Standardisée

Toutes les réponses API suivent cette structure :

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}
```

### 2. Codes HTTP Appropriés

| Code | Usage | Méthode |
|------|-------|---------|
| 200 | Succès | `ApiResponseBuilder.success()` |
| 400 | Requête invalide | `ApiResponseBuilder.badRequest()` |
| 401 | Non authentifié | `ApiResponseBuilder.unauthorized()` |
| 403 | Accès refusé | `ApiResponseBuilder.forbidden()` |
| 404 | Ressource non trouvée | `ApiResponseBuilder.notFound()` |
| 409 | Conflit (duplicata) | `ApiResponseBuilder.conflict()` |
| 422 | Données non valides | `ApiResponseBuilder.unprocessable()` |
| 429 | Trop de requêtes | `ApiResponseBuilder.tooManyRequests()` |
| 500 | Erreur serveur | `ApiResponseBuilder.internalError()` |
| 503 | Service indisponible | `ApiResponseBuilder.serviceUnavailable()` |

## 📝 Utilisation

### Exemple Basique

```typescript
import { ApiResponseBuilder } from '@/lib/api-response';

export async function GET() {
  return ApiResponseBuilder.handle(async () => {
    // Votre logique métier
    const data = await fetchData();
    return data;
  }, '/api/endpoint', 'GET');
}
```

### Exemple avec Validation

```typescript
import { ApiResponseBuilder, validateRequest } from '@/lib/api-response';

export async function POST(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    
    // Validation
    const validation = validateRequest(body, ['name', 'email']);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Paramètres manquants: ${validation.missing?.join(', ')}`,
        code: 'VALIDATION_ERROR',
      };
    }
    
    // Créer la ressource
    const result = await createResource(body);
    return result;
  }, '/api/endpoint', 'POST');
}
```

### Exemple avec Authentification

```typescript
export async function GET(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }
    
    // Logique métier
    const data = await fetchUserData(user.id);
    return data;
  }, '/api/endpoint', 'GET');
}
```

### Exemple avec Gestion d'Erreurs Spécifiques

```typescript
export async function POST(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const { data, error } = await supabase
      .from('table')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      // Erreur de contrainte unique
      if (error.code === '23505') {
        throw {
          status: 409,
          message: 'Ressource déjà existante',
          code: 'DUPLICATE_RESOURCE',
        };
      }
      
      // Erreur générique
      throw { status: 500, message: 'Erreur lors de la création' };
    }
    
    return { resource: data };
  }, '/api/endpoint', 'POST');
}
```

## 🔧 Helpers Disponibles

### validateRequest()

Valide que tous les champs requis sont présents :

```typescript
const validation = validateRequest(body, ['name', 'email']);
if (!validation.valid) {
  throw {
    status: 400,
    message: `Paramètres manquants: ${validation.missing?.join(', ')}`,
  };
}
```

### getPaginationParams()

Extrait les paramètres de pagination :

```typescript
const { page, limit, offset } = getPaginationParams(searchParams);
// page: 1, limit: 20, offset: 0
```

### getSortParams()

Extrait les paramètres de tri :

```typescript
const { sortBy, sortOrder } = getSortParams(searchParams, 'created_at', 'desc');
// sortBy: 'created_at', sortOrder: 'desc'
```

### formatValidationErrors()

Formate les erreurs de validation :

```typescript
const errors = { email: ['Invalid format'], name: ['Required'] };
const message = formatValidationErrors(errors);
// "email: Invalid format; name: Required"
```

## 📊 Exemples de Réponses

### Succès

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Example"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Erreur

```json
{
  "success": false,
  "error": "Ressource non trouvée",
  "code": "NOT_FOUND",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Erreur avec Métadonnées

```json
{
  "success": false,
  "error": "Validation échouée",
  "code": "VALIDATION_ERROR",
  "metadata": {
    "missing_fields": ["email", "name"]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## ✅ Bonnes Pratiques

### 1. Toujours Utiliser ApiResponseBuilder

❌ **Mauvais**:
```typescript
return NextResponse.json({ data: result }, { status: 200 });
```

✅ **Bon**:
```typescript
return ApiResponseBuilder.success(result);
```

### 2. Gérer les Erreurs avec throw

❌ **Mauvais**:
```typescript
if (error) {
  return NextResponse.json({ error: 'Erreur' }, { status: 500 });
}
```

✅ **Bon**:
```typescript
if (error) {
  throw { status: 500, message: 'Erreur' };
}
```

### 3. Utiliser les Codes d'Erreur Appropriés

❌ **Mauvais**:
```typescript
throw { status: 500, message: 'Utilisateur non trouvé' };
```

✅ **Bon**:
```typescript
throw { status: 404, message: 'Utilisateur non trouvé', code: 'USER_NOT_FOUND' };
```

### 4. Logger les Erreurs

Le logger est automatiquement appelé par `ApiResponseBuilder.handle()`, mais vous pouvez aussi logger manuellement :

```typescript
import { logger } from '@/lib/logger';

if (error) {
  logger.dbError('operation', error, { context });
  throw { status: 500, message: 'Erreur' };
}
```

## 🚀 Migration

Pour migrer une route API existante :

1. **Importer les utilitaires**:
```typescript
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
```

2. **Remplacer le try/catch**:
```typescript
// Avant
export async function GET() {
  try {
    // ...
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error });
  }
}

// Après
export async function GET() {
  return ApiResponseBuilder.handle(async () => {
    // ...
    return data;
  }, '/api/endpoint', 'GET');
}
```

3. **Remplacer les erreurs**:
```typescript
// Avant
if (error) {
  return NextResponse.json({ error: 'Erreur' }, { status: 500 });
}

// Après
if (error) {
  throw { status: 500, message: 'Erreur' };
}
```

## 📚 Références

- [Logger Professionnel](./PROFESSIONNALISATION_CODE.md)
- [Standards de Code](./CODE_STANDARDS.md)

---

**Date**: $(date)
**Version**: 1.0.0
**Qualité**: Expert Mondial SaaS

