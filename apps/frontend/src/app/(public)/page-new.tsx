import {
  HeroSection,
  Integrations,
  FeaturesSection,
  HowItWorks,
  StatsSection,
  Testimonials,
  PricingPreview,
  FAQSection,
  CTAFinal,
} from '@/components/marketing/home';

/**
 * Homepage - Modern landing page with all sections
 * Style inspired by Pandawa/Gladia
 * This is a Server Component - all child components are Client Components
 */
export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <Integrations />
      <FeaturesSection />
      <HowItWorks />
      <StatsSection />
      <Testimonials />
      <PricingPreview />
      <FAQSection />
      <CTAFinal />
    </main>
  );
}
