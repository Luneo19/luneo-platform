'use client';

import Link from 'next/link';
import { ArrowRight, Shield, Globe, Lock } from 'lucide-react';
import {
  ScrollReveal,
  MagneticButton,
  GradientText,
  AuroraBackground,
  ParticleField,
} from '@/components/ui/premium';
import { useState, useEffect } from 'react';

interface CTASectionNewProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
}

export function CTASectionNew({ title, subtitle }: CTASectionNewProps = {}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const defaultTitle = (
    <>
      <span className="text-white">Pret a </span>
      <GradientText variant="violet" className="font-editorial italic">
        transformer
      </GradientText>
      <br />
      <span className="text-white">votre business ?</span>
    </>
  );
  const defaultSubtitle = (
    <>
      Rejoignez des milliers de marques qui utilisent Luneo pour creer des experiences produit{' '}
      <span className="text-white/80 font-medium">exceptionnelles</span>.
    </>
  );

  return (
    <section className="relative py-28 sm:py-36 bg-dark-bg overflow-hidden">
      <AuroraBackground className="absolute inset-0" variant="intense" />
      {mounted && (
        <ParticleField
          particleCount={30}
          speed={0.15}
          connectDistance={80}
          style="constellation"
          colors={['#6366f1', '#8b5cf6', '#a78bfa']}
        />
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal direction="up" duration={700}>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              {title ?? defaultTitle}
            </h2>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={100}>
            <p className="text-lg sm:text-xl text-white/50 mb-10 max-w-xl mx-auto leading-relaxed">
              {subtitle !== undefined ? subtitle : defaultSubtitle}
            </p>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={200}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Link href="/register">
                <MagneticButton variant="primary" size="xl" glow>
                  Essai gratuit — 14 jours
                  <ArrowRight className="w-5 h-5" />
                </MagneticButton>
              </Link>
              <Link href="/contact">
                <MagneticButton variant="secondary" size="xl">
                  Parler aux ventes
                </MagneticButton>
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={300}>
            <div className="flex items-center justify-center gap-6 text-white/40 text-xs">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> SOC 2
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> RGPD
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> SSL 256-bit
              </span>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
