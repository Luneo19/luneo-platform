'use client';

import Image from 'next/image';
import { Box, CheckCircle, Download, Eye, Filter, Folder, Heart, Layers, Share2, Sparkles, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { AIStudioTab } from './types';
import type { GeneratedModel } from './types';
import { formatRelativeTime } from './utils';

interface HistoryTabProps {
  history: GeneratedModel[];
  filterCategory: string;
  setFilterCategory: (v: string) => void;
  filterComplexity: string;
  setFilterComplexity: (v: string) => void;
  setActiveTab: (tab: AIStudioTab) => void;
  onPreview: (model: GeneratedModel) => void;
  onToggleFavorite: (id: string) => void;
  onExport: () => void;
  formatRelativeTimeFn: (ts: number) => string;
}

export function HistoryTab({
  history,
  filterCategory,
  setFilterCategory,
  filterComplexity,
  setFilterComplexity,
  setActiveTab,
  onPreview,
  onToggleFavorite,
  onExport,
  formatRelativeTimeFn,
}: HistoryTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Historique des générations</h3>
          <p className="text-sm text-gray-600">Toutes vos créations 3D</p>
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px] bg-white border-gray-200 text-gray-900">
            <SelectValue placeholder="Filtrer par catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            <SelectItem value="product">Produit</SelectItem>
            <SelectItem value="furniture">Mobilier</SelectItem>
            <SelectItem value="jewelry">Bijoux</SelectItem>
            <SelectItem value="electronics">Électronique</SelectItem>
            <SelectItem value="fashion">Mode</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {history.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Box className="w-16 h-16 text-slate-500 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Aucune génération</h3>
            <p className="text-slate-400 text-center mb-4">
              Votre historique de générations 3D apparaîtra ici
            </p>
            <Button onClick={() => setActiveTab('generate')} className="bg-cyan-600 hover:bg-cyan-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Créer votre première génération
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((model) => {
            const ts = typeof model.createdAt === 'number' ? model.createdAt : new Date(model.createdAt).getTime();
            return (
              <Card
                key={model.id}
                className="bg-slate-900/50 border-slate-700 overflow-hidden hover:border-cyan-500/50 transition-all group"
              >
                <div className="relative aspect-square">
                  <Image
                    src={model.thumbnail}
                    alt={model.prompt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onPreview(model)} className="text-white hover:bg-white/20">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleFavorite(model.id)}
                      className={cn('text-white hover:bg-white/20', model.isFavorite && 'text-pink-400')}
                    >
                      {model.isFavorite ? <Heart className="w-4 h-4 fill-current" /> : <Heart className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onExport} className="text-white hover:bg-white/20">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <Badge className="bg-cyan-500/80">
                      <Box className="w-3 h-3 mr-1" />
                      3D
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-white line-clamp-2 mb-2">{model.prompt}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <Badge variant="outline" className="border-slate-600">{model.category}</Badge>
                    <span>{formatRelativeTimeFn(ts)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total générations', value: history.length, icon: Box, color: 'cyan' },
          { label: 'Favoris', value: history.filter((m) => m.isFavorite).length, icon: Heart, color: 'pink' },
          { label: 'Crédits utilisés', value: history.reduce((sum, m) => sum + m.credits, 0), icon: Sparkles, color: 'purple' },
          { label: 'Taux de succès', value: '97.8%', icon: CheckCircle, color: 'green' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={cn('w-5 h-5', stat.color === 'cyan' && 'text-cyan-400', stat.color === 'pink' && 'text-pink-400', stat.color === 'purple' && 'text-purple-400', stat.color === 'green' && 'text-green-400')} />
                  <span className="text-xs text-gray-600">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres Avancés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-900">Période</Label>
              <Select defaultValue="all">
                <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-900">Complexité</Label>
              <Select value={filterComplexity} onValueChange={setFilterComplexity}>
                <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="low">Simple</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="ultra">Ultra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-900">Tri</Label>
              <Select defaultValue="newest">
                <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Plus récent</SelectItem>
                  <SelectItem value="oldest">Plus ancien</SelectItem>
                  <SelectItem value="name">Nom (A-Z)</SelectItem>
                  <SelectItem value="credits">Crédits (croissant)</SelectItem>
                  <SelectItem value="polycount">Polygones (décroissant)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Actions en Masse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="border-gray-200">
                <Download className="w-4 h-4 mr-2" />
                Exporter sélection
              </Button>
              <Button variant="outline" size="sm" className="border-gray-200">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer sélection
              </Button>
              <Button variant="outline" size="sm" className="border-gray-200">
                <Share2 className="w-4 h-4 mr-2" />
                Partager sélection
              </Button>
              <Button variant="outline" size="sm" className="border-gray-200">
                <Folder className="w-4 h-4 mr-2" />
                Déplacer vers collection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
