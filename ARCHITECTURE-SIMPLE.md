# 🏗️ ARCHITECTURE SIMPLE DE LUNEO

**Date** : 24 décembre 2025

---

## 🎯 VUE D'ENSEMBLE

```
┌─────────────────────────────────────────────────────────┐
│                    UTILISATEUR                          │
│              (Navigateur Web)                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTPS
                     │
         ┌───────────▼───────────┐
         │                       │
         │      FRONTEND         │
         │    (Next.js)          │
         │  Vercel               │
         │  luneo.app            │
         │                       │
         └───────────┬───────────┘
                     │
                     │ API REST
                     │ (HTTP/JSON)
                     │
         ┌───────────▼───────────┐
         │                       │
         │      BACKEND          │
         │    (NestJS)           │
         │  Railway               │
         │  backend-production   │
         │                       │
         └───────────┬───────────┘
                     │
                     │ SQL
                     │
         ┌───────────▼───────────┐
         │                       │
         │   BASE DE DONNÉES     │
         │   (PostgreSQL)         │
         │   Supabase             │
         │                       │
         └───────────────────────┘
```

---

## 📍 OÙ EST DÉPLOYÉ CHAQUE PARTIE ?

### 🎨 Frontend
- **Plateforme** : Vercel
- **URL** : https://www.luneo.app
- **Technologie** : Next.js (React)
- **Rôle** : Interface utilisateur

### ⚙️ Backend
- **Plateforme** : Railway
- **URL** : https://backend-production-9178.up.railway.app
- **Technologie** : NestJS (Node.js)
- **Rôle** : API et logique métier

### 🗄️ Base de Données
- **Plateforme** : Supabase
- **Type** : PostgreSQL
- **Rôle** : Stockage des données

---

## 🔄 FLUX DE DONNÉES

### Exemple : Voir mes produits

```
1. Utilisateur → Frontend
   "Je veux voir mes produits"
   
2. Frontend → Backend
   GET /api/products
   Headers: Authorization: Bearer token123
   
3. Backend → Base de Données
   SELECT * FROM products WHERE user_id = 'user123'
   
4. Base de Données → Backend
   [{id: 1, name: "T-shirt", ...}, ...]
   
5. Backend → Frontend
   {products: [{id: 1, name: "T-shirt", ...}, ...]}
   
6. Frontend → Utilisateur
   Affiche la liste des produits
```

---

## 🎯 RÉPARTITION DES TÂCHES

### Frontend gère :
- ✅ Affichage
- ✅ Interactions utilisateur
- ✅ Validation côté client
- ✅ Navigation
- ✅ État local

### Backend gère :
- ✅ Sécurité
- ✅ Validation serveur
- ✅ Logique métier
- ✅ Base de données
- ✅ Intégrations externes

---

**Cette architecture garantit :**
- ✅ Sécurité (backend protège les données)
- ✅ Performance (frontend rapide)
- ✅ Scalabilité (peut gérer beaucoup d'utilisateurs)
- ✅ Maintenabilité (code organisé)
