/**
 * HeroBanner - Exemple d'utilisation
 * 
 * Ce fichier montre comment utiliser le composant HeroBanner
 * dans votre page d'accueil ou toute autre page.
 */

import { HeroBanner } from './HeroBanner';
import { Button } from '@/components/ui/button';

// Exemple 1 : Utilisation basique avec image
export function HeroBannerBasicExample() {
  return (
    <HeroBanner
      backgroundImage="/images/hero-background.jpg"
      alt="Hero background image"
    />
  );
}

// Exemple 2 : Avec titre et sous-titre
export function HeroBannerWithTextExample() {
  return (
    <HeroBanner
      backgroundImage="/images/hero-background.jpg"
      title="L'Auteure de Personnalisation 3D"
      subtitle="De Idée, à Réalité Augmentée par IA."
      alt="Hero background image"
    />
  );
}

// Exemple 3 : Avec contenu personnalisé (boutons, etc.)
export function HeroBannerWithContentExample() {
  return (
    <HeroBanner
      backgroundImage="/images/hero-background.jpg"
      title="L'Auteure de Personnalisation 3D"
      subtitle="De Idée, à Réalité Augmentée par IA."
      alt="Hero background image"
    >
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        justifyContent: 'center',
        marginTop: '2rem',
        flexWrap: 'wrap'
      }}>
        <Button size="lg" variant="default">
          Commencer maintenant
        </Button>
        <Button size="lg" variant="outline" style={{ 
          background: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          color: 'white'
        }}>
          En savoir plus
        </Button>
      </div>
    </HeroBanner>
  );
}

// Exemple 4 : Utilisation avec image Next.js optimisée
export function HeroBannerNextImageExample() {
  // Le composant utilise déjà Next.js Image en interne
  // Il suffit de passer le chemin relatif ou l'URL
  return (
    <HeroBanner
      backgroundImage="https://example.com/your-image.jpg"
      title="Titre personnalisé"
      subtitle="Sous-titre personnalisé"
      alt="Description de l'image pour l'accessibilité"
    />
  );
}













