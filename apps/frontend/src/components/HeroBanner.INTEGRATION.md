# Intégration du HeroBanner dans la page d'accueil

## 📍 Fichiers créés

1. **`HeroBanner.tsx`** - Composant principal
2. **`HeroBanner.module.css`** - Styles avec animations subtiles
3. **`HeroBanner.example.tsx`** - Exemples d'utilisation
4. **`HeroBanner.README.md`** - Documentation complète

## 🚀 Intégration rapide

### Étape 1 : Uploader votre image

Placez votre image dans le dossier `public/images/` :
```bash
apps/frontend/public/images/hero-background.jpg
```

### Étape 2 : Importer et utiliser dans `page.tsx`

Dans `apps/frontend/src/app/(public)/page.tsx`, remplacez ou ajoutez la section hero :

```tsx
import { HeroBanner } from '@/components/HeroBanner';
import { Button } from '@/components/ui/button';

// Dans votre composant HomePageContent, remplacez la section hero existante :
<HeroBanner
  backgroundImage="/images/hero-background.jpg"
  title="L'Auteure de Personnalisation 3D"
  subtitle="De Idée, à Réalité Augmentée par IA."
  alt="Hero background - Personnalisation 3D avec IA"
>
  <div className="flex gap-4 justify-center mt-8 flex-wrap">
    <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
      Commencer maintenant
    </Button>
    <Button 
      size="lg" 
      variant="outline" 
      className="bg-white/10 border-white/30 text-white hover:bg-white/20"
    >
      En savoir plus
    </Button>
  </div>
</HeroBanner>
```

## 🎨 Personnalisation rapide

### Changer les couleurs des halos

Dans `HeroBanner.module.css`, ligne ~60 :
```css
/* Bleu actuel */
rgba(59, 130, 246, 0.08)

/* Pour un effet argent/platine */
rgba(192, 192, 192, 0.08)

/* Pour un effet cyan */
rgba(6, 182, 212, 0.08)
```

### Ajuster l'intensité des animations

Dans `HeroBanner.module.css`, modifier les valeurs d'opacité :

```css
/* Réduire encore plus (actuellement déjà réduit de 50%) */
@keyframes breatheHalo {
  0%, 100% {
    opacity: 0.08;  /* Au lieu de 0.15 */
    transform: scale(1);
  }
  50% {
    opacity: 0.12;  /* Au lieu de 0.25 */
    transform: scale(1.08);  /* Au lieu de 1.15 */
  }
}
```

### Modifier le nombre d'éléments

Dans `HeroBanner.tsx` :

```tsx
// Moins de particules (actuellement 12)
const particles = useMemo(
  () => Array.from({ length: 8 }, (_, i) => ({ ... })),
  []
);

// Plus de halos (actuellement 3)
const halos = useMemo(
  () => [
    // ... halos existants
    {
      id: 'halo-4',
      left: '30%',
      top: '45%',
      size: '160px',
      delay: '6s',
    },
  ],
  []
);
```

## ✅ Vérification

1. ✅ Composant créé avec TypeScript
2. ✅ CSS Modules configurés
3. ✅ Animations subtiles (réduites de 50%)
4. ✅ Responsive design
5. ✅ Accessibilité (prefers-reduced-motion)
6. ✅ Performance optimisée (useMemo, CSS pur)

## 📝 Notes importantes

- **Image requise** : Vous devez uploader votre image avant d'utiliser le composant
- **Format recommandé** : JPG ou WebP, résolution minimale 1920x1080
- **Taille optimale** : Compresser l'image pour de meilleures performances
- **Next.js Image** : Le composant utilise `next/image` pour l'optimisation automatique

## 🔍 Test

Pour tester rapidement avec une image placeholder :

```tsx
<HeroBanner
  backgroundImage="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920"
  title="Test Hero Banner"
  subtitle="Votre image sera ici"
  alt="Test image"
/>
```

## 🎯 Prochaines étapes

1. Uploader votre image dans `public/images/`
2. Intégrer le composant dans `page.tsx`
3. Ajuster les couleurs si nécessaire
4. Tester sur différents appareils
5. Optimiser l'image si nécessaire













