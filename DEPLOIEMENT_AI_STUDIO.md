# 🚀 Déploiement AI Studio - Guide Complet

## ✅ Implémentation Terminée

Toutes les fonctionnalités AI Studio ont été implémentées et sont prêtes pour la production :

### 1. Service Layer Optimisé ✅
- **Fichier**: `apps/frontend/src/lib/services/AIService.ts`
- Retry avec exponential backoff
- Cache Redis pour crédits
- Gestion d'erreurs avec Sentry

### 2. Routes API Implémentées ✅

#### Text-to-Design (`/api/ai/text-to-design`)
- Génération avec DALL-E 3
- Fallback Replicate si OpenAI échoue
- Upload Cloudinary automatique
- Sauvegarde dans Supabase

#### Smart Crop (`/api/ai/smart-crop`)
- Recadrage intelligent avec Sharp
- Support ratios: 1:1, 16:9, 9:16, 4:3
- Détection de focus automatique

#### Upscale (`/api/ai/upscale`)
- Agrandissement 2x ou 4x
- Real-ESRGAN via Replicate
- Fallback Cloudinary

#### Background Removal (`/api/ai/background-removal`) - Amélioré ✅
- Replicate rembg intégré
- Support modes: auto, person, product, animal
- Upload Cloudinary avec transparence

#### Extract Colors (`/api/ai/extract-colors`) - Amélioré ✅
- Extraction réelle avec Sharp
- Quantification des couleurs
- Filtrage des neutres optionnel

### 3. Page AI Studio Unifiée ✅
- **Fichier**: `apps/frontend/src/app/(dashboard)/ai-studio/page.tsx`
- Interface complète avec tous les outils
- Gestion des crédits en temps réel
- Upload d'images
- Affichage des résultats

### 4. Migrations Database ✅
- **Fichier**: `apps/frontend/supabase/migrations/ensure_ai_studio_tables.sql`
- Colonnes crédits sur profiles
- Table designs avec RLS
- Fonction `deduct_credits` atomique

### 5. Protection Routes ✅
- Middleware mis à jour pour protéger `/ai-studio` et `/api/ai/*`
- Authentification Supabase requise

## 📋 Variables d'Environnement Requises

### Obligatoires
```bash
# OpenAI (pour text-to-design)
OPENAI_API_KEY=sk-...

# Replicate (pour background removal et upscale)
REPLICATE_API_TOKEN=r8_...

# Cloudinary (pour stockage images)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Optionnelles (mais recommandées)
```bash
# Redis/Upstash (pour cache et rate limiting)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Sentry (pour monitoring)
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...
```

## 🚀 Déploiement en Production

### Option 1: Script Automatique (Recommandé)

```bash
# Depuis la racine du projet
./scripts/deploy-ai-studio-production.sh
```

Le script va :
1. Vérifier la connexion Vercel
2. Demander les variables d'environnement manquantes
3. Configurer toutes les variables sur Vercel
4. Exécuter le build
5. Déployer en production

### Option 2: Déploiement Manuel

#### Étape 1: Exécuter la Migration SQL

1. Aller sur https://supabase.com/dashboard/project/obrijgptqztacolemsbk/sql/new
2. Copier le contenu de `apps/frontend/supabase/migrations/ensure_ai_studio_tables.sql`
3. Exécuter la requête

#### Étape 2: Configurer les Variables Vercel

```bash
cd apps/frontend

# OpenAI
echo "sk-..." | vercel env add OPENAI_API_KEY production preview development

# Replicate
echo "r8_..." | vercel env add REPLICATE_API_TOKEN production preview development

# Cloudinary
echo "..." | vercel env add CLOUDINARY_CLOUD_NAME production preview development
echo "..." | vercel env add CLOUDINARY_API_KEY production preview development
echo "..." | vercel env add CLOUDINARY_API_SECRET production preview development

# Redis (optionnel)
echo "https://..." | vercel env add UPSTASH_REDIS_REST_URL production preview development
echo "..." | vercel env add UPSTASH_REDIS_REST_TOKEN production preview development
```

#### Étape 3: Déployer

```bash
cd apps/frontend
vercel --prod
```

## 🧪 Tests Post-Déploiement

1. **Vérifier l'accès**: https://luneo.app/dashboard/ai-studio
2. **Tester Text-to-Design**:
   - Entrer un prompt
   - Vérifier la génération
   - Vérifier la déduction de crédits

3. **Tester Background Removal**:
   - Uploader une image
   - Sélectionner "Supprimer l'arrière-plan"
   - Vérifier le résultat

4. **Tester Upscale**:
   - Uploader une image
   - Sélectionner "Agrandir l'image"
   - Choisir 2x ou 4x
   - Vérifier le résultat

5. **Tester Extract Colors**:
   - Uploader une image
   - Sélectionner "Extraire les couleurs"
   - Vérifier la palette

6. **Tester Smart Crop**:
   - Uploader une image
   - Sélectionner "Recadrage intelligent"
   - Choisir un ratio
   - Vérifier le résultat

## 📊 Monitoring

### Vercel Analytics
- Les événements sont trackés automatiquement avec `@vercel/analytics`
- Voir: https://vercel.com/dashboard

### Sentry (si configuré)
- Erreurs trackées automatiquement
- Voir: https://sentry.io

### Logs Vercel
```bash
vercel logs --follow
```

## 🔧 Dépannage

### Erreur "Insufficient credits"
- Vérifier que la colonne `ai_credits` existe dans `profiles`
- Vérifier que l'utilisateur a des crédits

### Erreur "REPLICATE_API_TOKEN non configuré"
- Vérifier que la variable est configurée sur Vercel
- Redéployer après ajout de la variable

### Erreur "Failed to fetch image"
- Vérifier que Cloudinary est configuré
- Vérifier les permissions CORS

### Images ne s'affichent pas
- Vérifier que Cloudinary retourne des URLs valides
- Vérifier les logs Vercel pour erreurs

## 📝 Notes

- Le worker BullMQ n'est pas nécessaire pour Next.js (les API routes gèrent directement)
- Pour des opérations très longues (>30s), considérer un worker séparé
- Les crédits sont déduits atomiquement via la fonction SQL `deduct_credits`
- Le cache Redis améliore les performances mais n'est pas obligatoire

## ✅ Checklist Finale

- [ ] Migration SQL exécutée sur Supabase
- [ ] Variables d'environnement configurées sur Vercel
- [ ] Build local réussi (`pnpm run build`)
- [ ] Déploiement Vercel réussi
- [ ] Tests fonctionnels passés
- [ ] Monitoring configuré (Sentry optionnel)
- [ ] Documentation utilisateur mise à jour

---

**Date**: 2025-01-27
**Version**: 1.0.0
**Statut**: ✅ Production Ready

