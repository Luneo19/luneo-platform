'use client';

import { useState } from 'react';
import { useTemplates } from '@/lib/hooks/useTemplates';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, Heart, Star } from 'lucide-react';
import Image from 'next/image';

interface TemplateGalleryProps {
  onSelectTemplate?: (template: any) => void;
  category?: string;
  featured?: boolean;
}

export function TemplateGallery({ onSelectTemplate, category, featured }: TemplateGalleryProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category || '');
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { templates, total, isLoading } = useTemplates({
    search,
    category: selectedCategory || undefined,
    featured,
    limit,
    offset,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const categories = [
    'Business Cards',
    'T-Shirts',
    'Mugs',
    'Posters',
    'Flyers',
    'Invitations',
    'Labels',
    'Stickers',
  ];

  const handleLoadMore = () => {
    setOffset(prev => prev + limit);
  };

  if (isLoading && offset === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-48 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Catégories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('')}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Grille de templates */}
      {templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No templates found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="group cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onSelectTemplate?.(template)}
              >
                <CardHeader className="p-0">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
                    <Image
                      src={template.preview_url}
                      alt={template.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {template.is_featured && (
                      <Badge className="absolute top-2 right-2 bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {template.is_premium && (
                      <Badge className="absolute top-2 left-2 bg-purple-500">
                        Premium
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <CardTitle className="text-base mb-2">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {template.downloads_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {template.favorites_count}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => onSelectTemplate?.(template)}>
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Load More */}
          {offset + limit < total && (
            <div className="text-center pt-6">
              <Button onClick={handleLoadMore} variant="outline">
                Load More ({total - offset - limit} remaining)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

