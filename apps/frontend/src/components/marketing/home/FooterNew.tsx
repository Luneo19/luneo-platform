'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Twitter, Linkedin, Github } from 'lucide-react';

const FOOTER_COLUMNS = [
  {
    title: 'Produit',
    links: [
      { label: 'Fonctionnalités', href: '/#features' },
      { label: 'Tarifs', href: '/#pricing' },
      { label: 'Comment ça marche', href: '/#how-it-works' },
      { label: 'Démo', href: '/#demo' },
      { label: 'Intégrations', href: '/integrations' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'À propos', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Carrières', href: '/careers' },
      { label: 'Contact', href: '/contact' },
      { label: 'Status', href: '/status' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Confidentialité', href: '/legal/privacy' },
      { label: 'CGU', href: '/legal/terms' },
      { label: 'Cookies', href: '/legal/cookies' },
    ],
  },
];

const SOCIAL_LINKS = [
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: Github, href: 'https://github.com', label: 'GitHub' },
];

export function FooterNew() {
  return (
    <footer className="border-t border-white/[0.06] py-16 bg-[#0a0a0f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Logo & description */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Logo href="/" size="default" showText={true} variant="dark" />
            <p className="mt-4 text-sm text-white/50 max-w-xs">
              Agents IA autonomes pour automatiser votre service client, ventes et support.
            </p>
            <div className="flex gap-4 mt-6">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/40 hover:text-violet-400 transition-colors"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Columns */}
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-white mb-4">{column.title}</h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Luneo. Tous droits réservés.
          </p>
          <p className="text-sm text-white/40">
            Agents IA autonomes pour le service client.
          </p>
        </div>
      </div>
    </footer>
  );
}
