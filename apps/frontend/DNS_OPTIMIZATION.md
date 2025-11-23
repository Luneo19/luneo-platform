# Configuration DNS Optimisée pour Luneo Enterprise

## ✅ Records DNS Corrects (à conserver)

### Frontend (Vercel)
- **app.luneo.app** → `76.76.21.21` ✅
- **dashboard.luneo.app** → `76.76.21.21` ✅

### Backend (Hetzner)
- **api.luneo.app** → `116.203.31.129` ✅
- **backend.luneo.app** → `116.203.31.129` ✅

## 🔧 Modifications Recommandées

### 1. Résoudre le conflit luneo.app
**Problème :** Vous avez 2 A records pour `luneo.app` avec des IPs différentes
**Solution :** Supprimer l'un des deux et garder seulement :
```
luneo.app → 76.76.21.21 (Vercel - pour le site principal)
```

### 2. Ajouter un record pour le domaine principal
```
www.luneo.app → CNAME → luneo.app
```

### 3. Records optionnels pour améliorer la performance
```
admin.luneo.app → CNAME → app.luneo.app
```

## 🚀 Configuration Finale Recommandée

```
# Domain principal
luneo.app → 76.76.21.21 (Vercel)

# Frontend
app.luneo.app → 76.76.21.21 (Vercel)
dashboard.luneo.app → 76.76.21.21 (Vercel)
www.luneo.app → CNAME → luneo.app

# Backend
api.luneo.app → 116.203.31.129 (Hetzner)
backend.luneo.app → 116.203.31.129 (Hetzner)
```

## 📧 Email Configuration (SendGrid)
Tous vos records SendGrid sont corrects et peuvent rester.
