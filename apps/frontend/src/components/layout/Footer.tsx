'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Twitter,
  Linkedin,
  Github,
  Youtube,
  Mail,
  MapPin,
  Phone,
  ArrowRight,
  ChevronRight,
  Globe,
  Shield,
  Heart,
  ExternalLink,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Navigation links
const footerLinks = {
  product: {
    title: 'Produit',
    links: [
      { label: 'Customizer', href: '/solutions/customizer' },
      { label: 'Configurateur 3D', href: '/solutions/configurator-3d' },
      { label: 'Virtual Try-On', href: '/solutions/virtual-try-on' },
      { label: 'AI Design Hub', href: '/solutions/ai-design-hub' },
      { label: 'Tarifs', href: '/pricing' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Roadmap', href: '/roadmap', badge: 'Nouveau' },
    ],
  },
  integrations: {
    title: 'Intégrations',
    links: [
      { label: 'Shopify', href: '/integrations/shopify' },
      { label: 'WooCommerce', href: '/integrations/woocommerce' },
      { label: 'Stripe', href: '/integrations/stripe' },
      { label: 'Printful', href: '/integrations/printful' },
      { label: 'Zapier', href: '/integrations/zapier' },
      { label: 'API', href: '/help/documentation/api-reference' },
    ],
  },
  industries: {
    title: 'Industries',
    links: [
      { label: 'Mode & Textile', href: '/industries/fashion' },
      { label: 'Mobilier', href: '/industries/furniture' },
      { label: 'Automobile', href: '/industries/automotive' },
      { label: 'Joaillerie', href: '/industries/jewelry' },
      { label: 'Sports', href: '/industries/sports' },
      { label: 'Électronique', href: '/industries/electronics' },
    ],
  },
  resources: {
    title: 'Ressources',
    links: [
      { label: 'Documentation', href: '/docs' },
      { label: 'Guides', href: '/docs/guides' },
      { label: 'Blog', href: '/blog' },
      { label: 'Webinaires', href: '/webinars' },
      { label: 'Case Studies', href: '/case-studies' },
      { label: 'Templates', href: '/templates' },
    ],
  },
  company: {
    title: 'Entreprise',
    links: [
      { label: 'À propos', href: '/about' },
      { label: 'Carrières', href: '/careers', badge: '3 postes' },
      { label: 'Presse', href: '/press' },
      { label: 'Partenaires', href: '/partners' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  legal: {
    title: 'Légal',
    links: [
      { label: 'CGU', href: '/legal/terms' },
      { label: 'Confidentialité', href: '/legal/privacy' },
      { label: 'Cookies', href: '/legal/cookies' },
      { label: 'RGPD', href: '/legal/gdpr' },
      { label: 'Sécurité', href: '/security' },
    ],
  },
};

// Social links
const socialLinks = [
  { name: 'Twitter', icon: <Twitter className="w-5 h-5" />, href: 'https://twitter.com/luneoapp' },
  { name: 'LinkedIn', icon: <Linkedin className="w-5 h-5" />, href: 'https://linkedin.com/company/luneo' },
  { name: 'GitHub', icon: <Github className="w-5 h-5" />, href: 'https://github.com/luneo' },
  { name: 'YouTube', icon: <Youtube className="w-5 h-5" />, href: 'https://youtube.com/@luneo' },
];

// Trust badges
const trustBadges = [
  { label: 'RGPD Compliant', icon: <Shield className="w-4 h-4" /> },
  { label: 'SOC 2 Type II', icon: <Shield className="w-4 h-4" /> },
  { label: 'CDN Europe', icon: <Globe className="w-4 h-4" /> },
];

function FooterContent() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setSubscribing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubscribed(true);
    setSubscribing(false);
    setEmail('');
    
    // Reset after 3 seconds
    setTimeout(() => setSubscribed(false), 3000);
  }, [email]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      {/* Newsletter Section */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Restez informé des dernières nouveautés
              </h3>
              <p className="text-slate-400">
                Recevez nos conseils, tutoriels et mises à jour produit. Pas de spam, promis.
              </p>
            </div>
            <div>
              <form onSubmit={handleSubscribe} className="flex gap-3">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="votre@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    disabled={subscribing}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={subscribing || !email}
                  className="bg-cyan-600 hover:bg-cyan-700 px-6"
                >
                  {subscribing ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : subscribed ? (
                    <>
                      <Check className="w-5 h-5 mr-1" />
                      Inscrit !
                    </>
                  ) : (
                    <>
                      S&apos;inscrire
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
              <p className="text-xs text-slate-500 mt-2">
                En vous inscrivant, vous acceptez notre{' '}
                <Link href="/legal/privacy" className="text-cyan-400 hover:underline">
                  politique de confidentialité
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-4">{footerLinks.product.title}</h4>
            <ul className="space-y-2.5">
              {footerLinks.product.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    {link.label}
                    {link.badge && (
                      <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Integrations */}
          <div>
            <h4 className="font-semibold text-white mb-4">{footerLinks.integrations.title}</h4>
            <ul className="space-y-2.5">
              {footerLinks.integrations.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Industries */}
          <div>
            <h4 className="font-semibold text-white mb-4">{footerLinks.industries.title}</h4>
            <ul className="space-y-2.5">
              {footerLinks.industries.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-4">{footerLinks.resources.title}</h4>
            <ul className="space-y-2.5">
              {footerLinks.resources.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-4">{footerLinks.company.title}</h4>
            <ul className="space-y-2.5">
              {footerLinks.company.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    {link.label}
                    {link.badge && (
                      <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">{footerLinks.legal.title}</h4>
            <ul className="space-y-2.5">
              {footerLinks.legal.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Company Info & Social */}
        <div className="border-t border-slate-800 pt-8 pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Logo & Description */}
            <div>
              <div className="mb-4">
                <Link href="/" className="inline-block">
                  <Image
                    src="/logo.png"
                    alt="Luneo Logo"
                    width={900}
                    height={360}
                    className="h-24 md:h-32 lg:h-40 w-auto object-contain"
                    priority
                  />
                </Link>
              </div>
              <p className="text-sm text-slate-400 mb-4 max-w-sm">
                La plateforme de personnalisation produit n°1 en Europe. Customizer, Configurateur 3D et Virtual Try-On pour e-commerce.
              </p>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <MapPin className="w-4 h-4" />
                <span>Paris, France</span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-4">
              {trustBadges.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg"
                >
                  <div className="text-green-400">{badge.icon}</div>
                  <span className="text-xs text-slate-400">{badge.label}</span>
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex justify-center lg:justify-end">
              <div className="flex items-center gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 hover:bg-slate-800 transition-all"
                    aria-label={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-6 mt-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              © {currentYear} Luneo. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/legal/terms" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Conditions
              </Link>
              <Link href="/legal/privacy" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Confidentialité
              </Link>
              <Link href="/legal/cookies" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Cookies
              </Link>
              <div className="flex items-center gap-1 text-sm text-slate-500">
                <span>Made with</span>
                <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                <span>in Paris</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-slate-500">Tous les systèmes opérationnels</span>
            </div>
            <Link
              href="/status"
              className="text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
            >
              Page statut
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

const FooterContentMemo = memo(FooterContent);

export function Footer() {
  return (
    <ErrorBoundary componentName="Footer">
      <FooterContentMemo />
    </ErrorBoundary>
  );
}
