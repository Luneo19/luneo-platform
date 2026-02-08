/**
 * Client Component pour la page Templates
 */

'use client';

import { useState, useMemo } from 'react';
import { Search, Grid, List, Eye, Download, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTemplates } from '@/lib/hooks/useTemplates';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';
import Image from 'next/image';

interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail_url?: string;
  preview_url?: string;
  description?: string;
  tags?: string[];
  is_featured?: boolean;
}

const CATEGORIES = [
  { value: 'all', label: 'Tous' },
  { value: 'business', label: 'Business' },
  { value: 'social', label: 'Social' },
  { value: 'print', label: 'Print' },
  { value: 'web', label: 'Web' },
  { value: 'branding', label: 'Branding' },
];

export function TemplatesPageClient() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { templates, isLoading, error } = useTemplates({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: searchQuery || undefined,
    limit: 50,
  });

  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    return templates.filter((template: Template) => {
      const matchesSearch =
        !searchQuery ||
        template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  const handlePreview = (template: Template) => {
    const url = template.preview_url || template.thumbnail_url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: 'Prévisualisation',
        description: `Aucune prévisualisation disponible pour ${template.name}`,
      });
    }
  };

  const handleDownload = async (template: Template) => {
    try {
      const blob = await api.get<Blob>(`/api/v1/templates/${template.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name || 'template'}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: 'Téléchargement',
        description: `${template.name} a été téléchargé`,
      });
    } catch (error: unknown) {
      logger.error('Error downloading template', { error });
      toast({
        title: 'Erreur',
        description: 'Erreur lors du téléchargement',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Chargement des templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-red-400 mb-4">Erreur lors du chargement des templates</p>
          <Button onClick={() => window.location.reload()}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Templates</h1>
          <p className="text-gray-400">
            Choisissez parmi notre collection de templates professionnels
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Rechercher un template..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category.value)}
                className="capitalize"
              >
                {category.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-gray-400">
              {filteredTemplates.length} template{filteredTemplates.length > 1 ? 's' : ''} trouvé
              {filteredTemplates.length > 1 ? 's' : ''}
            </p>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger value="grid" className="data-[state=active]:bg-gray-700">
                  <Grid className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-gray-700">
                  <List className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Templates Grid/List */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Aucun template trouvé</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template: Template) => (
              <Card
                key={template.id}
                className="bg-gray-800 border-gray-700 overflow-hidden hover:border-cyan-500 transition-colors group"
              >
                <div className="aspect-video bg-gray-700 relative overflow-hidden">
                  {template.thumbnail_url || template.preview_url ? (
                    <Image
                      src={template.thumbnail_url || template.preview_url || ''}
                      alt={template.name || 'Template'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                  {template.is_featured && (
                    <Badge className="absolute top-2 right-2 bg-yellow-500/90 text-yellow-900">
                      Featured
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="text-white font-semibold mb-1 truncate">{template.name}</h3>
                  {template.description && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{template.description}</p>
                  )}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs border-gray-600 text-gray-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => handlePreview(template)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Prévisualiser
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownload(template)}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTemplates.map((template: Template) => (
              <Card
                key={template.id}
                className="bg-gray-800 border-gray-700 p-4 hover:border-cyan-500 transition-colors"
              >
                <div className="flex gap-4">
                  <div className="w-32 h-20 bg-gray-700 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {template.thumbnail_url || template.preview_url ? (
                      <Image
                        src={template.thumbnail_url || template.preview_url || ''}
                        alt={template.name || 'Template'}
                        width={128}
                        height={80}
                        className="object-cover"
                      />
                    ) : (
                      <Sparkles className="w-8 h-8 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-semibold mb-1">{template.name}</h3>
                        {template.description && (
                          <p className="text-gray-400 text-sm mb-2">{template.description}</p>
                        )}
                      </div>
                      {template.is_featured && (
                        <Badge className="bg-yellow-500/90 text-yellow-900">Featured</Badge>
                      )}
                    </div>
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs border-gray-600 text-gray-300">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handlePreview(template)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Prévisualiser
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownload(template)}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



