'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExternalLink, HelpCircle, Users } from 'lucide-react';

export function OverviewHelpCard() {
  return (
    <div className="dash-card-glow rounded-2xl p-5 border border-purple-500/20 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/20">
          <HelpCircle className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="font-medium text-white">Besoin d&apos;aide ?</h3>
          <p className="text-xs text-white/40">Consultez notre documentation</p>
        </div>
      </div>
      <div className="space-y-2">
        <Link href="/docs">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] text-white"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Documentation
          </Button>
        </Link>
        <Link href="/contact">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] text-white"
          >
            <Users className="w-4 h-4 mr-2" />
            Contacter le support
          </Button>
        </Link>
      </div>
    </div>
  );
}
