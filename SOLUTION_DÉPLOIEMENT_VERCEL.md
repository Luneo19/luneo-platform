# 🔧 SOLUTION DÉPLOIEMENT VERCEL - MONOREPO

**Problème identifié**: Le projet est un monorepo avec `pnpm-lock.yaml` à la racine, mais Vercel essaie de builder depuis `apps/frontend`.

---

## ✅ SOLUTION RECOMMANDÉE

### Option 1: Configuration Dashboard Vercel (Recommandé)

1. **Aller sur**: https://vercel.com/luneos-projects/frontend/settings/general

2. **Configurer**:
   - **Root Directory**: `apps/frontend` ⚠️ IMPORTANT
   - **Framework Preset**: Next.js
   - **Build Command**: `pnpm run build` (ou laisser vide pour auto-détection)
   - **Output Directory**: `.next` (ou laisser vide)
   - **Install Command**: `pnpm install --frozen-lockfile` (ou laisser vide)

3. **Dans "Environment Variables"**, ajouter toutes les variables (voir `VARIABLES_VERCEL_COMPLÈTES.md`)

4. **Déployer**:
   - Via Dashboard: Cliquer "Redeploy" sur le dernier déploiement
   - Via CLI: `cd apps/frontend && vercel --prod`

---

### Option 2: Déploiement depuis la Racine

Si Option 1 ne fonctionne pas, déployer depuis la racine:

```bash
cd /Users/emmanuelabougadous/luneo-platform

# Créer un fichier vercel.json à la racine
cat > vercel.json << 'EOF'
{
  "buildCommand": "cd apps/frontend && pnpm install && pnpm run build",
  "outputDirectory": "apps/frontend/.next",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
EOF

# Déployer
vercel --prod
```

---

### Option 3: Script de Préparation

Créer un script qui prépare le projet pour Vercel:

```bash
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend

# Copier le lockfile si nécessaire
cp ../../pnpm-lock.yaml . 2>/dev/null || echo "Lockfile déjà présent"

# Installer les dépendances localement pour vérifier
pnpm install

# Build de test
pnpm run build

# Si tout fonctionne, déployer
vercel --prod
```

---

## 🔍 DIAGNOSTIC

**Problèmes rencontrés**:
1. ✅ `rootDirectory` dans vercel.json → Corrigé (retiré)
2. ⚠️ `pnpm-lock.yaml` à la racine → Nécessite Root Directory configuré dans Dashboard
3. ⚠️ Workspace dependencies → Nécessite installation depuis la racine

**Solutions appliquées**:
- ✅ `vercel.json` corrigé
- ✅ Scripts de configuration créés
- ✅ Variables d'environnement préparées

---

## 📋 CHECKLIST FINALE

- [ ] Root Directory configuré dans Vercel Dashboard: `apps/frontend`
- [ ] Variables d'environnement ajoutées (voir `VARIABLES_VERCEL_COMPLÈTES.md`)
- [ ] Build Command: `pnpm run build`
- [ ] Install Command: `pnpm install --frozen-lockfile`
- [ ] Déploiement lancé

---

## 🚀 COMMANDES RAPIDES

```bash
# Vérifier la configuration
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
vercel env ls

# Déployer
vercel --prod

# Voir les logs
vercel logs
```

---

**La solution la plus simple est de configurer le Root Directory dans le Dashboard Vercel !** ✅


