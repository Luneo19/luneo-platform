'use client';

import { useState } from 'react';
import { useCliparts } from '@/lib/hooks/useCliparts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, Heart, Star, Palette } from 'lucide-react';
import Image from 'next/image';

interface ClipartBrowserProps {
  onSelectClipart?: (clipart: any) => void;
  category?: string;
  featured?: boolean;
}

export function ClipartBrowser({ onSelectClipart, category, featured }: ClipartBrowserProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(category || '');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const { cliparts, total, isLoading } = useCliparts({
    search,
    category: selectedCategory || undefined,
    style: selectedStyle || undefined,
    featured,
    limit,
    offset,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const categories = [
    'Animals',
    'Food',
    'Nature',
    'Technology',
    'Business',
    'Holidays',
    'Sports',
    'Music',
    'Art',
    'Icons',
  ];

  const styles = [
    'Minimalist',
    'Vintage',
    'Modern',
    'Hand-drawn',
    'Geometric',
    'Watercolor',
    'Line Art',
    '3D',
  ];

  const handleLoadMore = () => {
    setOffset(prev => prev + limit);
  };

  if (isLoading && offset === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="p-2">
              <Skeleton className="h-24 w-full" />
            </CardHeader>
            <CardContent className="p-2">
              <Skeleton className="h-3 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="space-y-4">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cliparts..."
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

        {/* Styles */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedStyle === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStyle('')}
          >
            All Styles
          </Button>
          {styles.map((style) => (
            <Button
              key={style}
              variant={selectedStyle === style ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStyle(style)}
            >
              {style}
            </Button>
          ))}
        </div>
      </div>

      {/* Grille de cliparts */}
      {cliparts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No cliparts found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {cliparts.map((clipart) => (
              <Card
                key={clipart.id}
                className="group cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onSelectClipart?.(clipart)}
              >
                <CardHeader className="p-2">
                  <div className="relative aspect-square overflow-hidden rounded">
                    <Image
                      src={clipart.preview_url}
                      alt={clipart.name}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    {clipart.is_featured && (
                      <Badge className="absolute top-1 right-1 bg-yellow-500 text-xs">
                        <Star className="h-2 w-2 mr-1" />
                      </Badge>
                    )}
                    {clipart.is_premium && (
                      <Badge className="absolute top-1 left-1 bg-purple-500 text-xs">
                        Pro
                      </Badge>
                    )}
                    {clipart.is_colorizable && (
                      <Badge className="absolute bottom-1 right-1 bg-blue-500 text-xs">
                        <Palette className="h-2 w-2" />
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                  <CardTitle className="text-xs mb-1 line-clamp-1">
                    {clipart.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Download className="h-2 w-2" />
                      {clipart.downloads_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-2 w-2" />
                      {clipart.favorites_count}
                    </span>
                  </div>
                </CardContent>
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
