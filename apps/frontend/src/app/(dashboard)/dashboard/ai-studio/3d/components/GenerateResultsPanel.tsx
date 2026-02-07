'use client';

import { Search, Sparkles, Grid, List, Box, Loader2 } from 'lucide-react';
import { LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ModelCard } from './ModelCard';
import type { AIStudioTab } from './types';
import type { GeneratedModel } from './types';

interface GenerateResultsPanelProps {
  filteredModels: GeneratedModel[];
  isGenerating: boolean;
  generationProgress: number;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterCategory: string;
  setFilterCategory: (v: string) => void;
  filterComplexity: string;
  setFilterComplexity: (v: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid' | 'list') => void;
  setActiveTab: (tab: AIStudioTab) => void;
  formatRelativeTimeFn: (ts: number) => string;
  onPreview: (model: GeneratedModel) => void;
  onToggleFavorite: (id: string) => void;
  onViewDetails: (model: GeneratedModel) => void;
  onExport: () => void;
}

export function GenerateResultsPanel({
  filteredModels,
  isGenerating,
  generationProgress,
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
  filterComplexity,
  setFilterComplexity,
  viewMode,
  setViewMode,
  setActiveTab,
  formatRelativeTimeFn,
  onPreview,
  onToggleFavorite,
  onViewDetails,
  onExport,
}: GenerateResultsPanelProps) {
  const hasModels = filteredModels.length > 0;

  return (
    <div className="lg:col-span-2 space-y-6">
      {!hasModels && !isGenerating ? (
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-4">
              <Box className="w-12 h-12 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Aucun modèle généré</h3>
            <p className="text-slate-400 text-center max-w-md mb-4">
              Configurez vos paramètres et cliquez sur &quot;Générer le modèle 3D&quot; pour créer votre premier
              modèle
            </p>
            <Button variant="outline" onClick={() => setActiveTab('templates')} className="border-slate-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Voir les templates
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {isGenerating && (
            <Card className="bg-slate-900/50 border-slate-700">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mb-4" />
                <p className="text-slate-400 mb-2">Génération 3D en cours...</p>
                <Progress value={generationProgress} className="w-full max-w-md" />
                <p className="text-sm text-slate-500 mt-2">{generationProgress}%</p>
              </CardContent>
            </Card>
          )}
          {hasModels && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Rechercher..."
                    className="pl-10 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="product">Produit</SelectItem>
                    <SelectItem value="furniture">Mobilier</SelectItem>
                    <SelectItem value="jewelry">Bijoux</SelectItem>
                    <SelectItem value="electronics">Électronique</SelectItem>
                    <SelectItem value="fashion">Mode</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterComplexity} onValueChange={setFilterComplexity}>
                  <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Complexité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="low">Simple</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-1 border border-slate-700 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={viewMode === 'grid' ? 'bg-slate-700' : ''}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' ? 'bg-slate-700' : ''}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          {viewMode === 'grid' && hasModels && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredModels.map((model, index) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    variant="grid"
                    formatRelativeTimeFn={formatRelativeTimeFn}
                    onPreview={onPreview}
                    onToggleFavorite={onToggleFavorite}
                    onViewDetails={onViewDetails}
                    onExport={onExport}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
          {viewMode === 'list' && hasModels && (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredModels.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    variant="list"
                    formatRelativeTimeFn={formatRelativeTimeFn}
                    onPreview={onPreview}
                    onToggleFavorite={onToggleFavorite}
                    onViewDetails={onViewDetails}
                    onExport={onExport}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}
