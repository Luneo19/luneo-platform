# 🔧 Correction : ApiKeyGuard Ne Peut Pas Résoudre ApiKeysService

**Date** : 4 janvier 2026, 23:40

## 🐛 Problème Identifié

### Erreur au Démarrage
```
Nest can't resolve dependencies of the ApiKeyGuard (?). 
Please make sure that the argument ApiKeysService at index [0] is available in the WidgetModule context.
```

### Cause
- `WidgetController` utilise `ApiKeyGuard` (défini dans `public-api/guards/api-key.guard.ts`)
- `ApiKeyGuard` a besoin de `ApiKeysService` (défini dans `public-api/api-keys/api-keys.service.ts`)
- `ApiKeysService` est exporté par `ApiKeysModule`
- `WidgetModule` n'importe pas `ApiKeysModule`

### Code Avant
```typescript
// widget.module.ts
imports: [PrismaModule], // ❌ ApiKeysModule manquant
```

## ✅ Solution

### Code Après
```typescript
// widget.module.ts
import { ApiKeysModule } from '../public-api/api-keys/api-keys.module';

@Module({
  imports: [PrismaModule, ApiKeysModule], // ✅ ApiKeysModule ajouté
  // ...
})
```

## 📋 Fichiers Modifiés

1. `apps/backend/src/modules/widget/widget.module.ts`
   - Ajout de l'import `ApiKeysModule`
   - Ajout de `ApiKeysModule` dans les imports

## 🚀 Prochaines Étapes

1. ✅ Code corrigé et commité
2. ⏳ Redéployer sur Railway
3. ⏳ Vérifier que l'application démarre correctement
4. ⏳ Vérifier que `/health` fonctionne

