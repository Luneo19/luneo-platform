# 🛠️ ACTIONS CORRECTIVES - BUILD PRODUCTION

**Date** : 10 Janvier 2025  
**Guide de dépannage rapide**

---

## 🔴 ERREURS CRITIQUES ET SOLUTIONS

### 1. "Cannot find module './services/discount.service'"

**Symptôme** :
```
Error: Cannot find module './services/discount.service'
```

**Solution** :
```bash
# Vérifier que le fichier existe
ls -la apps/backend/src/modules/orders/services/discount.service.ts

# Si le fichier n'existe pas, le recréer depuis le commit
git checkout HEAD -- apps/backend/src/modules/orders/services/discount.service.ts
```

**Fichier à vérifier** : `apps/backend/src/modules/orders/orders.module.ts`
```typescript
import { DiscountService } from './services/discount.service';
```

---

### 2. "Nest can't resolve dependencies of OrdersService"

**Symptôme** :
```
Nest can't resolve dependencies of OrdersService (PrismaService, ConfigService, ?). 
Please make sure that the argument DiscountService at index [2] is available in the OrdersModule context.
```

**Solution** :
Vérifier que `DiscountService` est dans les `providers` de `OrdersModule` :
```typescript
@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [OrdersService, DiscountService], // ✅ Doit être ici
  exports: [OrdersService],
})
export class OrdersModule {}
```

---

### 3. "Cannot find module '@/libs/storage/storage.module'"

**Symptôme** :
```
Error: Cannot find module '@/libs/storage/storage.module'
```

**Solution** :
Vérifier que le fichier existe :
```bash
ls -la apps/backend/src/libs/storage/storage.module.ts
```

Vérifier l'import dans `ArStudioModule` :
```typescript
import { StorageModule } from '@/libs/storage/storage.module';
```

---

### 4. "Nest can't resolve dependencies of ArStudioService"

**Symptôme** :
```
Nest can't resolve dependencies of ArStudioService (PrismaService, ConfigService, ?). 
Please make sure that the argument StorageService at index [2] is available in the ArStudioModule context.
```

**Solution** :
Vérifier que `StorageModule` est dans les `imports` de `ArStudioModule` :
```typescript
@Module({
  imports: [PrismaModule, ConfigModule, StorageModule], // ✅ Doit être ici
  // ...
})
export class ArStudioModule {}
```

Et que `StorageModule` exporte bien `StorageService` :
```typescript
@Module({
  providers: [StorageService],
  exports: [StorageService], // ✅ Doit exporter StorageService
})
export class StorageModule {}
```

---

### 5. "Property 'isPublic' does not exist on type 'Product'"

**Symptôme** :
```
Property 'isPublic' does not exist on type 'Product'
```

**Solution** :
Vérifier que le champ `isPublic` existe dans le schéma Prisma :
```prisma
model Product {
  // ...
  isPublic Boolean @default(true)
  // ...
}
```

Si le champ n'existe pas, ajouter la migration :
```bash
cd apps/backend
npx prisma migrate dev --name add_isPublic_to_product
```

---

### 6. "API_BASE_URL is not defined"

**Symptôme** :
```
ReferenceError: API_BASE_URL is not defined
```

**Solution** :
Vérifier que `API_BASE_URL` est défini dans `useAuth.tsx` :
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://api.luneo.app'
    : 'http://localhost:3001');
```

Vérifier que la variable d'environnement est définie dans Vercel :
- `NEXT_PUBLIC_API_URL` doit être définie

---

## 🟡 ERREURS MOYENNES

### 7. "TypeError: Cannot read property 'getSignedUrl' of undefined"

**Symptôme** :
```
TypeError: Cannot read property 'getSignedUrl' of undefined
```

**Solution** :
Vérifier que `StorageService` est bien injecté :
```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly configService: ConfigService,
  private readonly storageService: StorageService, // ✅ Doit être ici
) {}
```

Et vérifier que `StorageModule` est importé dans `ArStudioModule`.

---

### 8. "discountService.validateAndApplyDiscount is not a function"

**Symptôme** :
```
TypeError: discountService.validateAndApplyDiscount is not a function
```

**Solution** :
Vérifier que `DiscountService` a bien la méthode `validateAndApplyDiscount` :
```typescript
// Dans discount.service.ts
async validateAndApplyDiscount(
  code: string,
  subtotalCents: number,
  brandId?: string,
  userId?: string,
): Promise<DiscountResult> {
  // ...
}
```

---

## 🟢 ERREURS MINEURES

### 9. Warnings TypeScript non bloquants

**Symptôme** :
```
error TS2688: Cannot find type definition file for 'bcryptjs'
error TS2688: Cannot find type definition file for 'minimatch'
```

**Solution** :
Ces erreurs sont non bloquantes et n'empêchent pas le build. Elles peuvent être ignorées ou corrigées en ajoutant :
```bash
pnpm add -D @types/bcryptjs @types/minimatch
```

---

## 📋 CHECKLIST DE DÉPANNAGE

1. ✅ Vérifier que tous les fichiers existent
2. ✅ Vérifier les imports dans les modules
3. ✅ Vérifier les providers dans les modules
4. ✅ Vérifier les injections dans les constructeurs
5. ✅ Vérifier les exports dans les modules
6. ✅ Vérifier le schéma Prisma
7. ✅ Vérifier les variables d'environnement

---

## 🚀 COMMANDES DE DÉPANNAGE

```bash
# Vérifier les fichiers critiques
./scripts/monitor-railway-build.sh

# Vérifier les imports
grep -r "import.*DiscountService" apps/backend/src/modules/orders/
grep -r "import.*StorageModule" apps/backend/src/modules/ar/

# Vérifier les providers
grep -A 5 "providers:" apps/backend/src/modules/orders/orders.module.ts
grep -A 5 "imports:" apps/backend/src/modules/ar/ar-studio.module.ts

# Vérifier le schéma Prisma
grep "isPublic" apps/backend/prisma/schema.prisma
```

---

*Guide de dépannage - 10 Janvier 2025*
