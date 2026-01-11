'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { Logo } from '@/components/Logo';
import { Navigation } from '@/components/marketing/home/navigation';
import { FooterNew } from '@/components/marketing/home/footer-new';
import { CursorGlow } from '@/components/marketing/home/cursor-glow';
import {
  Sparkles,
  Shield,
  Zap,
  Globe,
  Users,
  CheckCircle,
  Star,
  ArrowRight,
  Layers,
  Palette,
  Box,
} from 'lucide-react';

// Feature highlights for the marketing panel
const features = [
  {
    icon: <Palette className="w-5 h-5" />,
    title: 'Personnalisation Produit',
    description: "Éditeur visuel drag & drop pour vos clients",
  },
  {
    icon: <Box className="w-5 h-5" />,
    title: 'Configurateur 3D',
    description: "Visualisation temps réel avec WebGL",
  },
  {
    icon: <Layers className="w-5 h-5" />,
    title: 'Virtual Try-On',
    description: "Essayage AR avec tracking 468 points",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Intégrations',
    description: "Shopify, WooCommerce, API RESTful",
  },
];

// Testimonials for social proof
const testimonials = [
  {
    quote: "Luneo a transformé notre expérience client. +45% de conversions en 3 mois.",
    author: "Sophie Laurent",
    role: "E-commerce Director",
    company: "Optic 2000",
    avatar: "SL",
  },
  {
    quote: "L'intégration a pris 2 jours. Le ROI a été positif dès le premier mois.",
    author: "Marc Dubois",
    role: "CEO",
    company: "PrintShop Pro",
    avatar: "MD",
  },
  {
    quote: "La meilleure solution de personnalisation que nous avons testée. Support exceptionnel.",
    author: "Claire Moreau",
    role: "Head of Digital",
    company: "Bijoux Paris",
    avatar: "CM",
  },
];

// Stats to display
const stats = [
  { value: '500+', label: 'Marques' },
  { value: '10M+', label: 'Produits créés' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9/5', label: 'Satisfaction' },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Memoize particles for performance
  const particles = useMemo(() => 
    [...Array(30)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: 3 + Math.random() * 4,
      delay: Math.random() * 3,
    })),
    []
  );

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-white">
      <CursorGlow />
      <Navigation />
      <div className="min-h-screen flex flex-col lg:flex-row pt-16 lg:pt-0">
        {/* Left Panel - Marketing/Branding (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(6,182,212,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />
          
          {/* Floating particles */}
          {particles.map((particle) => (
            <motion
              key={particle.id}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{ left: particle.left, top: particle.top }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
              }}
            />
          ))}

          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-8 xl:p-12 w-full">
          {/* Logo */}
          <div>
            <Logo href="/" size="large" showText={true} variant="light" />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center py-12">
            <motion
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-bold text-white leading-tight mb-6">
                La plateforme de<br />
                <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                  personnalisation produit
                </span>
                <br />n°1 en Europe
              </h1>
              <p className="text-lg text-white/90 mb-10 max-w-lg leading-relaxed">
                Créez des expériences d&apos;achat uniques avec notre suite d&apos;outils de personnalisation, 
                configuration 3D et essayage virtuel.
              </p>
            </motion>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              {features.map((feature, index) => (
                <motion
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-start gap-3 p-4 bg-white/10 rounded-xl border border-white/20 hover:border-white/40 transition-colors backdrop-blur-sm"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm">{feature.title}</h3>
                    <p className="text-xs text-white/80">{feature.description}</p>
                  </div>
                </motion>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mb-10">
              {stats.map((stat, index) => (
                <motion
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </motion>
              ))}
            </div>

            {/* Testimonial Carousel */}
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion
                  key={currentTestimonial}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white/10 rounded-xl p-6 border border-white/20 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                    ))}
                  </div>
                  <p className="text-white text-sm leading-relaxed mb-4">
                    &quot;{testimonials[currentTestimonial].quote}&quot;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white text-sm font-medium backdrop-blur-sm">
                      {testimonials[currentTestimonial].avatar}
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">
                        {testimonials[currentTestimonial].author}
                      </div>
                      <div className="text-xs text-white/70">
                        {testimonials[currentTestimonial].role}, {testimonials[currentTestimonial].company}
                      </div>
                    </div>
                  </div>
                </motion>
              </AnimatePresence>

              {/* Testimonial indicators */}
              <div className="flex items-center gap-2 mt-4">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentTestimonial 
                        ? 'bg-white w-6' 
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section - Security badges */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <Shield className="w-4 h-4" />
              <span>RGPD Compliant</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <Globe className="w-4 h-4" />
              <span>CDN Europe</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <CheckCircle className="w-4 h-4" />
              <span>SOC 2 Type II</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="flex-1 lg:w-1/2 xl:w-[45%] bg-white lg:bg-gray-50 relative min-h-screen">

        {/* Form container */}
        <div className="min-h-screen flex items-center justify-center px-4 py-16 lg:py-8">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        {/* Background gradient for right panel - removed on mobile to avoid overlay blocking */}
      </div>
      </div>
      <FooterNew />
    </div>
  );
}
// Force rebuild Sun Jan 11 18:27:56 CET 2026
