'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Palette, Box, Glasses, BarChart3,
  Layers, Type, MousePointer2, Undo2, Download, ZoomIn,
  RotateCw, Droplets, Sun, Eye,
  Camera, Scan, Smartphone, CheckCircle2,
  TrendingUp, Users, ShoppingCart, ArrowUpRight,
  Sparkles,
} from 'lucide-react';

// =============================================================================
// TAB DATA
// =============================================================================

const TABS = [
  {
    id: 'design',
    label: 'Design Studio',
    icon: Palette,
    gradient: 'from-indigo-500 to-violet-500',
    accentColor: '#6366f1',
    description: 'Editeur visuel drag-and-drop avec outils pro',
  },
  {
    id: '3d',
    label: 'Configurateur 3D',
    icon: Box,
    gradient: 'from-violet-500 to-purple-500',
    accentColor: '#8b5cf6',
    description: 'Visualisation produit interactive en temps reel',
  },
  {
    id: 'tryon',
    label: 'Virtual Try-On',
    icon: Glasses,
    gradient: 'from-purple-500 to-pink-500',
    accentColor: '#a855f7',
    description: 'Essayage AR avec tracking facial 468 points',
  },
  {
    id: 'analytics',
    label: 'Analytics IA',
    icon: BarChart3,
    gradient: 'from-cyan-500 to-indigo-500',
    accentColor: '#06b6d4',
    description: 'Insights de performance en temps reel',
  },
] as const;

// =============================================================================
// ANIMATED UNDERLINE TABS (Linear-style)
// =============================================================================

function TabNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: number;
  onTabChange: (index: number) => void;
}) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });

  const updateUnderline = useCallback(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      const parent = el.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        setUnderlineStyle({
          left: elRect.left - parentRect.left,
          width: elRect.width,
        });
      }
    }
  }, [activeTab]);

  useEffect(() => {
    updateUnderline();
    window.addEventListener('resize', updateUnderline);
    return () => window.removeEventListener('resize', updateUnderline);
  }, [updateUnderline]);

  return (
    <div className="relative flex justify-center mb-8">
      <div className="relative inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        {TABS.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = activeTab === idx;
          return (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[idx] = el; }}
              onClick={() => onTabChange(idx)}
              className={`relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-300 whitespace-nowrap ${
                isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
        {/* Sliding indicator */}
        <div
          className="absolute top-1 h-[calc(100%-8px)] rounded-lg bg-white/[0.08] border border-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0,1)]"
          style={{
            left: underlineStyle.left,
            width: underlineStyle.width,
          }}
        />
        {/* Glow under active tab */}
        <div
          className="absolute -bottom-px h-[2px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0,1)]"
          style={{
            left: underlineStyle.left + underlineStyle.width * 0.15,
            width: underlineStyle.width * 0.7,
            background: `linear-gradient(90deg, transparent, ${TABS[activeTab].accentColor}, transparent)`,
            boxShadow: `0 0 12px ${TABS[activeTab].accentColor}50`,
          }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// BROWSER CHROME FRAME (Stripe-style)
// =============================================================================

function BrowserFrame({
  children,
  url,
  accentColor,
}: {
  children: React.ReactNode;
  url: string;
  accentColor: string;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden border border-white/[0.06]"
      style={{
        boxShadow: `0 24px 70px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 80px ${accentColor}10`,
      }}
    >
      {/* Browser chrome bar */}
      <div className="flex items-center gap-4 px-5 py-3 bg-white/[0.02] border-b border-white/[0.04]">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-white/[0.07] hover:bg-red-500/60 transition-colors cursor-pointer" />
          <span className="w-3 h-3 rounded-full bg-white/[0.07] hover:bg-yellow-500/60 transition-colors cursor-pointer" />
          <span className="w-3 h-3 rounded-full bg-white/[0.07] hover:bg-green-500/60 transition-colors cursor-pointer" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 px-4 py-1 rounded-md bg-white/[0.03] border border-white/[0.05]">
            <div className="w-3 h-3 rounded-full bg-green-500/40" />
            <span className="text-[11px] text-white/35 font-mono">{url}</span>
          </div>
        </div>
        <div className="w-16" />
      </div>
      {/* Content */}
      <div className="relative bg-[#08080f] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// MODULE MOCKUPS - Realistic CSS UI for each module
// =============================================================================

// --- DESIGN STUDIO ---
function DesignStudioMockup() {
  return (
    <div className="flex h-[320px] sm:h-[380px] md:h-[420px]">
      {/* Left toolbar */}
      <div className="w-12 bg-white/[0.02] border-r border-white/[0.04] flex flex-col items-center py-3 gap-3">
        {[MousePointer2, Type, Layers, Palette, Sparkles, Undo2].map((Icon, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              i === 0 ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/25 hover:text-white/50'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
        ))}
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative p-6 flex items-center justify-center">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* Design canvas - T-shirt mockup */}
        <div className="relative w-48 sm:w-56 md:w-64 h-48 sm:h-56 md:h-64 bg-gradient-to-br from-white/[0.03] to-white/[0.01] rounded-xl border border-white/[0.06] flex items-center justify-center overflow-hidden">
          {/* T-shirt shape */}
          <svg viewBox="0 0 200 200" className="w-40 sm:w-48 md:w-52 h-40 sm:h-48 md:h-52 text-white/10">
            <path d="M60,30 L30,50 L45,80 L55,70 L55,170 L145,170 L145,70 L155,80 L170,50 L140,30 L120,45 L80,45 Z" fill="currentColor" stroke="rgba(99,102,241,0.3)" strokeWidth="1" />
          </svg>
          {/* Design overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/20 animate-pulse flex items-center justify-center">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400/60" />
            </div>
          </div>
          {/* Selection handles */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 sm:w-24 h-20 sm:h-24 border border-indigo-500/40 border-dashed">
            {['-top-1 -left-1', '-top-1 -right-1', '-bottom-1 -left-1', '-bottom-1 -right-1'].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-2 h-2 bg-indigo-500 rounded-sm`} />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Layers & properties */}
      <div className="w-48 sm:w-56 bg-white/[0.02] border-l border-white/[0.04] p-3 space-y-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-1">Calques</div>
        {[
          { name: 'Logo principal', color: 'bg-indigo-500', active: true },
          { name: 'Texte arriere', color: 'bg-violet-500', active: false },
          { name: 'Fond', color: 'bg-white/20', active: false },
        ].map((layer, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
              layer.active ? 'bg-indigo-500/10 text-white/80' : 'text-white/40 hover:bg-white/[0.03]'
            }`}
          >
            <div className={`w-3 h-3 rounded-sm ${layer.color}`} />
            <span className="truncate">{layer.name}</span>
            <Eye className="w-3 h-3 ml-auto opacity-40" />
          </div>
        ))}
        <div className="pt-3 border-t border-white/[0.04]">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-1 mb-2">Couleurs</div>
          <div className="flex gap-1.5 px-1">
            {['bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-cyan-500', 'bg-white/80'].map((c, i) => (
              <div key={i} className={`w-6 h-6 rounded-md ${c} ${i === 0 ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-[#08080f]' : ''} cursor-pointer`} />
            ))}
          </div>
        </div>
        <div className="pt-3 border-t border-white/[0.04] flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-medium">
            <Download className="w-3 h-3" /> Exporter
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-white/[0.04] text-white/40 text-[10px] font-medium">
            <ZoomIn className="w-3 h-3" /> Preview
          </button>
        </div>
      </div>
    </div>
  );
}

// --- CONFIGURATEUR 3D ---
function Configurator3DMockup() {
  return (
    <div className="flex h-[320px] sm:h-[380px] md:h-[420px]">
      {/* 3D Viewport */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Radial grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.3) 0%, transparent 60%)',
          }}
        />
        {/* Product representation - sneaker */}
        <div className="relative">
          <div className="w-56 sm:w-72 md:w-80 h-40 sm:h-48 md:h-56 rounded-3xl bg-gradient-to-br from-violet-600/20 via-purple-500/10 to-transparent border border-violet-500/10 flex items-center justify-center">
            {/* Shoe silhouette */}
            <svg viewBox="0 0 300 180" className="w-48 sm:w-60 md:w-68 opacity-80">
              <defs>
                <linearGradient id="shoeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
              <path d="M40,120 C40,90 60,60 100,55 C130,51 160,55 180,50 C200,45 230,40 260,60 C275,70 280,90 270,110 C265,120 250,130 230,135 L50,135 C45,135 40,130 40,120 Z" fill="url(#shoeGrad)" opacity="0.6" />
              <path d="M40,125 L270,125 C275,125 278,128 278,131 L278,140 C278,143 275,146 272,146 L48,146 C45,146 42,143 42,140 L42,131 C42,128 44,125 47,125 Z" fill="#4c1d95" opacity="0.4" />
              <circle cx="90" cy="90" r="4" fill="#c4b5fd" opacity="0.6" />
              <circle cx="110" cy="82" r="4" fill="#c4b5fd" opacity="0.6" />
              <circle cx="130" cy="78" r="4" fill="#c4b5fd" opacity="0.6" />
            </svg>
          </div>
          {/* 3D rotate indicator */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
            <RotateCw className="w-3 h-3 text-violet-400 animate-spin-slow" style={{ animationDuration: '8s' }} />
            <span className="text-[10px] text-violet-300/80 font-medium">360° rotation</span>
          </div>
        </div>
      </div>

      {/* Right config panel */}
      <div className="w-52 sm:w-60 bg-white/[0.02] border-l border-white/[0.04] p-4 space-y-4 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/30">Configuration</div>

        {/* Couleur */}
        <div>
          <div className="text-xs text-white/50 mb-2">Couleur</div>
          <div className="flex gap-2">
            {[
              { c: 'bg-violet-500', active: true },
              { c: 'bg-indigo-500', active: false },
              { c: 'bg-rose-500', active: false },
              { c: 'bg-emerald-500', active: false },
              { c: 'bg-white', active: false },
            ].map(({ c, active }, i) => (
              <div
                key={i}
                className={`w-7 h-7 rounded-full ${c} cursor-pointer transition-transform hover:scale-110 ${
                  active ? 'ring-2 ring-violet-400 ring-offset-2 ring-offset-[#08080f] scale-110' : ''
                }`}
              />
            ))}
          </div>
        </div>

        {/* Materiau */}
        <div>
          <div className="text-xs text-white/50 mb-2">Materiau</div>
          <div className="space-y-1.5">
            {[
              { name: 'Cuir premium', icon: Droplets, active: true },
              { name: 'Suede', icon: Layers, active: false },
              { name: 'Mesh respirant', icon: Sun, active: false },
            ].map((mat, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                  mat.active
                    ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                    : 'text-white/40 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <mat.icon className="w-3.5 h-3.5" />
                <span>{mat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Taille */}
        <div>
          <div className="text-xs text-white/50 mb-2">Taille</div>
          <div className="flex gap-1.5 flex-wrap">
            {['38', '39', '40', '41', '42', '43'].map((s, i) => (
              <div
                key={s}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs cursor-pointer transition-all ${
                  i === 3
                    ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                    : 'bg-white/[0.03] text-white/40 border border-white/[0.04] hover:border-white/[0.08]'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- VIRTUAL TRY-ON ---
function VirtualTryOnMockup() {
  return (
    <div className="relative h-[320px] sm:h-[380px] md:h-[420px] flex items-center justify-center overflow-hidden">
      {/* Camera feed background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-[#08080f] to-pink-900/10" />

      {/* Face silhouette with tracking points */}
      <div className="relative w-48 sm:w-56 md:w-64 h-56 sm:h-64 md:h-72">
        {/* Face oval */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 sm:w-40 md:w-44 h-44 sm:h-52 md:h-56 rounded-[50%] border border-purple-500/20 bg-gradient-to-b from-purple-500/[0.04] to-transparent" />
        </div>

        {/* Tracking points grid */}
        <div className="absolute inset-0">
          {Array.from({ length: 24 }, (_, i) => {
            const angle = (i / 24) * Math.PI * 2;
            const rx = 38 + (i % 3) * 5;
            const ry = 42 + (i % 4) * 3;
            const x = 50 + Math.cos(angle) * rx;
            const y = 48 + Math.sin(angle) * ry;
            return (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-purple-400/40"
                style={{ left: `${x}%`, top: `${y}%` }}
              />
            );
          })}
        </div>

        {/* Glasses overlay */}
        <div className="absolute top-[28%] left-1/2 -translate-x-1/2 flex items-center gap-0">
          <div className="w-12 sm:w-14 h-8 sm:h-10 rounded-lg border-2 border-pink-500/60 bg-pink-500/10 backdrop-blur-sm" />
          <div className="w-3 h-0.5 bg-pink-500/40" />
          <div className="w-12 sm:w-14 h-8 sm:h-10 rounded-lg border-2 border-pink-500/60 bg-pink-500/10 backdrop-blur-sm" />
        </div>

        {/* Scanning line */}
        <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent animate-scan-pulse" style={{ top: '40%' }} />
      </div>

      {/* HUD overlays */}
      <div className="absolute top-4 left-4 space-y-2">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/15 backdrop-blur-sm">
          <Camera className="w-3 h-3 text-purple-400" />
          <span className="text-[10px] text-purple-300 font-medium">Camera active</span>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/15 backdrop-blur-sm">
          <Scan className="w-3 h-3 text-green-400" />
          <span className="text-[10px] text-green-300 font-medium">468 points detectes</span>
        </div>
      </div>

      <div className="absolute top-4 right-4">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm">
          <Smartphone className="w-3 h-3 text-white/40" />
          <span className="text-[10px] text-white/40 font-medium">Live AR</span>
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        </div>
      </div>

      {/* Bottom bar - Product info */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-md">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/15 flex items-center justify-center">
          <Glasses className="w-5 h-5 text-pink-400" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-white/80">Ray-Ban Wayfarer</div>
          <div className="text-[10px] text-white/40">Noir classique — 149 EUR</div>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
          <span className="text-[10px] text-green-400 font-medium">Compatible</span>
        </div>
      </div>
    </div>
  );
}

// --- ANALYTICS ---
function AnalyticsMockup() {
  const bars = useMemo(() => [35, 52, 43, 67, 58, 72, 64, 85, 78, 91, 83, 95], []);

  return (
    <div className="h-[320px] sm:h-[380px] md:h-[420px] p-4 sm:p-5 overflow-hidden">
      {/* Top metrics */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Conversions', value: '+35.2%', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Visiteurs', value: '24.8K', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Commandes', value: '1,847', icon: ShoppingCart, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Revenue', value: '€84.2K', icon: ArrowUpRight, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
        ].map((m, i) => (
          <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-1.5 mb-2">
              <div className={`w-6 h-6 rounded-md ${m.bg} flex items-center justify-center`}>
                <m.icon className={`w-3 h-3 ${m.color}`} />
              </div>
            </div>
            <div className="text-sm sm:text-base font-bold text-white">{m.value}</div>
            <div className="text-[10px] text-white/30">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="flex-1 rounded-xl bg-white/[0.01] border border-white/[0.04] p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-semibold text-white/70">Performance mensuelle</div>
            <div className="text-[10px] text-white/30">Derniers 12 mois</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-[10px] text-white/40">Conversions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-500/50" />
              <span className="text-[10px] text-white/40">Visiteurs</span>
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-1.5 h-28 sm:h-36 md:h-44">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-indigo-600/60 to-indigo-400/40 transition-all duration-700"
                style={{ height: `${h}%`, transitionDelay: `${i * 50}ms` }}
              />
              {/* Secondary bar */}
              <div
                className="w-full rounded-t-sm bg-violet-500/20 -mt-1"
                style={{ height: `${h * 0.4}%` }}
              />
            </div>
          ))}
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 px-0.5">
          {['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
            <span key={m} className="text-[8px] sm:text-[9px] text-white/20">{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN SHOWCASE COMPONENT
// =============================================================================

const MOCKUPS = [DesignStudioMockup, Configurator3DMockup, VirtualTryOnMockup, AnalyticsMockup];

export function ProductShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const [prevTab, setPrevTab] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-rotate tabs
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % TABS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = useCallback((idx: number) => {
    if (idx === activeTab || isTransitioning) return;
    setPrevTab(activeTab);
    setIsTransitioning(true);
    setActiveTab(idx);
    setTimeout(() => setIsTransitioning(false), 600);
  }, [activeTab, isTransitioning]);

  const ActiveMockup = MOCKUPS[activeTab];
  const direction = activeTab > prevTab ? 1 : -1;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Tab navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Active tab description */}
      <div className="text-center mb-6">
        <p className="text-sm text-white/40 transition-all duration-300">{TABS[activeTab].description}</p>
      </div>

      {/* Browser mockup with cinematic transition */}
      <div className="relative group" style={{ perspective: '1200px' }}>
        <BrowserFrame url={`app.luneo.io/${TABS[activeTab].id}`} accentColor={TABS[activeTab].accentColor}>
          <div
            className="relative transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              transform: isTransitioning
                ? `rotateY(${direction * -2}deg) scale(0.97) translateX(${direction * -20}px)`
                : 'rotateY(0) scale(1) translateX(0)',
              opacity: isTransitioning ? 0.3 : 1,
              filter: isTransitioning ? 'blur(4px)' : 'blur(0)',
              transformOrigin: direction > 0 ? 'left center' : 'right center',
            }}
          >
            <ActiveMockup />
          </div>
        </BrowserFrame>

        {/* Ambient glow behind the mockup */}
        <div
          className={`absolute inset-0 -z-10 rounded-2xl blur-[80px] opacity-[0.12] bg-gradient-to-br ${TABS[activeTab].gradient} transition-all duration-1000`}
        />

        {/* Reflection below */}
        <div
          className="absolute -bottom-8 left-[5%] right-[5%] h-16 rounded-full opacity-[0.06] blur-2xl transition-colors duration-1000"
          style={{ background: TABS[activeTab].accentColor }}
        />
      </div>
    </div>
  );
}
