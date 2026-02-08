'use client';

import { Button } from '@/components/ui/button';
import { Plus, Users, Wallet } from 'lucide-react';

interface AffiliateHeaderProps {
  onRequestPayout: () => void;
  onCreateLink: () => void;
  canRequestPayout: boolean;
}

export function AffiliateHeader({ onRequestPayout, onCreateLink, canRequestPayout }: AffiliateHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Users className="w-8 h-8 text-purple-400" />
          Programme d&apos;Affiliation
        </h1>
        <p className="text-gray-400 mt-1">Gagnez des commissions en parrainant de nouveaux utilisateurs</p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onRequestPayout} className="border-gray-600" disabled={!canRequestPayout}>
          <Wallet className="w-4 h-4 mr-2" />
          Demander un paiement
        </Button>
        <Button onClick={onCreateLink} className="bg-gradient-to-r from-purple-600 to-pink-600">
          <Plus className="w-4 h-4 mr-2" />
          Créer un lien
        </Button>
      </div>
    </div>
  );
}
