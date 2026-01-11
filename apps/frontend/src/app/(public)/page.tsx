import {
  Navigation,
  HeroSectionNew,
  FeaturesSectionNew,
  HowItWorksNew,
  TestimonialsNew,
  PricingSectionNew,
  CTASectionNew,
  FooterNew,
  CursorGlow,
} from '@/components/marketing/home';

/**
 * Homepage - Modern landing page with all sections
 * Based on Pandawa template design, adapted for Luneo
 * This is a Server Component - all child components are Client Components
 * 
 * REFONTE COMPLÈTE - Janvier 2025
 * Nouveau design basé sur le template Pandawa avec animations et effets modernes
 */
export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSectionNew />
      <FeaturesSectionNew />
      <HowItWorksNew />
      <TestimonialsNew />
      <PricingSectionNew />
      <CTASectionNew />
    </main>
  );
}
