# 📋 **SCRIPTS SQL À EXÉCUTER - FEATURES CRITIQUES**

---

## ⚠️ **IMPORTANT : EXÉCUTER DANS CET ORDRE**

Tu dois exécuter **2 scripts SQL** dans Supabase Dashboard pour activer les nouvelles features.

---

## 🔗 **ACCÈS SUPABASE**

1. Va sur : https://supabase.com/dashboard/project/obrijgptqztacolemsbk
2. Clique sur **SQL Editor** (dans le menu gauche)
3. Clique sur **New query**

---

## 📁 **SCRIPT 1 : COLLECTIONS DESIGNS** (à exécuter en PREMIER)

**Fichier** : `supabase-design-collections.sql`

**Ce qu'il fait** :
- ✅ Crée la table `design_collections`
- ✅ Crée la table `design_collection_items`
- ✅ Ajoute les RLS policies
- ✅ Crée les triggers (compteurs, updated_at)
- ✅ Crée les fonctions helper
- ✅ Ajoute les indexes de performance

**Instructions** :
1. Copie TOUT le contenu de `supabase-design-collections.sql`
2. Colle-le dans Supabase SQL Editor
3. Clique sur **Run** (en bas à droite)
4. Attends le message de succès ✅

**Temps d'exécution** : ~5 secondes

---

## 🔗 **SCRIPT 2 : PARTAGE PUBLIC** (à exécuter en SECOND)

**Fichier** : `supabase-design-sharing.sql`

**Ce qu'il fait** :
- ✅ Crée la table `design_shares` (liens publics avec tokens)
- ✅ Crée la table `share_analytics` (analytics des partages)
- ✅ Ajoute les RLS policies (partages publics accessibles sans auth)
- ✅ Crée les triggers (compteurs, expiration)
- ✅ Crée la fonction `generate_share_token()` (tokens uniques)
- ✅ Crée la fonction `cleanup_expired_shares()` (nettoyage auto)
- ✅ Ajoute les indexes de performance

**Instructions** :
1. Copie TOUT le contenu de `supabase-design-sharing.sql`
2. Colle-le dans Supabase SQL Editor (nouvelle query)
3. Clique sur **Run**
4. Attends le message de succès ✅

**Temps d'exécution** : ~5 secondes

---

## ✅ **VÉRIFICATION**

Après avoir exécuté les 2 scripts, vérifie dans Supabase :

1. **Table Editor** → Tu dois voir :
   - `design_collections` ✅
   - `design_collection_items` ✅
   - `design_shares` ✅
   - `share_analytics` ✅

2. **Database** → Functions → Tu dois voir :
   - `generate_share_token()` ✅
   - `cleanup_expired_shares()` ✅
   - `get_design_collections()` ✅
   - `get_collection_designs()` ✅

---

## 🎯 **CE QUE ÇA ACTIVE**

### **Collections** :
- Créer des collections de designs (ex: "Collection Été 2025")
- Organiser les designs par thème/client
- Partager des collections complètes
- Statistiques par collection

### **Partage public** :
- Générer des liens publics pour designs (ex: `app.luneo.app/share/abc123xyz`)
- Protection par mot de passe (optionnelle)
- Expiration automatique (optionnelle)
- Analytics détaillées (vues, downloads, AR launches)
- Branding personnalisable

---

## 🚀 **APRÈS L'EXÉCUTION**

Une fois les 2 scripts exécutés, tout sera **automatiquement opérationnel** :

- ✅ API routes `/api/collections/*` fonctionnelles
- ✅ API routes `/api/designs/[id]/share` fonctionnelles
- ✅ Page publique `/share/[token]` accessible
- ✅ Hooks React `useCollections` prêts
- ✅ Analytics temps réel activées

---

## 💡 **EXEMPLES D'UTILISATION**

### **Créer une collection** :
```typescript
const collection = await createCollection({
  name: "Collection Louis Vuitton Été 2025",
  description: "Designs exclusifs pour la collection printemps-été",
  color: "#8B4513", // Marron LV
  is_public: false,
  tags: ["luxe", "été", "2025"]
});
```

### **Partager un design** :
```typescript
const share = await fetch('/api/designs/abc123/share', {
  method: 'POST',
  body: JSON.stringify({
    title: "Design exclusif LV",
    allow_download: true,
    allow_ar_view: true,
    expires_in_days: 7,
    requires_password: true,
    password: "LV2025"
  })
});

// Lien généré : https://app.luneo.app/share/xyz789abc
```

---

## ⚡ **EXÉCUTE CES 2 SCRIPTS MAINTENANT !**

**Durée totale** : ~1 minute  
**Résultat** : Plateforme **110/100** 🏆

---

**🌟 ENSUITE ON DÉPLOIE ET C'EST PARFAIT ! 🌟**

