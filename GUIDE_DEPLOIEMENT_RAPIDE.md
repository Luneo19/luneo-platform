# 🚀 Guide de Déploiement Rapide - AI Studio

## Option 1: Mode Automatique (Recommandé)

### Prérequis
Créez un fichier `apps/frontend/.env.local` avec toutes les variables :

```bash
# Obligatoires
OPENAI_API_KEY=sk-...
REPLICATE_API_TOKEN=r8_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NEXT_PUBLIC_SUPABASE_URL=https://obrijgptqztacolemsbk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optionnelles
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
SENTRY_DSN=https://...
```

### Exécution
```bash
./scripts/deploy-ai-studio-auto.sh
```

Le script va :
1. ✅ Charger les variables depuis `.env.local`
2. ✅ Vérifier que tout est présent
3. ✅ Vous demander d'exécuter la migration SQL (une seule fois)
4. ✅ Configurer automatiquement Vercel
5. ✅ Builder et déployer

---

## Option 2: Mode Interactif

### Exécution
```bash
./scripts/deploy-ai-studio-complete.sh
```

Le script va vous demander chaque variable interactivement.

---

## ⚠️ Étape Importante: Migration SQL

**Avant le déploiement**, vous devez exécuter la migration SQL **une seule fois** :

1. Allez sur: https://supabase.com/dashboard/project/obrijgptqztacolemsbk/sql/new
2. Copiez le contenu de: `apps/frontend/supabase/migrations/ensure_ai_studio_tables.sql`
3. Collez dans l'éditeur SQL
4. Cliquez sur "Run" (Cmd+Enter)

Cette migration crée :
- ✅ Colonnes `ai_credits` sur `profiles`
- ✅ Table `designs` avec RLS
- ✅ Fonction `deduct_credits` atomique

---

## ✅ Vérification Post-Déploiement

1. **Accès**: https://luneo.app/dashboard/ai-studio
2. **Tester chaque fonctionnalité**:
   - Text-to-Design
   - Background Removal
   - Upscale
   - Extract Colors
   - Smart Crop

---

## 🔧 Dépannage

### Variables manquantes
```bash
# Vérifier les variables Vercel
vercel env ls
```

### Re-déployer
```bash
cd apps/frontend
vercel --prod
```

### Logs
```bash
vercel logs --follow
```

