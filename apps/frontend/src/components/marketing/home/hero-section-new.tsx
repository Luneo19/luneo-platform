'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Play, ArrowRight } from 'lucide-react';
import { useCounter, formatNumber } from '@/hooks/useCounter';

/**
 * Hero Section - Modern hero with animated stats and dashboard mockup
 * Based on Pandawa template, adapted for Luneo
 */
export function HeroSectionNew() {
  const statsRef1 = useRef<HTMLSpanElement>(null);
  const statsRef2 = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Animate counters when in view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            const count = parseInt(target.getAttribute('data-count') || '0', 10);
            animateCounter(target, count);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (statsRef1.current) observer.observe(statsRef1.current);
    if (statsRef2.current) observer.observe(statsRef2.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative min-h-screen pt-32 pb-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="gradient-orb orb-1 absolute w-[600px] h-[600px] bg-gradient-to-br from-indigo-500 to-purple-500 top-[-200px] right-[-100px] animate-float" />
        <div className="gradient-orb orb-2 absolute w-[400px] h-[400px] bg-gradient-to-br from-pink-500 to-rose-500 bottom-[-100px] left-[-100px] animate-float" style={{ animationDelay: '-5s' }} />
        <div className="gradient-orb orb-3 absolute w-[300px] h-[300px] bg-gradient-to-br from-cyan-500 to-blue-500 top-[40%] left-[20%] animate-float" style={{ animationDelay: '-10s' }} />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(99, 102, 241, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(99, 102, 241, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2.5 px-4 py-2 pl-3 pr-4 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 mb-6 shadow-sm animate-slideDown"
            data-animate="fade-up"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Découvrez Luneo 2.0</span>
            <ArrowRight className="w-3 h-3 text-indigo-600" />
          </div>

          {/* Main Heading */}
          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight"
            data-animate="fade-up"
            data-delay="100"
          >
            Personnalisez vos produits{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block">
              10x plus vite
            </span>
          </h1>

          {/* Description */}
          <p
            className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed"
            data-animate="fade-up"
            data-delay="200"
          >
            La plateforme tout-en-un qui aide les marques à concevoir, développer et livrer
            des expériences de personnalisation exceptionnelles avec une rapidité et une qualité inégalées.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            data-animate="fade-up"
            data-delay="300"
          >
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-base font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all"
              >
                Essai gratuit
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-base font-semibold border-2 hover:border-indigo-600 hover:text-indigo-600"
              >
                <Play className="mr-2 w-5 h-5" />
                Voir la démo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div
            className="flex flex-wrap items-center justify-center gap-8"
            data-animate="fade-up"
            data-delay="400"
          >
            <div className="text-center">
              <span
                ref={statsRef1}
                className="block text-3xl font-bold text-gray-900"
                data-count="10000"
              >
                0
              </span>
              <span className="text-sm text-gray-500">Utilisateurs actifs</span>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="text-center">
              <span
                ref={statsRef2}
                className="block text-3xl font-bold text-gray-900"
                data-count="500"
              >
                0
              </span>
              <span className="text-sm text-gray-500">Marques</span>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="text-center">
              <span className="block text-3xl font-bold text-gray-900">4.9</span>
              <span className="text-sm text-gray-500">Note</span>
              <div className="flex gap-0.5 justify-center mt-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-xs text-yellow-400">★</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="max-w-5xl mx-auto" data-animate="fade-up" data-delay="500">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden transform rotate-x-5 hover:rotate-x-0 transition-transform duration-500">
      {/* Browser Header */}
      <div className="flex items-center gap-4 px-5 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 text-center text-xs text-gray-400 font-medium">
          luneo.app/dashboard
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex min-h-[400px]">
        {/* Sidebar */}
        <div className="w-[60px] bg-gray-900 p-5 flex flex-col items-center gap-4">
          {['home', 'chart', 'users', 'settings'].map((icon, i) => (
            <div
              key={icon}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 cursor-pointer transition-all ${
                i === 0
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-lg">●</span>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 bg-gray-50 grid grid-cols-2 gap-5">
          {/* Card 1 */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white mb-3">
              ⚡
            </div>
            <div className="mb-4">
              <span className="block text-xs text-gray-500 mb-1">Performance</span>
              <span className="text-3xl font-bold text-gray-900">98.5%</span>
            </div>
            <div className="h-12">
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
                <path
                  className="chart-line"
                  d="M0,35 Q25,30 35,20 T60,15 T100,5"
                  fill="none"
                  stroke="url(#chart-gradient)"
                  strokeWidth="2"
                />
                <defs>
                  <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-2 text-xs text-gray-500">
              <span>Revenus hebdomadaires</span>
              <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full font-semibold">
                +24.5%
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-4">48 352 €</div>
            <div className="flex items-end gap-2 h-15">
              {[60, 80, 45, 90, 70, 100, 55].map((height, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t ${
                    i === 5
                      ? 'bg-gradient-to-t from-indigo-600 to-purple-600'
                      : 'bg-gray-200'
                  }`}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl p-5 shadow-sm col-span-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 border-2 border-white"
                  />
                ))}
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold border-2 border-white">
                  +12
                </div>
              </div>
              <span className="text-sm text-gray-500">Membres de l'équipe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function animateCounter(element: HTMLElement, target: number) {
  const duration = 2000;
  const start = 0;
  const startTime = performance.now();

  function update(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = Math.floor(start + (target - start) * easeOutQuart);

    element.textContent = formatNumber(current);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = formatNumber(target);
    }
  }

  requestAnimationFrame(update);
}
