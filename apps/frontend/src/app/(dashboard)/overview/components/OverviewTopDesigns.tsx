'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    <Card className="p-5 bg-slate-900/50 border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400" />
          Top Designs
        </h2>
        <Link href="/dashboard/library">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            Voir tout
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
      <div className="space-y-3">
        {designs.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm">Aucun design encore</p>
            <p className="text-xs text-slate-500 mt-1">Créez votre premier chef-d&apos;œuvre</p>
          </div>
        ) : (
          designs.slice(0, 4).map((design, index) => (
            <motion.div
              key={design.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-slate-400">
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
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{design.title}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
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
    </Card>
  );
}
