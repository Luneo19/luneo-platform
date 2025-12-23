// Root page - direct implementation to avoid routing issues
'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMarketingData } from '@/lib/hooks/useMarketingData';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRight,
    Award,
    BadgeCheck,
    Box,
    Check,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Download,
    Dumbbell,
    ExternalLink,
    Eye,
    FileCheck,
    Gem,
    Gift,
    Globe,
    Layers,
    Lock,
    MessageSquare,
    Minus,
    Package,
    Palette,
    Play,
    Rocket,
    Server,
    Share2,
    Shield,
    Shirt,
    ShoppingCart,
    Sofa,
    Sparkles,
    Star,
    TrendingUp,
    Upload,
    Users,
    UtensilsCrossed,
    X,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import React, { memo, useCallback, useMemo, useState } from 'react';

// Import the actual HomePage component from (public)/page
import HomePage from '@/app/(public)/page';

export default function RootPage() {
  // Structured data for SEO
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Luneo',
    url: 'https://app.luneo.app',
    logo: 'https://app.luneo.app/logo.png',
    description: 'Plateforme de personnalisation produits avec éditeur 2D/3D, Virtual Try-On AR, et export print-ready',
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Luneo Platform',
    url: 'https://app.luneo.app',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <ErrorBoundary level="page" componentName="RootPage">
        <HomePage />
      </ErrorBoundary>
    </>
  );
}
