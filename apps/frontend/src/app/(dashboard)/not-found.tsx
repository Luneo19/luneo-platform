'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function DashboardNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-8xl font-bold text-purple-500/20">404</div>
        <h1 className="text-2xl font-bold text-white">Page introuvable</h1>
        <p className="text-slate-400">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="border-white/10 text-slate-300 hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <Link href="/dashboard">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
