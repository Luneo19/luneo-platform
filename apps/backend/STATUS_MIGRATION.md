# 📊 Statut de la Migration add_user_name_column

## ✅ Migration Créée

- **Fichier** : `prisma/migrations/20260104200801_add_user_name_column/migration.sql`
- **Format** : Migration Prisma standard avec timestamp
- **Contenu** : Ajoute la colonne `name TEXT` à la table `User` si elle n'existe pas

## 🔄 Exécution Automatique

Le code dans `main.ts` (lignes 52-68) exécute automatiquement `pnpm prisma migrate deploy` au démarrage de l'application. 

**La migration devrait être exécutée automatiquement lors du prochain redémarrage du service.**

## ⏳ Vérification

### 1. Vérifier les Logs de Déploiement

```bash
railway logs --tail 1000 | grep -E "(Running database migrations|Database migrations completed|migration)"
```

### 2. Vérifier que la Colonne Existe

Via le shell Railway :
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'name';
```

### 3. Tester `/api/auth/signup`

```bash
curl -X POST https://api.luneo.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Devrait retourner un code **201** si la migration a réussi.

## 🔧 Si la Migration n'est Pas Exécutée Automatiquement

Si après le redémarrage la colonne n'existe toujours pas, exécuter manuellement via le shell Railway :

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'User' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "name" TEXT;
    RAISE NOTICE 'Column "name" added to User table';
  ELSE
    RAISE NOTICE 'Column "name" already exists in User table';
  END IF;
END $$;
```

## 📝 Notes

- La migration est idempotente (peut être exécutée plusieurs fois sans erreur)
- Le déploiement actuel devrait inclure la migration
- Attendre que le déploiement se termine avant de tester





