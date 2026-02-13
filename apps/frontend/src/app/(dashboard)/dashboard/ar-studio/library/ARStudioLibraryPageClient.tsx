/**
 * Client Component pour AR Studio Library
 * Version professionnelle simplifiée
 */

'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { useToast } from '@/hooks/use-toast';
import { ARLibraryHeader } from './components/ARLibraryHeader';
import { ARLibraryStats } from './components/ARLibraryStats';
import { ARModelsGrid } from './components/ARModelsGrid';
import { useARLibrary } from './hooks/useARLibrary';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, SortAsc } from 'lucide-react';
import type { ARModel } from './types';

export function ARStudioLibraryPageClient() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');
  const [selectedModel, setSelectedModel] = useState<ARModel | null>(null);

  const { models, stats, isLoading, toggleFavorite, deleteModel } = useARLibrary(
    searchTerm,
    filterType,
    filterStatus,
    sortBy
  );

  const handleView = (model: ARModel) => {
    setSelectedModel(model);
    toast({
      title: t('aiStudio.details'),
      description: `"${model.name}"`,
    });
  };

  const handleToggleFavorite = async (modelId: string) => {
    await toggleFavorite(modelId);
  };

  const handleDelete = async (modelId: string) => {
    if (confirm(t('arStudio.deleteConfirm'))) {
      await deleteModel(modelId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-16 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <ARLibraryHeader onUpload={() => toast({ title: t('common.comingSoon') })} />
      <ARLibraryStats stats={stats} />

      <Card className="p-4 bg-gray-800/50 border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher un modèle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-900 border-gray-600 text-white pl-10"
              />
            </div>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48 bg-gray-900 border-gray-600 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="glasses">Lunettes</SelectItem>
              <SelectItem value="watch">Montres</SelectItem>
              <SelectItem value="jewelry">Bijoux</SelectItem>
              <SelectItem value="furniture">Mobilier</SelectItem>
              <SelectItem value="clothing">Vêtements</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48 bg-gray-900 border-gray-600 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="archived">Archivé</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48 bg-gray-900 border-gray-600 text-white">
              <SortAsc className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('common.sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Nom</SelectItem>
              <SelectItem value="views">Vues</SelectItem>
              <SelectItem value="downloads">Téléchargements</SelectItem>
              <SelectItem value="size">Taille</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 text-sm text-gray-400">
          {models.length} modèle{models.length > 1 ? 's' : ''} trouvé{models.length > 1 ? 's' : ''}
        </div>
      </Card>

      <ARModelsGrid
        models={models}
        onView={handleView}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDelete}
      />
    </div>
  );
}



