/**
 * Client Component pour AI Studio Templates
 * Version professionnelle simplifiée
 */

'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TemplatesHeader } from './components/TemplatesHeader';
import { TemplatesGrid } from './components/TemplatesGrid';
import { useAITemplates } from './hooks/useAITemplates';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { TEMPLATE_CATEGORIES, SORT_OPTIONS } from './constants/templates';
import type { TemplateCategory } from './types';
import { logger } from '@/lib/logger';

export function AITemplatesPageClient() {
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const {
    templates,
    stats,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedType,
    setSelectedType,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    toggleFavorite,
  } = useAITemplates();

  const handlePreview = (template: any) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleDownload = (template: any) => {
    if (template.type === 'premium' && template.price) {
      toast({
        title: 'Template Premium',
        description: 'Ce template nécessite un achat',
      });
      return;
    }

    try {
      // Get template result URL (from template data or API)
      const downloadUrl = template.resultUrl || template.imageUrl || template.thumbnailUrl;
      
      if (!downloadUrl) {
        toast({
          title: 'Erreur',
          description: 'URL de téléchargement non disponible',
          variant: 'destructive',
        });
        return;
      }

      // Create temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${template.name || 'template'}-${Date.now()}.${downloadUrl.split('.').pop() || 'png'}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Téléchargement',
        description: `Téléchargement de "${template.name}" démarré`,
      });
    } catch (error: any) {
      logger.error('Failed to download template', { error, templateId: template.id });
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du téléchargement',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFavorite = async (templateId: string) => {
    const result = await toggleFavorite(templateId);
    if (result.success) {
      toast({
        title: 'Succès',
        description: 'Favori mis à jour',
      });
    }
  };

  const handleShare = (template: any) => {
    navigator.clipboard.writeText(`${window.location.origin}/ai-studio/templates/${template.id}`);
    toast({
      title: 'Lien copié',
      description: 'Lien du template copié dans le presse-papiers',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="dash-card h-16 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="dash-card h-64 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <TemplatesHeader viewMode={viewMode} onViewModeChange={setViewMode} />

      <Card className="dash-card p-4 border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Rechercher des templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="dash-input pl-10 border-white/[0.08] bg-white/[0.04] text-white placeholder:text-white/40"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Select
              value={selectedCategory}
              onValueChange={(v) => setSelectedCategory(v as TemplateCategory | 'all')}
            >
              <SelectTrigger className="dash-input w-48 border-white/[0.08] bg-white/[0.04] text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.map((cat) => {
                  const Icon = cat.icon as React.ComponentType<{ className?: string }>;
                  return (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="w-4 h-4" />}
                        {cat.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as string)}>
              <SelectTrigger className="dash-input w-40 border-white/[0.08] bg-white/[0.04] text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="free">Gratuits</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as string)}>
              <SelectTrigger className="dash-input w-40 border-white/[0.08] bg-white/[0.04] text-white">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3 text-sm text-white/40">
          {templates.length} template{templates.length > 1 ? 's' : ''} trouvé{templates.length > 1 ? 's' : ''}
        </div>
      </Card>

      <TemplatesGrid
        templates={templates}
        onPreview={handlePreview}
        onDownload={handleDownload}
        onToggleFavorite={handleToggleFavorite}
        onShare={handleShare}
      />
    </div>
  );
}



