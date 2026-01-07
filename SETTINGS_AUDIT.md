# 🔍 AUDIT SETTINGS - Analyse et Recommandations

## 📊 État Actuel

- **Taille** : 1558 lignes (violation Bible Luneo - limite 500)
- **Type** : Client Component monolithique
- **Problème** : Trop de fonctionnalités, beaucoup d'imports inutiles

---

## ✅ À GARDER (Fonctionnalités Essentielles)

### 1. Profile Settings (~200 lignes)
- ✅ Nom, Email (lecture seule)
- ✅ Téléphone, Entreprise, Site web
- ✅ Bio, Localisation
- ✅ Avatar upload
- ✅ Timezone

**Backend** : `trpc.profile.get` et `trpc.profile.update` existent ✅

### 2. Security Settings (~150 lignes)
- ✅ Changement de mot de passe
- ✅ 2FA (optionnel mais utile)
- ✅ Sessions actives (liste et révocation)
- ✅ Suppression de compte (RGPD)

**Backend** : `trpc.profile.changePassword` existe ✅

### 3. Notifications Settings (~100 lignes)
- ✅ Préférences email
- ✅ Préférences push (si disponible)
- ✅ Préférences in-app
- ✅ Catégories de notifications

**Backend** : `trpc.profile.getNotificationPreferences` existe ✅

### 4. Preferences (~80 lignes)
- ✅ Thème (light/dark/system)
- ✅ Langue
- ✅ Timezone

**Backend** : Stocké dans le profil ✅

---

## ❌ À SUPPRIMER (Fonctionnalités Non Essentielles)

### 1. API Keys Management (~200 lignes)
- ❌ Création de clés API
- ❌ Rotation de clés
- ❌ Révocation de clés
- ❌ Permissions granulaires

**Raison** : Pas critique pour MVP, peut être ajouté plus tard si nécessaire

### 2. Webhooks Management (~200 lignes)
- ❌ Création de webhooks
- ❌ Configuration d'événements
- ❌ Logs de webhooks
- ❌ Retry de webhooks

**Raison** : Fonctionnalité avancée, pas nécessaire pour MVP

### 3. Imports Inutiles (~300 lignes)
- ❌ Des centaines d'icônes Lucide non utilisées
- ❌ Composants UI non utilisés

---

## ➕ À AJOUTER (Fonctionnalités Manquantes)

### 1. Avatar Upload (~50 lignes)
- ➕ Upload d'avatar
- ➕ Prévisualisation
- ➕ Crop/Resize (optionnel)

**Backend** : Vérifier si disponible

### 2. Export de Données (~50 lignes)
- ➕ Export RGPD (toutes les données utilisateur)
- ➕ Format JSON

**Backend** : À créer si nécessaire

---

## 📐 Architecture Recommandée

### Structure Modulaire

```
settings/
├── page.tsx (Server Component - 50 lignes)
├── SettingsPageClient.tsx (Client Component - 200 lignes)
├── loading.tsx (15 lignes)
├── error.tsx (30 lignes)
├── components/
│   ├── SettingsHeader.tsx (50 lignes)
│   ├── ProfileTab.tsx (200 lignes)
│   ├── SecurityTab.tsx (150 lignes)
│   ├── NotificationsTab.tsx (100 lignes)
│   ├── PreferencesTab.tsx (80 lignes)
│   └── modals/
│       ├── ChangePasswordModal.tsx (80 lignes)
│       ├── TwoFactorModal.tsx (100 lignes)
│       ├── DeleteAccountModal.tsx (80 lignes)
│       └── AvatarUploadModal.tsx (70 lignes)
├── hooks/
│   ├── useProfileSettings.ts (100 lignes)
│   ├── useSecuritySettings.ts (80 lignes)
│   └── useNotificationSettings.ts (60 lignes)
└── types/
    └── index.ts (50 lignes)
```

**Total estimé** : ~1200 lignes (vs 1558 actuellement)
**Réduction** : 23% de code en moins + structure modulaire

---

## 🎯 Plan d'Action

### Phase 1 : Nettoyage (1h)
1. Supprimer API Keys management
2. Supprimer Webhooks management
3. Nettoyer les imports inutiles
4. Garder uniquement les 4 onglets essentiels

### Phase 2 : Refactoring (2h)
1. Créer la structure modulaire
2. Extraire les composants par onglet
3. Créer les hooks personnalisés
4. Implémenter Server Component

### Phase 3 : Améliorations (1h)
1. Ajouter avatar upload
2. Ajouter export de données RGPD
3. Améliorer la validation

---

## ✅ Résultat Attendu

- **Taille finale** : ~1200 lignes (vs 1558)
- **Composants** : Tous < 300 lignes ✅
- **Fonctionnalités** : Essentielles uniquement
- **Performance** : Améliorée
- **Maintenabilité** : Améliorée

---

## 📝 Notes

- **Backend** : La plupart des endpoints existent déjà ✅
- **Priorité** : Garder uniquement ce qui est utile pour Luneo MVP
- **RGPD** : Export de données et suppression de compte sont obligatoires


