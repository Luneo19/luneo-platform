# 🔧 Correction des Erreurs Railway

## 🔍 Problèmes Identifiés

### 1. Start Command Incorrect
**Problème :** Le start command utilisait `pnpm start` qui peut échouer si pnpm n'est pas dans le PATH ou si le script n'est pas trouvé.

**Solution :** Utiliser directement `node dist/src/main.js` qui est plus fiable.

### 2. Chemin Prisma dans Migrations
**Problème :** `process.cwd()` peut pointer vers le mauvais répertoire dans Railway.

**Solution :** Utiliser `__dirname` pour obtenir le répertoire du backend de manière fiable.

---

## ✅ Corrections Appliquées

### 1. Fichiers de Configuration Mis à Jour

#### `railway.json`
```json
{
  "deploy": {
    "startCommand": "cd apps/backend && node dist/src/main.js"
  }
}
```

#### `apps/backend/railway.json`
```json
{
  "deploy": {
    "startCommand": "node dist/src/main.js"
  }
}
```

#### `nixpacks.toml`
```toml
[start]
cmd = "cd apps/backend && node dist/src/main.js"
```

#### `apps/backend/nixpacks.toml`
```toml
[start]
cmd = "node dist/src/main.js"
```

### 2. Code Backend Corrigé

#### `apps/backend/src/main.ts`
- Utilisation de `__dirname` au lieu de `process.cwd()` pour les migrations Prisma
- Chemin correct vers le répertoire backend

---

## 📋 Vérifications à Faire dans Railway

### 1. Root Directory
Dans les **Settings** du service Railway :
- **Root Directory :** `apps/backend` ✅

### 2. Build Command
- **Build Command :** `pnpm install && pnpm prisma generate && pnpm build` ✅

### 3. Start Command
- **Start Command :** `node dist/src/main.js` ✅ (corrigé)

### 4. Variables d'Environnement
Vérifier que ces variables sont configurées :
- `DATABASE_URL` (si PostgreSQL est ajouté)
- `NODE_ENV=production`
- `JWT_SECRET=<secret>`
- `PORT` (fourni automatiquement par Railway)

---

## 🚀 Redéploiement

Après les corrections, redéployer :

1. **Via Dashboard Railway :**
   - Aller dans le service
   - Cliquer sur **"Redeploy"**

2. **Via CLI :**
   ```bash
   railway up
   ```

---

## 🔍 Vérification Post-Déploiement

### 1. Vérifier les Logs
```bash
railway logs --tail 200
```

**Vérifier :**
- ✅ Build réussi
- ✅ Prisma generate réussi
- ✅ Application démarrée
- ✅ Pas d'erreurs de connexion à la base de données

### 2. Vérifier le Health Check
```bash
curl $(railway domain)/health
```

**Attendu :** `{"status":"ok"}`

### 3. Vérifier les Erreurs Courantes

#### Erreur : "Cannot find module"
**Solution :** Vérifier que `pnpm install` s'exécute correctement

#### Erreur : "Prisma Client not generated"
**Solution :** Vérifier que `pnpm prisma generate` s'exécute

#### Erreur : "Database connection failed"
**Solution :** 
- Vérifier que PostgreSQL est ajouté
- Vérifier que `DATABASE_URL` est configuré
- Les migrations échoueront si `DATABASE_URL` n'est pas configuré (c'est normal)

#### Erreur : "Port already in use"
**Solution :** Normal, Railway gère le port via `process.env.PORT`

---

## ✅ Checklist

- [x] Start command corrigé dans tous les fichiers
- [x] Chemin Prisma corrigé dans main.ts
- [ ] Root Directory configuré dans Railway
- [ ] Build Command configuré dans Railway
- [ ] Start Command configuré dans Railway (corrigé)
- [ ] Variables d'environnement configurées
- [ ] Redéploiement effectué
- [ ] Logs vérifiés
- [ ] Health check fonctionne

---

## 📚 Documentation

- **Dashboard :** https://railway.com/project/0e3eb9ba-6846-4e0e-81d2-bd7da54da971
- **Guide complet :** `DEPLOIEMENT_RAILWAY.md`

---

**✅ Corrections appliquées ! Redéployez pour appliquer les changements.**

