# 🔧 Correction : ApiKeyGuard dans GenerationModule

**Date** : 4 janvier 2026, 23:45

## 🐛 Problème Identifié

### Erreur au Démarrage
```
Nest can't resolve dependencies of the ApiKeyGuard (?). 
Please make sure that the argument ApiKeysService at index [0] is available in the GenerationModule context.
```

### Cause
- `GenerationController` utilise `ApiKeyGuard` (défini dans `public-api/guards/api-key.guard.ts`)
- `ApiKeyGuard` a besoin de `ApiKeysService` (défini dans `public-api/api-keys/api-keys.service.ts`)
- `ApiKeysService` est exporté par `ApiKeysModule`
- `GenerationModule` n'importe pas `ApiKeysModule`

### Code Avant
```typescript
// generation.module.ts
imports: [
  PrismaModule,
  StorageModule,
  EventEmitterModule,
  // ❌ ApiKeysModule manquant
],
```

## ✅ Solution

### Code Après
```typescript
// generation.module.ts
import { ApiKeysModule } from '../public-api/api-keys/api-keys.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    ApiKeysModule, // ✅ ApiKeysModule ajouté
    EventEmitterModule,
    // ...
  ],
})
```

## 📋 Fichiers Modifiés

1. `apps/backend/src/modules/generation/generation.module.ts`
   - Ajout de l'import `ApiKeysModule`
   - Ajout de `ApiKeysModule` dans les imports

## 🚀 Prochaines Étapes

1. ✅ Code corrigé et commité
2. ⏳ Redéployer sur Railway
3. ⏳ Vérifier que l'application démarre correctement
4. ⏳ Vérifier que `/health` fonctionne




