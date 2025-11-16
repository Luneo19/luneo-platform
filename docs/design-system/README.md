# Design System Luneo

## Principes

- **Palette pilotée par tokens** : toutes les couleurs, espacements, rayons et ombres sont exposés via `src/styles/tokens.css` (`--ds-*`).  
- **Thématisation** : la classe `dark` et l’attribut `data-theme` (light/dark/system) sont gérés par `ThemeProvider` (voir `src/app/providers.tsx`).  
- **Accessibilité** : focus visibles, contrastes AA, support `prefers-reduced-motion`. Les composants interactifs doivent intégrer `aria-*` et respecter la navigation clavier.
- **Évolutivité** : les composants UI partagés résident dans `@/components/ui` (basés sur `class-variance-authority`). Ajouter ici tout nouvel élément réutilisable.

## Usage

```tsx
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Button } from '@/components/ui/button';

function Toolbar() {
  return (
    <div className="flex items-center gap-3">
      <Button variant="outline">Action</Button>
      <ThemeToggle />
    </div>
  );
}
```

## Checklist composant

1. Utiliser les tokens (`bg-card`, `text-muted-foreground`, etc.) plutôt que des hex arbitraires.  
2. Gérer l’état actif/inactif, focus, disabled.  
3. Vérifier la compatibilité mode sombre.  
4. Écrire au minimum un test (Vitest + Testing Library) pour les comportements critiques.  
5. Documenter les variantes dans Storybook (à venir) ou dans la doc produit.

