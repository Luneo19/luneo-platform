# 🚀 CONFIGURATION DÉPLOIEMENT AUTOMATIQUE

**Date**: 15 janvier 2025

---

## ✅ COMMIT PUSHÉ AVEC SUCCÈS

Le commit avec tous les changements du Super Admin Dashboard a été poussé vers `main`.

**Commit**: `01b77c3`  
**Fichiers**: 264 fichiers modifiés  
**Insertions**: 36,455 lignes

---

## 🔧 CONFIGURATION DÉPLOIEMENT AUTOMATIQUE

### 1. RAILWAY (Backend) - Déploiement Automatique

#### Option A : Via GitHub Actions (Recommandé)

**Workflow créé**: `.github/workflows/deploy-railway-backend.yml`

**Configuration requise**:

1. **Créer un token Railway**:
   ```bash
   # Via Railway Dashboard
   # https://railway.app/account/tokens
   # Créer un nouveau token avec permissions "Full Access"
   ```

2. **Récupérer le Service ID**:
   ```bash
   cd apps/backend
   railway status
   # Notez le Service ID affiché
   ```

3. **Ajouter les secrets dans GitHub**:
   - Allez sur: https://github.com/Luneo19/luneo-platform/settings/secrets/actions
   - Ajoutez:
     - `RAILWAY_TOKEN`: Votre token Railway
     - `RAILWAY_SERVICE_ID`: Votre Service ID

**Déclenchement**:
- Automatique à chaque push sur `main` qui modifie `apps/backend/**`
- Manuel via "Run workflow" dans GitHub Actions

---

#### Option B : Via Railway CLI (Manuel)

```bash
cd apps/backend
railway login
railway link -p 0e3eb9ba-6846-4e0e-81d2-bd7da54da971
railway up
```

---

### 2. VERCEL (Frontend) - Déploiement Automatique

#### Option A : Via GitHub Actions (Recommandé)

**Workflow créé**: `.github/workflows/deploy-vercel-frontend.yml`

**Configuration requise**:

1. **Créer un token Vercel**:
   ```bash
   # Via Vercel Dashboard
   # https://vercel.com/account/tokens
   # Créer un nouveau token avec permissions "Full Access"
   ```

2. **Récupérer les IDs**:
   ```bash
   cd apps/frontend
   cat .vercel/project.json
   # Notez "orgId" et "projectId"
   ```

3. **Ajouter les secrets dans GitHub**:
   - Allez sur: https://github.com/Luneo19/luneo-platform/settings/secrets/actions
   - Ajoutez:
     - `VERCEL_TOKEN`: Votre token Vercel
     - `VERCEL_ORG_ID`: Votre Org ID
     - `VERCEL_PROJECT_ID`: Votre Project ID

**Déclenchement**:
- Automatique à chaque push sur `main` qui modifie `apps/frontend/**`
- Manuel via "Run workflow" dans GitHub Actions

---

#### Option B : Via Vercel CLI (Manuel)

```bash
cd apps/frontend
vercel login
vercel link
vercel --prod
```

---

## 🎯 SCRIPT DE CONFIGURATION RAPIDE

Exécutez le script pour configurer automatiquement:

```bash
./scripts/setup-auto-deployment.sh
```

Ce script va:
- ✅ Vérifier Railway CLI
- ✅ Vérifier Vercel CLI
- ✅ Afficher les instructions pour configurer GitHub Secrets
- ✅ Confirmer que les workflows sont prêts

---

## 📋 CHECKLIST DE CONFIGURATION

### Railway (Backend)
- [ ] Token Railway créé
- [ ] Service ID récupéré
- [ ] Secrets GitHub ajoutés (`RAILWAY_TOKEN`, `RAILWAY_SERVICE_ID`)
- [ ] Workflow GitHub Actions configuré
- [ ] Test de déploiement réussi

### Vercel (Frontend)
- [ ] Token Vercel créé
- [ ] Org ID et Project ID récupérés
- [ ] Secrets GitHub ajoutés (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`)
- [ ] Root Directory configuré (`apps/frontend`)
- [ ] Workflow GitHub Actions configuré
- [ ] Test de déploiement réussi

---

## 🧪 TESTER LE DÉPLOIEMENT

### Test Railway
```bash
# Déclencher manuellement via GitHub Actions
# Ou via CLI:
cd apps/backend
railway up
```

### Test Vercel
```bash
# Déclencher manuellement via GitHub Actions
# Ou via CLI:
cd apps/frontend
vercel --prod
```

---

## 🔍 VÉRIFICATION

Après configuration, vérifier que:

1. **GitHub Actions**:
   - Allez sur: https://github.com/Luneo19/luneo-platform/actions
   - Vérifiez que les workflows apparaissent
   - Testez avec "Run workflow"

2. **Railway**:
   - Allez sur: https://railway.app
   - Vérifiez que le service se déploie automatiquement

3. **Vercel**:
   - Allez sur: https://vercel.com/dashboard
   - Vérifiez que le projet se déploie automatiquement

---

## ✅ STATUT

- ✅ Workflows GitHub Actions créés
- ✅ Script de configuration créé
- ✅ Documentation complète
- ⏳ En attente de configuration des secrets GitHub

**Une fois les secrets configurés, le déploiement sera 100% automatique !** 🚀
