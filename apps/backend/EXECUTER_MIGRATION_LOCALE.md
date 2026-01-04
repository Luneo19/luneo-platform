# 🔧 Exécuter la Migration depuis la Machine Locale

## 📋 Option 1 : Via Connexion Directe PostgreSQL

Si vous avez accès à la `DATABASE_URL` de Railway, vous pouvez exécuter la migration directement depuis votre machine locale.

### 1. Récupérer la DATABASE_URL

```bash
railway variables | grep DATABASE_URL
```

### 2. Exécuter la Migration

**Option A : Via psql directement**

```bash
psql "VOTRE_DATABASE_URL_ICI" << 'EOF'
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

**Option B : Via Prisma Studio (si installé)**

1. Configurer `DATABASE_URL` dans votre `.env` local
2. Exécuter :
```bash
cd apps/backend
pnpm prisma studio
```
Puis exécuter la requête SQL dans l'interface

**Option C : Via un Client PostgreSQL (DBeaver, pgAdmin, etc.)**

1. Récupérer la `DATABASE_URL`
2. Se connecter avec un client PostgreSQL
3. Exécuter la migration SQL

## 📋 Option 2 : Créer un Endpoint Temporaire (Déconseillé en Production)

⚠️ **Attention** : Cette option n'est pas recommandée pour la production, mais peut servir de solution temporaire.

Créer un endpoint admin temporaire dans le backend qui exécute la migration.

## 📋 Option 3 : Attendre un Redéploiement Réussi

Si les déploiements échouent actuellement, il serait mieux de :
1. Résoudre les problèmes de déploiement
2. Une fois le déploiement réussi, la migration Prisma devrait s'exécuter automatiquement

## ✅ Recommandation

**Option 1 (via psql local)** est la plus sûre et rapide si vous avez accès à la `DATABASE_URL`.


