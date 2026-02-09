'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function LuxuryAIPageContent() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white py-4 sm:py-6 md:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Link href="/ai-studio">
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10 text-white/80 hover:bg-white/[0.04]">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
              Luxury AI Generation
            </h1>
            <p className="text-sm sm:text-base text-white/60">
              Génération IA spécialisée luxe
            </p>
          </div>
        </div>
        <div className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm text-center py-8 sm:py-12 px-4 rounded-2xl">
          <p className="text-sm sm:text-base text-white/60">Feature en développement</p>
        </div>
      </div>
    </div>
  );
}

const MemoizedLuxuryAIPageContent = memo(LuxuryAIPageContent);

export default function LuxuryAIPage() {
  return (
    <ErrorBoundary level="page" componentName="LuxuryAIPage">
      <MemoizedLuxuryAIPageContent />
    </ErrorBoundary>
  );
}
