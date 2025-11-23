# 🚀 COMMANDES DE DÉPLOIEMENT VERCEL

## Étape 1: Connexion Vercel

```bash
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
vercel login
```

Sélectionnez votre méthode de connexion (GitHub, Google, Email, etc.)

## Étape 2: Configuration Variables d'Environnement

```bash
# Exécuter le script automatique
./scripts/add-vercel-env-complete.sh
```

OU ajouter manuellement une par une:

```bash
# Supabase
echo "https://obrijgptqztacolemsbk.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "https://obrijgptqztacolemsbk.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview
echo "https://obrijgptqztacolemsbk.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL development

echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjYwMjIsImV4cCI6MjA3Njg0MjAyMn0.0dxttYi1WPLuqdkI52a0Rary81wtYdjnBt4F0q4tYV8" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development

echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI2NjAyMiwiZXhwIjoyMDc2ODQyMDIyfQ.r8pgz9G88K41Jpseg_vseH9jevqK17zJcNcM6YQR-YE" | vercel env add SUPABASE_SERVICE_ROLE_KEY production preview development

# Application
echo "https://app.luneo.app/api" | vercel env add NEXT_PUBLIC_API_URL production preview development
echo "https://app.luneo.app" | vercel env add NEXT_PUBLIC_APP_URL production preview development

# OAuth Google
echo "212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com" | vercel env add NEXT_PUBLIC_GOOGLE_CLIENT_ID production preview development
echo "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" | vercel env add GOOGLE_CLIENT_SECRET production preview development

# OAuth GitHub
echo "Ov23liJmVOHyn8tfxgLi" | vercel env add NEXT_PUBLIC_GITHUB_CLIENT_ID production preview development
echo "81bbea63bfc5651e048e5e7f62f69c5d4aad55f9" | vercel env add GITHUB_CLIENT_SECRET production preview development

# Stripe (remplacer par vos vraies clés)
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production preview development
vercel env add STRIPE_SECRET_KEY production preview development
vercel env add STRIPE_WEBHOOK_SECRET production preview development
```

## Étape 3: Déploiement Production

```bash
vercel --prod
```

## Vérification

```bash
# Voir toutes les variables configurées
vercel env ls

# Voir les déploiements
vercel ls
```
