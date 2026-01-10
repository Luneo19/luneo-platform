'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Navigation Component - Modern navbar with mobile menu
 * Based on Pandawa template design
 */
export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#features', label: 'Fonctionnalités' },
    { href: '#how-it-works', label: 'Comment ça marche' },
    { href: '#pricing', label: 'Tarifs' },
    { href: '#testimonials', label: 'Témoignages' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-1000 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-20 border-b border-gray-100 py-3'
            : 'py-4'
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
                  <path
                    d="M10 16L14 20L22 12"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <defs>
                    <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
                      <stop stopColor="#6366f1" />
                      <stop offset="1" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">Luneo</span>
            </Link>

            {/* Desktop Navigation */}
            <ul className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="px-4 py-2.5 text-gray-600 font-medium text-sm rounded-xl hover:text-gray-900 hover:bg-gray-50 transition-all"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="font-medium">
                  Connexion
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/50">
                  Commencer
                  <span className="ml-2">→</span>
                </Button>
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 bg-white z-999 transition-all duration-300 ${
          mobileMenuOpen
            ? 'opacity-100 visible'
            : 'opacity-0 invisible pointer-events-none'
        }`}
        style={{ paddingTop: '100px', paddingBottom: '40px', paddingLeft: '24px', paddingRight: '24px' }}
      >
        <ul className="flex flex-col gap-2 mb-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-4 text-lg font-medium text-gray-700 rounded-xl hover:bg-gray-50 hover:text-indigo-600"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3">
          <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="outline" className="w-full">
              Connexion
            </Button>
          </Link>
          <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
            <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600">
              Commencer
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
