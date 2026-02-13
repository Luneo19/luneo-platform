'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Twitter, Linkedin, Github, MessageCircle, Mail } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

// =============================================================================
// DATA
// =============================================================================

const footerLinks = {
  product: {
    title: 'Produit',
    links: [
      { label: 'Design Studio', href: '/features' },
      { label: 'Configurateur 3D', href: '/features#3d' },
      { label: 'Virtual Try-On AR', href: '/features#ar' },
      { label: 'AI Generation', href: '/features#ai' },
      { label: 'Tarifs', href: '/pricing' },
    ],
  },
  company: {
    title: 'Entreprise',
    links: [
      { label: 'A propos', href: '/about' },
      { label: 'Carrieres', href: '/careers' },
      { label: 'Presse', href: '/press' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  resources: {
    title: 'Ressources',
    links: [
      { label: 'Documentation', href: '/help/documentation' },
      { label: 'API', href: '/developers' },
      { label: "Centre d'aide", href: '/help' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Status', href: '/status' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Confidentialite', href: '/legal/privacy' },
      { label: "Conditions d'utilisation", href: '/legal/terms' },
      { label: 'Securite', href: '/security' },
      { label: 'Cookies', href: '/legal/cookies' },
    ],
  },
};

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/luneo_app', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com/company/luneo', label: 'LinkedIn' },
  { icon: Github, href: 'https://github.com/luneo', label: 'GitHub' },
  { icon: MessageCircle, href: 'https://discord.gg/luneo', label: 'Discord' },
];

// =============================================================================
// FOOTER COMPONENT
// =============================================================================

export function FooterNew() {
  const [email, setEmail] = useState('');

  return (
    <footer className="relative bg-dark-bg border-t border-white/[0.04]">
      {/* Wave separator */}
      <div className="absolute top-0 left-0 right-0 -translate-y-full">
        <svg viewBox="0 0 1440 60" fill="none" className="w-full h-[40px] sm:h-[60px]" preserveAspectRatio="none">
          <path d="M0,60 C360,0 720,40 1080,20 C1260,10 1440,30 1440,60 L0,60 Z" fill="#0a0a0f" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-8 sm:pb-10">
        {/* Newsletter CTA */}
        <ScrollReveal animation="fade-up">
          <div className="relative mb-12 sm:mb-16 p-6 sm:p-8 md:p-10 rounded-2xl bg-gradient-to-br from-purple-500/10 via-dark-card to-pink-500/10 border border-white/[0.06] overflow-hidden">
            <div className="absolute inset-0 gradient-mesh-purple opacity-50" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-6">
              <div className="text-center lg:text-left">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white font-display mb-1.5 sm:mb-2">
                  Restez informe des nouveautes
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Recevez nos dernieres fonctionnalites, tutoriels et offres directement dans votre boite mail.
                </p>
              </div>
              <div className="flex w-full lg:w-auto gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="flex-1 lg:w-64 h-10 sm:h-11 px-3 sm:px-4 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all"
                />
                <Button className="h-10 sm:h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shrink-0 text-xs sm:text-sm px-3 sm:px-4">
                  <Mail className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1.5 sm:mr-2" />
                  <span className="hidden xs:inline">S&apos;inscrire</span>
                  <span className="xs:hidden">OK</span>
                </Button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Main footer grid */}
        <ScrollReveal animation="fade-up" delay={100}>
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_2.5fr] gap-10 sm:gap-12 lg:gap-16 mb-12 sm:mb-16">
            {/* Brand column */}
            <div>
              <Logo variant="dark" size="default" href="/" className="mb-4 sm:mb-5" />
              <p className="text-slate-300 leading-relaxed mb-5 sm:mb-6 max-w-xs text-xs sm:text-sm">
                Construire l&apos;avenir de la personnalisation de produits, une fonctionnalite a la fois.
              </p>
              <div className="flex gap-2.5 sm:gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <Link
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 sm:w-10 h-9 sm:h-10 bg-white/[0.04] border border-white/[0.06] rounded-xl flex items-center justify-center text-slate-300 hover:bg-purple-500/20 hover:border-purple-500/30 hover:text-purple-400 transition-all"
                      aria-label={social.label}
                    >
                      <Icon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Links grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
              {Object.values(footerLinks).map((section) => (
                <div key={section.title}>
                  <h4 className="text-[10px] sm:text-xs font-semibold text-slate-300 mb-3 sm:mb-5 uppercase tracking-wider">
                    {section.title}
                  </h4>
                  <ul className="space-y-2 sm:space-y-3">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-xs sm:text-sm text-slate-300 hover:text-white transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 sm:pt-8 border-t border-white/[0.04] gap-4 sm:gap-0">
          <p className="text-[10px] sm:text-xs text-slate-300">
            &copy; {new Date().getFullYear()} Luneo. Tous droits reserves.
          </p>
          <div className="flex gap-4 sm:gap-6 flex-wrap justify-center">
            <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              SOC 2 Certifie
            </span>
            <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Conforme RGPD
            </span>
            <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              SSL 256-bit
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
