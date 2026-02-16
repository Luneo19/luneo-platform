'use client';

import { Store, Sparkles, Share2, Star } from 'lucide-react';

const FEATURES = [
  { icon: Sparkles, label: 'Browse templates', description: 'Parcourez des templates de prompts optimisés par la communauté' },
  { icon: Share2, label: 'Share your creations', description: 'Publiez vos meilleurs prompts et gagnez en visibilité' },
  { icon: Star, label: 'Community ratings', description: 'Notez et découvrez les templates les plus populaires' },
];

export function MarketplacePageClient() {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        {/* Illustration / icon */}
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mb-6">
          <Store className="w-12 h-12 text-indigo-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">AI Templates Marketplace</h1>
        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-6">
          Coming Soon
        </span>

        <p className="text-white/60 max-w-md mb-10">
          Découvrez et partagez des templates de prompts optimisés par la communauté
        </p>

        {/* Features preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          {FEATURES.map(({ icon: Icon, label, description }) => (
            <div
              key={label}
              className="dash-card rounded-2xl p-4 border border-white/[0.06] bg-white/[0.03] text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-white font-medium text-sm mb-1">{label}</p>
              <p className="text-white/50 text-xs">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
