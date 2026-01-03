# HeroBanner - Composant Bannière Hero Premium

Un composant de bannière hero moderne et premium avec animations subtiles, conçu pour créer une première impression élégante et futuriste.

## ✨ Caractéristiques

- **Image de fond optimisée** : Utilise Next.js Image pour des performances optimales
- **Animations subtiles** : Halos lumineux, particules fines et éléments UI flottants avec animations réduites de 50%
- **Style premium** : Design futuriste, IA, luxe et minimal
- **Performance-friendly** : CSS pur, pas de canvas lourd
- **Responsive** : S'adapte parfaitement à tous les écrans
- **Accessible** : Support de `prefers-reduced-motion`

## 📦 Installation

Le composant est déjà disponible dans `src/components/HeroBanner.tsx`. Aucune installation supplémentaire n'est requise.

## 🚀 Utilisation

### Import

```tsx
import { HeroBanner } from '@/components/HeroBanner';
```

### Exemple basique

```tsx
<HeroBanner
  backgroundImage="/images/hero-background.jpg"
  alt="Hero background image"
/>
```

### Avec titre et sous-titre

```tsx
<HeroBanner
  backgroundImage="/images/hero-background.jpg"
  title="L'Auteure de Personnalisation 3D"
  subtitle="De Idée, à Réalité Augmentée par IA."
  alt="Hero background image"
/>
```

### Avec contenu personnalisé

```tsx
<HeroBanner
  backgroundImage="/images/hero-background.jpg"
  title="Votre Titre"
  subtitle="Votre sous-titre"
  alt="Hero background image"
>
  <Button>Action principale</Button>
  <Button variant="outline">Action secondaire</Button>
</HeroBanner>
```

## 📋 Props

| Prop | Type | Requis | Description |
|------|------|--------|-------------|
| `backgroundImage` | `string` | ✅ | URL ou chemin de l'image de fond |
| `title` | `string` | ❌ | Titre principal affiché au centre |
| `subtitle` | `string` | ❌ | Sous-titre affiché sous le titre |
| `children` | `React.ReactNode` | ❌ | Contenu personnalisé (boutons, etc.) |
| `alt` | `string` | ❌ | Texte alternatif pour l'image (par défaut: "Hero background") |

## 🎨 Personnalisation

### Modifier les couleurs

Les couleurs peuvent être modifiées dans `HeroBanner.module.css` :

- **Halos** : Modifier `rgba(59, 130, 246, ...)` pour changer la couleur des halos (bleu par défaut)
- **Particules** : Modifier `rgba(255, 255, 255, ...)` pour changer la couleur des particules
- **Overlay** : Modifier le gradient dans `.overlay` pour ajuster l'overlay

### Ajuster les animations

Les animations sont définies dans `HeroBanner.module.css` :

- **Durée** : Modifier les valeurs dans `@keyframes` (actuellement 12s, 20s, 25s)
- **Intensité** : Modifier les valeurs d'`opacity` et de `transform` dans les animations
- **Désactiver** : Les animations sont automatiquement désactivées si l'utilisateur préfère `prefers-reduced-motion`

### Nombre d'éléments décoratifs

Dans `HeroBanner.tsx`, vous pouvez modifier :

- **Particules** : `Array.from({ length: 12 }, ...)` - changer `12` pour plus/moins de particules
- **Halos** : Ajouter/supprimer des objets dans le tableau `halos`
- **Éléments UI** : Ajouter/supprimer des objets dans le tableau `floatingElements`

## 🎯 Intégration dans la page d'accueil

Pour remplacer la section hero actuelle dans `page.tsx` :

```tsx
import { HeroBanner } from '@/components/HeroBanner';

// Dans votre composant
<HeroBanner
  backgroundImage="/images/hero-background.jpg"
  title="L'Auteure de Personnalisation 3D"
  subtitle="De Idée, à Réalité Augmentée par IA."
  alt="Hero background image"
>
  {/* Vos boutons CTA ici */}
</HeroBanner>
```

## 📱 Responsive

Le composant est entièrement responsive :

- **Desktop** : Full-height avec tous les éléments décoratifs
- **Tablet** : Ajustements automatiques des tailles
- **Mobile** : Halos et éléments UI réduits pour de meilleures performances

## ♿ Accessibilité

- Support de `prefers-reduced-motion` : Les animations sont désactivées si l'utilisateur préfère moins de mouvement
- Texte alternatif pour l'image de fond
- Contraste suffisant pour la lisibilité du texte

## 🎨 Style

Le composant utilise un style futuriste et premium :

- **Couleurs** : Bleu, blanc, argent avec des effets de glow subtils
- **Typographie** : Claire et moderne avec des tailles responsives
- **Effets** : Halos lumineux, particules fines, éléments UI flottants
- **Animations** : Lentes, élégantes, presque imperceptibles (effet "respiration")

## 🔧 Maintenance

- **Performance** : Utilise `useMemo` pour éviter les recalculs inutiles
- **CSS Modules** : Styles isolés pour éviter les conflits
- **TypeScript** : Entièrement typé pour une meilleure expérience de développement

## 📝 Notes

- L'image de fond doit être de haute qualité pour un rendu optimal
- Les animations sont optimisées pour les performances (CSS pur, pas de JavaScript lourd)
- Le composant est prêt à accueillir votre image dès que vous l'uploadez









