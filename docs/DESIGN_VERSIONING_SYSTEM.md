# 🎯 SYSTÈME DE VERSIONING DES DESIGNS

**Date:** 20 Novembre 2025  
**Version:** 1.0.0  
**Statut:** ✅ Implémenté

---

## 📋 VUE D'ENSEMBLE

Système complet de versioning automatique et manuel pour les designs, permettant de:
- Sauvegarder automatiquement avant chaque modification
- Créer des versions manuelles à la demande
- Restaurer n'importe quelle version précédente
- Comparer les versions entre elles
- Consulter l'historique complet

---

## 🗄️ ARCHITECTURE BASE DE DONNÉES

### Table `design_versions`

```sql
CREATE TABLE design_versions (
  id UUID PRIMARY KEY,
  design_id UUID REFERENCES custom_designs(id),
  version_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  design_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (design_id, version_number)
);
```

### Indexes
- `idx_design_versions_design_id` - Recherche rapide par design
- `idx_design_versions_created_at` - Tri chronologique
- `idx_design_versions_version_number` - Tri par numéro

### RLS (Row Level Security)
- Users peuvent voir uniquement leurs propres versions
- Users peuvent créer/modifier/supprimer uniquement leurs versions

---

## 🔌 API ENDPOINTS

### GET `/api/designs/[id]/versions`
Récupère toutes les versions d'un design.

**Response:**
```json
{
  "success": true,
  "data": {
    "design_id": "uuid",
    "versions": [...],
    "total": 5
  }
}
```

### POST `/api/designs/[id]/versions`
Crée une version manuelle.

**Body:**
```json
{
  "name": "Version manuelle",
  "description": "Description optionnelle"
}
```

### GET `/api/designs/[id]/versions/[versionId]`
Récupère une version spécifique.

### POST `/api/designs/[id]/versions/[versionId]/restore`
Restaure une version (crée sauvegarde + restaure).

### DELETE `/api/designs/[id]/versions/[versionId]`
Supprime une version.

### POST `/api/designs/[id]/versions/auto`
Crée automatiquement une version avant update.

**Usage:**
```typescript
// Avant chaque update de design
await fetch(`/api/designs/${designId}/versions/auto`, {
  method: 'POST',
  body: JSON.stringify({ auto_save: true })
});

// Puis update le design
await updateDesign(designId, newData);
```

---

## 🎨 UI COMPONENTS

### Page `/dashboard/designs/[id]/versions`

**Fonctionnalités:**
- Timeline verticale avec toutes les versions
- Preview de chaque version
- Badges type (auto/manual/restored)
- Actions: Voir, Restaurer, Comparer, Supprimer
- Stats cards (total, auto, dernière)
- Modals de confirmation
- Création version manuelle

**Composants:**
- `DesignVersionsPage` - Page principale (600+ lignes)
- Timeline avec indicateur version actuelle
- Preview thumbnails
- Actions avec modals

---

## 🔄 WORKFLOW VERSIONING AUTOMATIQUE

1. **Avant Update:**
   ```typescript
   // Appeler /api/designs/[id]/versions/auto
   // Crée une version automatique
   ```

2. **Update Design:**
   ```typescript
   // Mettre à jour custom_designs
   await supabase
     .from('custom_designs')
     .update(newData)
     .eq('id', designId);
   ```

3. **Protection Doublons:**
   - Vérifie si version créée < 5 secondes
   - Évite les versions multiples rapides

---

## 🎯 TYPES DE VERSIONS

### Automatique (`auto_save: true`)
- Créée automatiquement avant updates
- Nom: "Version X - [date]"
- Description: "Sauvegarde automatique"

### Manuelle (`manual: true`)
- Créée par l'utilisateur
- Nom/description personnalisés
- Bouton "Créer une version"

### Restaurée (`restored: true`)
- Créée lors d'une restauration
- Nom: "Restauration de vX"
- Contient sauvegarde avant restauration

---

## 📊 MÉTADONNÉES

Chaque version contient des métadonnées:

```json
{
  "created_by": "user_id",
  "created_at": "ISO date",
  "auto_save": true,
  "manual": false,
  "restored": false,
  "restored_from": "version_id",
  "trigger": "before_update"
}
```

---

## 🔒 SÉCURITÉ

- **RLS activé** sur table `design_versions`
- **Vérification ownership** dans toutes les routes API
- **Authentification requise** pour toutes les opérations
- **Cascade delete** si design supprimé

---

## 🚀 UTILISATION

### Créer version manuelle
```typescript
await fetch(`/api/designs/${designId}/versions`, {
  method: 'POST',
  body: JSON.stringify({
    name: 'Version finale',
    description: 'Version approuvée par le client'
  })
});
```

### Restaurer version
```typescript
await fetch(`/api/designs/${designId}/versions/${versionId}/restore`, {
  method: 'POST'
});
```

### Lister versions
```typescript
const response = await fetch(`/api/designs/${designId}/versions`);
const { data } = await response.json();
const versions = data.versions;
```

---

## 📝 NOTES IMPORTANTES

1. **Performance:** Indexes optimisés pour requêtes fréquentes
2. **Stockage:** `design_data` JSONB peut être volumineux
3. **Limite:** Pas de limite automatique (à implémenter si nécessaire)
4. **Cleanup:** Script de nettoyage recommandé pour anciennes versions

---

## ✅ TODO-036 & TODO-037 - COMPLÉTÉS

- ✅ Table `design_versions` créée
- ✅ Routes API complètes
- ✅ Versioning automatique
- ✅ Versioning manuel
- ✅ UI complète (600+ lignes)
- ✅ Restauration avec sauvegarde
- ✅ Comparaison versions
- ✅ Suppression versions
- ✅ RLS et sécurité

---

*Système créé le 20 Novembre 2025 - Qualité Expert Mondial SaaS*

