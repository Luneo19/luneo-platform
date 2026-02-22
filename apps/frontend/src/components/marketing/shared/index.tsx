'use client';
import React from 'react';

export function PageHero({ title, subtitle, description, gradient, children }: { title: string; subtitle?: string; description?: string; gradient?: string; children?: React.ReactNode }) {
  return (
    <div className={`py-20 text-center ${gradient || ''}`}>
      <h1 className="text-4xl font-bold text-white">{title}</h1>
      {(subtitle || description) && <p className="mt-4 text-lg text-white/60 max-w-3xl mx-auto">{subtitle || description}</p>}
      {children}
    </div>
  );
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-12 text-center">
      <h2 className="text-3xl font-bold text-white">{title}</h2>
      {subtitle && <p className="mt-2 text-white/60">{subtitle}</p>}
    </div>
  );
}

export function FeatureCard({ title, description, icon }: { title: string; description: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      {icon && <div className="mb-4 text-3xl">{icon}</div>}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-white/50">{description}</p>
    </div>
  );
}
