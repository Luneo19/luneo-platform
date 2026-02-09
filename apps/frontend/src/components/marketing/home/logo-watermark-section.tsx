'use client';

import React, { memo } from 'react';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

// =============================================================================
// LUNEO LOGO WATERMARK SECTION
// Subtle giant logo with animated SVG stroke contour
// =============================================================================

function LogoWatermarkSectionInner() {
  return (
    <section className="dark-section relative py-24 sm:py-32 md:py-40 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-bg via-purple-950/[0.03] to-dark-bg" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center">
          {/* Giant Logo with animated contour */}
          <ScrollReveal animation="zoom-in" duration={1000}>
            <div className="relative mb-8 sm:mb-12">
              {/* Watermark logo (very faint) */}
              <svg
                viewBox="0 0 200 200"
                className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Subtle filled logo */}
                <g opacity="0.03">
                  <circle cx="100" cy="100" r="90" fill="white" />
                  <text
                    x="100"
                    y="115"
                    textAnchor="middle"
                    fontSize="60"
                    fontWeight="900"
                    fontFamily="system-ui"
                    fill="white"
                  >
                    L
                  </text>
                </g>

                {/* Animated stroke contour - outer circle */}
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  stroke="url(#logo-gradient)"
                  strokeWidth="1.5"
                  fill="none"
                  className="animate-stroke-dash"
                  style={{
                    strokeDasharray: '565',
                    strokeDashoffset: '565',
                    animation: 'stroke-draw 4s ease-in-out infinite',
                  }}
                />

                {/* Second animated contour with offset */}
                <circle
                  cx="100"
                  cy="100"
                  r="82"
                  stroke="url(#logo-gradient-2)"
                  strokeWidth="0.5"
                  fill="none"
                  style={{
                    strokeDasharray: '515',
                    strokeDashoffset: '515',
                    animation: 'stroke-draw 4s ease-in-out infinite 1s',
                  }}
                />

                {/* Inner design element - hexagon */}
                <polygon
                  points="100,35 155,67.5 155,132.5 100,165 45,132.5 45,67.5"
                  stroke="url(#logo-gradient)"
                  strokeWidth="0.8"
                  fill="none"
                  style={{
                    strokeDasharray: '400',
                    strokeDashoffset: '400',
                    animation: 'stroke-draw 5s ease-in-out infinite 0.5s',
                  }}
                />

                {/* L letter outline */}
                <text
                  x="100"
                  y="115"
                  textAnchor="middle"
                  fontSize="60"
                  fontWeight="900"
                  fontFamily="system-ui"
                  fill="none"
                  stroke="url(#logo-gradient)"
                  strokeWidth="1"
                  style={{
                    strokeDasharray: '300',
                    strokeDashoffset: '300',
                    animation: 'stroke-draw 3s ease-in-out infinite 1.5s',
                  }}
                >
                  L
                </text>

                {/* Gradient definitions */}
                <defs>
                  <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#ec4899" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="logo-gradient-2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Glow behind logo */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 rounded-full bg-purple-500/[0.04] blur-[60px] sm:blur-[80px]" />
              </div>
            </div>
          </ScrollReveal>

          {/* Tagline */}
          <ScrollReveal animation="fade-up" delay={300}>
            <h3 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-3 sm:mb-4">
              <span className="text-white/90">Propulse par </span>
              <span className="italic text-gradient-purple">l&apos;innovation</span>
            </h3>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={500}>
            <p className="text-sm sm:text-base text-slate-500 text-center max-w-lg mx-auto leading-relaxed">
              La technologie qui repousse les limites de la personnalisation produit.
            </p>
          </ScrollReveal>
        </div>
      </div>

      {/* CSS for stroke animation */}
      <style jsx>{`
        @keyframes stroke-draw {
          0% {
            stroke-dashoffset: 565;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          50% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: -565;
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}

export const LogoWatermarkSection = memo(LogoWatermarkSectionInner);
