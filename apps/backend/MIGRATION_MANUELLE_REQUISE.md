# ⚠️ Migration Manuelle Requise

## 🔍 Constat

La migration `add_user_name_column` n'a pas été exécutée automatiquement. Le test de `/api/auth/signup` retourne toujours l'erreur :
```
The column `User.name` does not exist in the current database.
```

## 🔧 Solution : Exécuter la Migration Manuellement

### Option 1 : Via Dashboard Railway (Recommandé)

1. Aller sur https://railway.app
2. Ouvrir le projet `believable-learning`
3. Ouvrir le service `backend`
4. Aller dans **"Deployments"**
5. Cliquer sur **"..."** → **"Open Shell"**
6. Exécuter la commande SQL suivante :

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

### Option 2 : Via psql dans le Shell Railway

Dans le shell Railway, exécuter :

```bash
cd apps/backend
psql $DATABASE_URL << 'EOF'
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
EOF
```

### Option 3 : Via Prisma Migrate (si accessible)

```bash
cd apps/backend
pnpm prisma migrate deploy
```

## ✅ Vérification

Après exécution, vérifier que la colonne existe :

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'name';
```

Devrait retourner :
```
 column_name | data_type | is_nullable 
-------------+-----------+-------------
 name        | text      | YES
```

## 🧪 Test Final

Après la migration, tester `/api/auth/signup` :

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

Devrait retourner un code **201** avec les données de l'utilisateur créé.

## 📝 Notes

- La migration est **idempotente** (peut être exécutée plusieurs fois sans erreur)
- La colonne `name` est **optionnelle** (`TEXT` nullable)
- Après la migration, **redémarrer le service** pour que Prisma Client soit régénéré avec le nouveau schéma




