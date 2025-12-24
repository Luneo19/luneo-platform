/**
 * HeroBannerOptimized - Exemples d'utilisation
 * 
 * Ce fichier montre comment utiliser le composant HeroBannerOptimized
 * dans différentes configurations.
 */

import { HeroBannerOptimized } from './HeroBannerOptimized';
import { Button } from '@/components/ui/button';

// ============================================
// EXEMPLE 1 : Utilisation basique
// ============================================
export function Example1_Basic() {
  return (
    <HeroBannerOptimized
      title="L'Auteure de Personnalisation 3D"
      subtitle="De Idée, à Réalité Augmentée par IA."
    />
  );
}

// ============================================
// EXEMPLE 2 : Avec image de fond
// ============================================
export function Example2_WithBackground() {
  return (
    <HeroBannerOptimized
      backgroundImage="/images/hero-background.jpg"
      title="L'Auteure de Personnalisation 3D"
      subtitle="De Idée, à Réalité Augmentée par IA."
      alt="Hero background - Personnalisation 3D avec IA"
    />
  );
}

// ============================================
// EXEMPLE 3 : Avec boutons CTA
// ============================================
export function Example3_WithCTAs() {
  return (
    <HeroBannerOptimized
      title="L'Auteure de Personnalisation 3D"
      subtitle="De Idée, à Réalité Augmentée par IA."
    >
      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        marginTop: '2rem',
        flexWrap: 'wrap',
        zIndex: 25,
        position: 'relative'
      }}>
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
    </HeroBannerOptimized>
  );
}

// ============================================
// EXEMPLE 4 : Sans titre personnalisé
// ============================================
export function Example4_DefaultText() {
  // Utilise les valeurs par défaut
  return (
    <HeroBannerOptimized
      backgroundImage="/images/hero-background.jpg"
    />
  );
}

// ============================================
// EXEMPLE 5 : Intégration dans page.tsx
// ============================================
export function Example5_IntegrationInPage() {
  // Pour intégrer dans apps/frontend/src/app/(public)/page.tsx
  // Remplacez la section hero existante par :
  
  return (
    <HeroBannerOptimized
      backgroundImage="/images/hero-background.jpg"
      title="L'Auteure de Personnalisation 3D"
      subtitle="De Idée, à Réalité Augmentée par IA."
      alt="Hero background"
    >
      {/* Vos boutons CTA ici */}
      <div className="flex gap-4 justify-center mt-8 flex-wrap z-50 relative">
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
          Démarrer
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="bg-white/10 border-white/30 text-white hover:bg-white/20"
        >
          Découvrir
        </Button>
      </div>
    </HeroBannerOptimized>
  );
}

// ============================================
// EXEMPLE 6 : Avec image externe
// ============================================
export function Example6_ExternalImage() {
  return (
    <HeroBannerOptimized
      backgroundImage="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920"
      title="Votre Titre Personnalisé"
      subtitle="Votre sous-titre personnalisé"
      alt="Image externe"
    />
  );
}

