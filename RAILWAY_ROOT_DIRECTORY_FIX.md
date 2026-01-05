# 🔧 Correction du Root Directory Railway

## ❌ Problème

Les logs montrent: `Could not find root directory: /apps/backend`

## 🔍 Cause

Railway cherche un chemin **absolu** `/apps/backend` au lieu d'un chemin **relatif** `apps/backend` depuis la racine du repository GitHub.

## ✅ Solution

Le Root Directory doit être configuré dans Railway Dashboard (pas dans `railway.toml`):

### Étapes pour corriger:

1. **Allez sur Railway Dashboard:**
   https://railway.com/project/9b6c45fe-e44b-4fad-ba21-e88df51a39e4/service/5592b681-a0bf-42c0-b4d9-6bd28e62f3fc

2. **Cliquez sur l'onglet "Settings"**

3. **Trouvez la section "Source" → "Root Directory"**

4. **Changez de:**
   ```
   /apps/backend
   ```
   
   **À:**
   ```
   apps/backend
   ```
   
   ⚠️ **IMPORTANT:** Pas de `/` au début ! C'est un chemin relatif depuis la racine du repo.

5. **Sauvegardez**

6. **Railway redéploiera automatiquement**

## 📋 Vérification

Après la correction, Railway devrait:
- Trouver le répertoire `apps/backend`
- Détecter `package.json`
- Détecter `nixpacks.toml`
- Exécuter le build correctement

## 🔍 Structure attendue

```
luneo-platform/          (racine du repo GitHub)
├── apps/
│   └── backend/         (Root Directory: apps/backend)
│       ├── package.json
│       ├── nixpacks.toml
│       ├── railway.toml
│       └── ...
├── packages/
└── pnpm-workspace.yaml
```

## ✅ Configuration finale

- **Root Directory:** `apps/backend` (sans `/` initial)
- **Builder:** NIXPACKS (détecté via `nixpacks.toml`)
- **Health Check:** `/api/v1/health`



