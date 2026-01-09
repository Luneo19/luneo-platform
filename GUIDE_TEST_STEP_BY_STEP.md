# 🧪 GUIDE DE TEST ÉTAPE PAR ÉTAPE - NOUVELLE HOMEPAGE

**Date** : Janvier 2025

---

## 🎯 OBJECTIF

Tester la nouvelle homepage moderne avec animations style Pandawa/Gladia avant de remplacer l'ancienne version.

---

## 📋 ÉTAPE 1 : VÉRIFICATIONS PRÉLIMINAIRES

### 1.1 Vérifier que tout est en place

```bash
cd /Users/emmanuelabougadous/luneo-platform

# Vérifier que les composants existent
ls -la apps/frontend/src/components/animations/
ls -la apps/frontend/src/components/marketing/home/

# Vérifier que la nouvelle page existe
ls -la apps/frontend/src/app/\(public\)/page-new.tsx
```

**Résultat attendu** : Tous les fichiers listés ✅

---

## 🚀 ÉTAPE 2 : DÉMARRER LES SERVEURS

### 2.1 Terminal 1 - Backend

```bash
cd apps/backend
npm run start:dev
```

**Attendre** : `🚀 Application is running on: http://localhost:3001`

### 2.2 Terminal 2 - Frontend

```bash
cd apps/frontend
npm run dev
```

**Attendre** : `✓ Ready in Xs` avec URL `http://localhost:3000`

---

## 🧪 ÉTAPE 3 : CRÉER UNE ROUTE DE TEST (Recommandé)

Cette méthode permet de tester sans modifier l'ancienne version.

```bash
cd apps/frontend/src/app

# Créer dossier test
mkdir -p test-homepage

# Copier la nouvelle page
cp \(public\)/page-new.tsx test-homepage/page.tsx
```

**Accéder à** : **http://localhost:3000/test-homepage**

---

## ✅ ÉTAPE 4 : VALIDATION VISUELLE

### 4.1 Vérifier le chargement

- [ ] Page charge sans erreur 404
- [ ] Pas d'erreurs dans la console (F12)
- [ ] Pas de warnings React

### 4.2 Vérifier Hero Section (Section 1)

- [ ] **Gradient background animé** visible en arrière-plan
- [ ] **Badge "Plateforme IA"** visible en haut
- [ ] **Titre principal** avec animation text-reveal visible
- [ ] **Sous-titre** visible
- [ ] **Bouton "Commencer gratuitement"** visible et cliquable
- [ ] **Bouton "Voir la démo"** visible et cliquable
- [ ] **Trust badges** visibles (10K+ users, 99.9% uptime, etc.)
- [ ] **Zone mockup/illustration** visible (placeholder pour l'instant)

**Action** : Scroller vers le bas pour voir les autres sections

---

### 4.3 Vérifier Integrations Section (Section 2)

- [ ] **Titre "Intégrations"** visible
- [ ] **Logos des intégrations** visibles (Shopify, WooCommerce, etc.)
- [ ] Animation scroll (si visible)

---

### 4.4 Vérifier Features Section (Section 3)

- [ ] **Titre "Tout ce dont vous avez besoin"** visible
- [ ] **6 cards de fonctionnalités** visibles :
  - Génération IA
  - Éditeur 2D/3D
  - Virtual Try-On AR
  - Traitement Ultra-Rapide
  - Sécurité Enterprise
  - Intégrations Multi-Platesformes
- [ ] **Icônes colorées** visibles sur chaque card
- [ ] **Hover effect** : Passer la souris sur une card → elle s'agrandit légèrement
- [ ] **Lien "Découvrir toutes les fonctionnalités"** visible en bas

---

### 4.5 Vérifier How It Works (Section 4)

- [ ] **Titre "Comment ça marche"** visible
- [ ] **3 étapes** visibles :
  - Étape 1 : "Uploadez ou Créez"
  - Étape 2 : "Personnalisez"
  - Étape 3 : "Exportez & Vendez"
- [ ] **Numéros de step** visibles (1, 2, 3) avec gradient
- [ ] **Icônes** visibles
- [ ] **Lignes de connexion** visibles (sur desktop uniquement)

---

### 4.6 Vérifier Stats Section (Section 5)

- [ ] **4 statistiques** visibles :
  - 10,000+ Créateurs actifs
  - 500M+ Designs générés
  - 3.2s Temps moyen génération
  - 150+ Pays
- [ ] **Icônes colorées** visibles
- [ ] **Nombres en grand** avec gradient

---

### 4.7 Vérifier Testimonials (Section 6)

- [ ] **Titre "Ils nous font confiance"** visible
- [ ] **3 témoignages** visibles avec :
  - Métrique en badge (+500%, 100%, -80%)
  - Citation entre guillemets
  - Nom de l'auteur
  - Rôle et entreprise

---

### 4.8 Vérifier Pricing Preview (Section 7)

- [ ] **Titre "Des tarifs adaptés à vos besoins"** visible
- [ ] **3 plans tarifaires** visibles :
  - Starter (29€/mois)
  - Pro (99€/mois) avec badge "Populaire"
  - Enterprise (Custom)
- [ ] **Liste de features** visible pour chaque plan
- [ ] **Boutons CTA** visibles et cliquables
- [ ] **Lien "Voir tous les tarifs"** visible

---

### 4.9 Vérifier FAQ Section (Section 8)

- [ ] **Titre "Questions fréquentes"** visible
- [ ] **6 questions** visibles :
  - Comment fonctionne la génération IA ?
  - Puis-je exporter en qualité print-ready ?
  - Quelles intégrations sont disponibles ?
  - Y a-t-il une période d'essai ?
  - Puis-je annuler à tout moment ?
  - Quel support est disponible ?
- [ ] **Cliquer sur une question** → Réponse s'affiche en accordion
- [ ] **Animation smooth** lors de l'ouverture/fermeture

---

### 4.10 Vérifier CTA Final (Section 9)

- [ ] **Gradient background animé** visible
- [ ] **Titre "Prêt à transformer vos produits ?"** visible
- [ ] **Description** visible
- [ ] **2 boutons CTA** :
  - "Démarrer gratuitement"
  - "Voir les tarifs"
- [ ] **Trust indicators** visibles (✓ Essai gratuit, etc.)

---

## 🔗 ÉTAPE 5 : TESTER TOUS LES LIENS

### 5.1 Liens Hero Section

- [ ] **"Commencer gratuitement"** → Devrait rediriger vers `/register`
- [ ] **"Voir la démo"** → Devrait rediriger vers `/demo`

### 5.2 Liens Features Section

- [ ] **"Découvrir toutes les fonctionnalités"** → Devrait rediriger vers `/features`

### 5.3 Liens Pricing Preview

- [ ] **"Voir tous les tarifs"** → Devrait rediriger vers `/pricing`
- [ ] **Boutons plans** :
  - Starter & Pro → Devrait rediriger vers `/register`
  - Enterprise → Devrait rediriger vers `/contact`

### 5.4 Liens CTA Final

- [ ] **"Démarrer gratuitement"** → Devrait rediriger vers `/register`
- [ ] **"Voir les tarifs"** → Devrait rediriger vers `/pricing`

---

## 🎨 ÉTAPE 6 : TESTER LES ANIMATIONS

### 6.1 Animations au Scroll

- [ ] **Fade-in** : Scroller lentement → Chaque section apparaît avec fade-in
- [ ] **Slide-up** : Scroller → Sections glissent vers le haut
- [ ] **Stagger** : Dans Features → Cards apparaissent une par une
- [ ] **Text Reveal** : Dans Hero → Texte apparaît mot par mot

### 6.2 Animations au Hover

- [ ] **Magnetic Button** : 
  - Passer la souris sur "Commencer gratuitement"
  - Le bouton devrait suivre légèrement le curseur
- [ ] **Card Hover** :
  - Passer la souris sur les cards Features
  - Les cards devraient s'agrandir légèrement (scale)

### 6.3 Animations Continues

- [ ] **Gradient Background** :
  - Les blobs colorés dans Hero et CTA Final devraient bouger lentement
- [ ] **Floating Elements** :
  - Le mockup dans Hero devrait flotter doucement

---

## 📱 ÉTAPE 7 : TESTER LE RESPONSIVE

### 7.1 Mobile (< 768px)

**Ouvrir DevTools** (F12) → Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)

- [ ] **Hero** : Titre adapté, boutons empilés verticalement
- [ ] **Features** : 1 colonne
- [ ] **How It Works** : 1 colonne, pas de lignes de connexion
- [ ] **Stats** : 2 colonnes (2x2)
- [ ] **Testimonials** : 1 colonne
- [ ] **Pricing** : 1 colonne
- [ ] **Pas de débordement horizontal**

### 7.2 Tablette (768px - 1024px)

- [ ] **Features** : 2 colonnes
- [ ] **How It Works** : 3 colonnes
- [ ] **Testimonials** : 3 colonnes
- [ ] **Pricing** : 3 colonnes (peut-être serré)

### 7.3 Desktop (> 1024px)

- [ ] **Tout en 3 colonnes** où approprié
- [ ] **Espacements généreux**
- [ ] **Lignes de connexion** visibles dans How It Works

---

## 🐛 ÉTAPE 8 : VÉRIFIER LA CONSOLE

### 8.1 Ouvrir la Console (F12)

**Vérifier** :
- [ ] **Pas d'erreurs rouges**
- [ ] **Pas de warnings critiques** (jaunes OK pour dev)
- [ ] **Pas d'erreurs 404** pour les ressources

**Si erreurs** :
- Noter le message d'erreur
- Vérifier les imports dans les composants

---

## ⚡ ÉTAPE 9 : TESTER LES PERFORMANCES

### 9.1 Performance Basique

- [ ] **Page charge rapidement** (< 3 secondes)
- [ ] **Animations fluides** (pas de lag)
- [ ] **Scroll smooth** (60fps)

### 9.2 Lighthouse (Optionnel)

```bash
# Ouvrir Chrome DevTools
# Onglet "Lighthouse"
# Lancer audit
```

**Objectifs** :
- Performance : > 80
- Accessibility : > 90
- Best Practices : > 90
- SEO : > 90

---

## ✅ ÉTAPE 10 : COMPARER AVEC ANCIENNE VERSION

### 10.1 Ouvrir les deux versions

1. **Ancienne** : http://localhost:3000/ (si pas remplacée)
2. **Nouvelle** : http://localhost:3000/test-homepage

### 10.2 Comparaison

| Élément | Ancienne | Nouvelle |
|---------|----------|----------|
| Style | ❓ | ✅ Moderne |
| Animations | ❓ | ✅ Complètes |
| Organisation | ❓ | ✅ Modulaire |
| Performance | ❓ | ✅ Optimisée |

---

## 🔄 ÉTAPE 11 : REMPLACER DÉFINITIVEMENT (Si tout OK)

### ⚠️ ATTENTION : Faire ceci UNIQUEMENT si tout est validé

```bash
cd apps/frontend/src/app/\(public\)

# 1. Backup final de l'ancienne
cp page.tsx page-old-final-backup.tsx

# 2. Remplacer
cp page-new.tsx page.tsx

# 3. Vérifier que ça fonctionne
# Accéder à http://localhost:3000/
```

---

## 📝 ÉTAPE 12 : NOTES ET RETOURS

### Notes à prendre pendant le test

```
✅ Points forts :
- 

✅ Points à améliorer :
- 

🐛 Bugs trouvés :
- 

💡 Suggestions :
- 
```

---

## 🎯 CHECKLIST FINALE

### Validation Complète

- [ ] ✅ Toutes les sections visibles
- [ ] ✅ Toutes les animations fonctionnent
- [ ] ✅ Tous les liens fonctionnent
- [ ] ✅ Responsive OK (mobile/tablette/desktop)
- [ ] ✅ Pas d'erreurs console
- [ ] ✅ Performance acceptable
- [ ] ✅ Contenu correct

**Si toutes les cases sont cochées** → ✅ Prêt pour production !

---

**Guide créé le : Janvier 2025**
