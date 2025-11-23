# Configuration du domaine app.luneo.app

## ✅ DNS Records à modifier dans Cloudflare

### 1. Supprimer le conflit luneo.app
**Action :** Supprimer l'un des deux A records pour `luneo.app`
**Garder seulement :** `luneo.app → 76.76.21.21` (Vercel)

### 2. Ajouter le domaine dans Vercel
**Action :** Ajouter `app.luneo.app` comme domaine personnalisé dans Vercel
**Commande :** `vercel domains add app.luneo.app`

### 3. Configuration finale DNS
```
# Domain principal
luneo.app → 76.76.21.21 (Vercel)

# Frontend
app.luneo.app → 76.76.21.21 (Vercel)
dashboard.luneo.app → 76.76.21.21 (Vercel)

# Backend
api.luneo.app → 116.203.31.129 (Hetzner)
backend.luneo.app → 116.203.31.129 (Hetzner)
```

## 🔐 Variables d'environnement Vercel

À configurer dans le dashboard Vercel :

```
NEXT_PUBLIC_API_URL=https://api.luneo.app/api
NEXT_PUBLIC_APP_URL=https://app.luneo.app
NEXT_PUBLIC_SUPABASE_URL=https://bkasxmzwilkbmszovedc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrYXN4bXp3aWxrYm1zem92ZWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMTcyOTUsImV4cCI6MjA2ODc5MzI5NX0.EvBSoGAfT4hgGAZBRM5T-hiFz5zHfjoEU4H4amL3xx8
NEXT_PUBLIC_GOOGLE_CLIENT_ID=212705987732-qa90mdvfdv3b2ca441li1b7bivfariru.apps.googleusercontent.com
NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23liJmVOHyn8tfxgLi
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
NEXT_PUBLIC_STRIPE_SUCCESS_URL=https://app.luneo.app/?success=1
NEXT_PUBLIC_STRIPE_CANCEL_URL=https://app.luneo.app/?canceled=1
```
