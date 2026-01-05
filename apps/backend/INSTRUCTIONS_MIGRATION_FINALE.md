# 🔧 Instructions Finales pour Exécuter la Migration

## ⚠️ Important

La commande `railway run` ne permet pas d'exécuter du SQL directement. La migration doit être exécutée via le **Dashboard Railway** avec un shell interactif.

## 📋 Étapes à Suivre

### 1. Ouvrir le Shell Railway

1. Aller sur **https://railway.app**
2. Ouvrir le projet **`believable-learning`**
3. Ouvrir le service **`backend`**
4. Aller dans l'onglet **"Deployments"**
5. Cliquer sur **"..."** → **"Open Shell"**

### 2. Exécuter la Migration SQL

Dans le shell Railway, exécuter cette commande :

```bash
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

### 3. Vérifier que la Migration a Réussi

Exécuter cette commande pour vérifier :

```bash
psql $DATABASE_URL -c "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'name';"
```

Devrait retourner :
```
 column_name | data_type | is_nullable 
-------------+-----------+-------------
 name        | text      | YES
```

### 4. Tester `/api/auth/signup`

Après la migration, tester l'endpoint :

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
- Après la migration, l'application devrait fonctionner normalement

## ✅ Checklist

- [ ] Shell Railway ouvert
- [ ] Migration SQL exécutée
- [ ] Colonne `name` vérifiée
- [ ] `/api/auth/signup` testé et fonctionnel


