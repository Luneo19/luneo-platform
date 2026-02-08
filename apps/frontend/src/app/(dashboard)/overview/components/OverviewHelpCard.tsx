'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExternalLink, HelpCircle, Users } from 'lucide-react';

export function OverviewHelpCard() {
  return (
    <Card className="p-5 bg-gradient-to-br from-cyan-950/50 to-blue-950/50 border-cyan-500/20">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="font-medium text-white">Besoin d&apos;aide ?</h3>
          <p className="text-xs text-slate-400">Consultez notre documentation</p>
        </div>
      </div>
      <div className="space-y-2">
        <Link href="/docs">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Documentation
          </Button>
        </Link>
        <Link href="/contact">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-white"
          >
            <Users className="w-4 h-4 mr-2" />
            Contacter le support
          </Button>
        </Link>
      </div>
    </Card>
  );
}
