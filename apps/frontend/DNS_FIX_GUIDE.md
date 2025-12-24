# 🚨 CORRECTION URGENTE DNS - Luneo.app

## Problème identifié
- `https://luneo.com` → Redirige vers `https://www.dynamo.com/assets.htm` ❌
- Votre vrai domaine est `https://luneo.app` ✅

## Actions à effectuer dans Cloudflare

### 1. Supprimer le domaine luneo.com
**Action :** Supprimer complètement le domaine `luneo.com` de votre configuration Cloudflare
**Raison :** Ce n'est pas votre domaine principal et il cause des conflits

### 2. Configuration DNS correcte pour luneo.app

```
# Domain principal
luneo.app → 76.76.21.21 (Vercel)

# Frontend
app.luneo.app → 76.76.21.21 (Vercel)
www.luneo.app → CNAME → luneo.app

# Backend
api.luneo.app → 116.203.31.129 (Hetzner)
backend.luneo.app → 116.203.31.129 (Hetzner)
```

### 3. Vercel Domain Configuration
**Action :** Configurer `luneo.app` comme domaine principal dans Vercel
**Commande :** `vercel domains add luneo.app`

## Résultat attendu
- `https://luneo.app` → Votre application Luneo Enterprise
- `https://app.luneo.app` → Votre application Luneo Enterprise
- Plus de redirection vers dynamo.com
