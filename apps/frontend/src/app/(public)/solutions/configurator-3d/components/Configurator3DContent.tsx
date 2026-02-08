'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Sparkles, Building2, Star, Cpu, Award, Code, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useSolutionData } from '@/lib/hooks/useSolutionData';
import { PageHero } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { FEATURES, USE_CASES, TECH_SPECS, FAQS, COMPARISON_FEATURES, TESTIMONIALS } from './data';
import type { Testimonial } from './data';
import { DemoSection } from './DemoSection';
import { FeaturesSection } from './FeaturesSection';
import { UseCasesSection } from './UseCasesSection';
import { ROICalculatorSection } from './ROICalculatorSection';
import { TestimonialsSection } from './TestimonialsSection';
import { TechSpecsSection } from './TechSpecsSection';
import { ComparisonSection } from './ComparisonSection';
import { ApiSdkSection } from './ApiSdkSection';
import { FAQSection } from './FAQSection';

export function Configurator3DContent() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const { data: solutionData } = useSolutionData('configurator-3d');

  const testimonials = useMemo((): Testimonial[] => {
    if (solutionData?.testimonials?.length) {
      return solutionData.testimonials.map((t) => ({
        quote: t.quote,
        author: t.author,
        role: t.role,
        company: t.company,
        avatar: t.avatar,
        metric: t.result?.split(' ')[0] || '+100%',
        metricLabel: t.result?.split(' ').slice(1).join(' ') || 'Amélioration',
      }));
    }
    return TESTIMONIALS;
  }, [solutionData]);

  const toggleFAQ = useCallback((index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <>
      <PageHero
        title="Configurateur 3D"
        description="Permettez à vos clients de configurer produits en 3D temps réel. PBR materials, gravure 3D, et export AR natif pour une expérience exceptionnelle."
        badge="Solution 3D"
        gradient="from-blue-600 via-purple-600 to-pink-600"
        cta={{ label: 'Tester la démo', href: '#demo-3d' }}
      />
      <div className="min-h-screen bg-white text-gray-900">
        <DemoSection />
        <FeaturesSection />
        <UseCasesSection />
        <ROICalculatorSection />
        <TestimonialsSection testimonials={testimonials} />
        <TechSpecsSection />
        <ComparisonSection />
        <ApiSdkSection />
        <FAQSection faqs={FAQS} openFaqIndex={openFaqIndex} onToggleFAQ={toggleFAQ} />
        <CTASectionNew />
      </div>
    </>
  );
}
