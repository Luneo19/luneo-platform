# 📄 DOCUMENTATION: PAGE PRICING

**Fichier:** `apps/frontend/src/app/(public)/pricing/page.tsx`  
**Créé:** 29 Octobre 2025  
**Dernière modification:** 29 Octobre 2025

---

## 🎯 OBJECTIF DE CETTE PAGE

Afficher les plans tarifaires de Luneo avec:
- 4 plans: Starter (gratuit), Professional, Business, Enterprise
- Toggle mensuel/annuel avec réduction de 20%
- Comparaison détaillée des fonctionnalités
- Témoignages clients
- FAQ
- Tableau de comparaison complète

---

## 🏗️ STRUCTURE DE LA PAGE

### 1. **Hero Section** (Ligne 169-194)
- Titre accrocheur
- Proposition de valeur
- Background avec formes géométriques (blur effects)

### 2. **Section Plans** (Ligne 197-352)
- Toggle mensuel/annuel (ligne 201-220)
- 4 cartes de plans (ligne 223-350)
  - Starter: Gratuit, redirect `/register`
  - Professional: €29/mois, appel API Stripe
  - Business: €59/mois, appel API Stripe
  - Enterprise: €99/mois, redirect `/contact`

### 3. **Tableau de Comparaison** (Ligne 354-516)
- Table HTML avec toutes les fonctionnalités
- Comparaison des 4 plans
- Checkmarks pour features incluses

### 4. **Section Témoignages** (Ligne 518-570)
- 3 témoignages clients
- Bulle verte avec icône MessageCircle
- Cards avec avatars et ratings

### 5. **Section FAQ** (Ligne 572-629)
- 6 questions/réponses
- Animation accordeon avec AnimatePresence
- ChevronDown rotatif

### 6. **Section Trusted By** (Ligne 631-651)
- Logos entreprises (simulés)
- Fond gris foncé

---

## 🔧 TECHNIQUES UTILISÉES

### Composants UI
```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
```

### Animations (Framer Motion)
```typescript
import { motion, AnimatePresence } from 'framer-motion';

// Exemple pour une carte
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, delay: index * 0.1 }}
>
```

### Icons (Lucide React)
```typescript
import { Check, ChevronDown, MessageCircle, Star, Users, Zap, Shield, Globe, Clock, Palette } from 'lucide-react';
```

---

## 💳 INTÉGRATION STRIPE

### Code du Bouton (Ligne 290-336)

**Pour les plans payants (Professional, Business):**

```typescript
const response = await fetch('https://api.luneo.app/api/billing/create-checkout-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    planId: plan.name.toLowerCase(),
    email: 'user@example.com'
  }),
});
```

**Problème potentiel:** Email en dur 'user@example.com'

**Solution:** Récupérer l'email de l'utilisateur connecté via Supabase Auth

---

## 🎨 DESIGN

### Couleurs
- Fond: `bg-gray-900` (principal)
- Cartes: `bg-gray-800`, `bg-gray-700`
- Texte: `text-white`, `text-gray-300`, `text-gray-400`
- Accents: `bg-blue-500`, `bg-purple-500`
- Success: `text-green-400`

### Background Effects
```typescript
<div className="absolute inset-0">
  <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
  <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
</div>
```

---

## 📊 DONNÉES STATIQUES

### Plans (Ligne 10-107)
- 4 plans avec features détaillées
- Prix, période, description, features (included/not included)
- CTA et href

### FAQ (Ligne 109-134)
- 6 questions/réponses sur billing, limites, essai gratuit, API

### Témoignages (Ligne 136-158)
- 3 témoignages avec noms, roles, avatars, quotes, ratings

---

## 🐛 PROBLÈMES CONNUS ET SOLUTIONS

### 1. Email en dur pour Stripe
**Problème:** Ligne 298 `email: 'user@example.com'`  
**Solution:** Récupérer l'email de Supabase Auth

```typescript
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
const email = user?.email || 'user@example.com';
```

### 2. URL API Stripe en dur
**Problème:** Ligne 291 `https://api.luneo.app/api/billing/create-checkout-session`  
**Solution:** Utiliser variable d'environnement

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const response = await fetch(`${API_URL}/billing/create-checkout-session`, {
```

### 3. Gestion d'erreurs API
**Le code gère déjà:**
- HTTP errors (ligne 302-304)
- Format réponse invalide (ligne 322-323)
- Messages d'erreur spécifiques (ligne 325-330)
- Fallback vers contact (ligne 326-328)

---

## 🔄 MÉTODES DE RÉFÉRENCE (Comment modifier)

### Changer les Prix

**Fichier:** `apps/frontend/src/app/(public)/pricing/page.tsx`  
**Localisation:** Ligne 10-107 (const plans)

```typescript
{
  name: 'Professional',
  price: 29,  // ← MODIFIER ICI
  period: '/mois',
  // ...
}
```

### Ajouter une Feature

**Même section, dans le tableau features:**

```typescript
features: [
  { name: 'Nouvelle feature', included: true },  // ← AJOUTER ICI
]
```

### Modifier le Toggle Billing

**Ligne 201-220**

```typescript
<button
  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
    billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-600'
  }`}
>
```

---

## ✅ CHECKLIST POUR MODIFICATIONS FUTURES

- [ ] Tester le toggle mensuel/annuel
- [ ] Vérifier les prix (et les calculs d'économie)
- [ ] Tester les CTAs (boutons)
- [ ] Vérifier les redirects (/register, /contact)
- [ ] Tester l'appel API Stripe (si configuré)
- [ ] Vérifier les animations
- [ ] Tester FAQ accordeon
- [ ] Vérifier responsive design
- [ ] Tester les couleurs et contrastes

---

## 📝 NOTES IMPORTANTES

1. **Pas de layout wrapper:** La page n'inclut pas de `<UnifiedNav>` ni `<Footer>` car ils sont dans le layout parent `(public)/layout.tsx`

2. **Client Component:** 'use client' en haut - les interactions (toggles, accordeons) nécessitent client-side

3. **Animations:** Framer Motion pour les entrées en page et accordeons

4. **Responsive:** Classes Tailwind `md:`, `lg:` pour adaptation mobile

---

**Cette documentation vous permet de comprendre et modifier la page pricing sans tout refaire!** 🎯

*Dernière mise à jour: 29 Oct 2025*

