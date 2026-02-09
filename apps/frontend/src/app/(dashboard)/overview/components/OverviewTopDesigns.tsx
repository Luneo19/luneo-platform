'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Award, ChevronRight, Eye, Layers, Sparkles, TrendingUp } from 'lucide-react';

export type TopDesignItem = {
  id: string;
  title: string;
  image: string;
  views: number;
  likes: number;
  created_at: string;
};

export function OverviewTopDesigns({ designs }: { designs: TopDesignItem[] }) {
  return (
    <div className="dash-card rounded-2xl p-5 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Top Designs
        </h2>
        <Link href="/dashboard/library">
          <Button variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/[0.04]">
            Voir tout
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
      <div className="space-y-3">
        {designs.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-white/[0.04] rounded-full flex items-center justify-center mx-auto mb-3 border border-white/[0.06]">
              <Layers className="w-6 h-6 text-white/30" />
            </div>
            <p className="text-white/60 text-sm">Aucun design encore</p>
            <p className="text-xs text-white/30 mt-1">Créez votre premier chef-d&apos;œuvre</p>
          </div>
        ) : (
          designs.slice(0, 4).map((design, index) => (
            <motion.div
              key={design.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 bg-white/[0.04] rounded-full flex items-center justify-center text-xs font-bold text-white/40 border border-white/[0.06]">
                {index + 1}
              </div>
              {design.image ? (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={design.image}
                    alt={design.title}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/[0.06]">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{design.title}</p>
                <div className="flex items-center gap-3 text-xs text-white/30">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {design.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {design.likes}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
