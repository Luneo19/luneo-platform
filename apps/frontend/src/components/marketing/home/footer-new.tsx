'use client';

import Link from 'next/link';
import { Twitter, Linkedin, Github, MessageCircle } from 'lucide-react';

const footerLinks = {
  product: [
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Intégrations', href: '/integrations' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'Changelog', href: '/changelog' },
  ],
  company: [
    { label: 'À propos', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Carrières', href: '/careers' },
    { label: 'Presse', href: '/press' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'Centre d\'aide', href: '/help' },
    { label: 'Communauté', href: '/community' },
    { label: 'Contact', href: '/contact' },
  ],
  legal: [
    { label: 'Confidentialité', href: '/legal/privacy' },
    { label: 'Conditions', href: '/legal/terms' },
    { label: 'Sécurité', href: '/security' },
    { label: 'Cookies', href: '/legal/cookies' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/luneo_app', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com/company/luneo', label: 'LinkedIn' },
  { icon: Github, href: 'https://github.com/luneo', label: 'GitHub' },
  { icon: MessageCircle, href: 'https://discord.gg/luneo', label: 'Discord' },
];

/**
 * Footer Component - Site footer with links
 * Based on Pandawa template, adapted for Luneo
 */
export function FooterNew() {
  return (
    <footer className="bg-gray-900 py-20 pb-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_2fr] gap-20 mb-15">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="url(#logo-gradient-footer)" />
                  <path
                    d="M10 16L14 20L22 12"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <defs>
                    <linearGradient id="logo-gradient-footer" x1="0" y1="0" x2="32" y2="32">
                      <stop stopColor="#6366f1" />
                      <stop offset="1" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="text-xl font-bold text-white">Luneo</span>
            </Link>
            <p className="text-gray-400 leading-relaxed mb-6 max-w-xs">
              Construire l'avenir de la personnalisation de produits, une fonctionnalité à la fois.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-indigo-600 hover:text-white transition-all"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold text-white mb-5 uppercase tracking-wider">
                  {category === 'product'
                    ? 'Produit'
                    : category === 'company'
                    ? 'Entreprise'
                    : category === 'resources'
                    ? 'Ressources'
                    : 'Légal'}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
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

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-white/10">
          <p className="text-sm text-gray-500 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Luneo. Tous droits réservés.
          </p>
          <div className="flex gap-6">
            <span className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-green-500">🛡️</span>
              SOC 2 Certifié
            </span>
            <span className="flex items-center gap-2 text-sm text-gray-500">
              <span className="text-green-500">🔒</span>
              Conforme RGPD
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
