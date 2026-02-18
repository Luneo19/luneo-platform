'use client';

import { useState } from 'react';
import { Image, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useClipart } from '@/hooks/customizer/useClipart';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * ClipartPanel - Clipart browser panel
 */
export function ClipartPanel() {
  const { toast } = useToast();
  const { categories, cliparts, isLoading, isLoadingClipart, fetchByCategory, addClipartToCanvas } = useClipart();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    fetchByCategory(categoryId);
  };

  const handleClipartClick = async (url: string) => {
    try {
      await addClipartToCanvas(url);
      toast({
        title: 'Clipart added',
        description: 'Clipart has been added to the canvas',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add clipart',
        variant: 'destructive',
      });
    }
  };

  const filteredCliparts = cliparts.filter((clipart) =>
    clipart.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          <CardTitle>Clipart</CardTitle>
        </div>
        <CardDescription>Browse clipart library</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clipart..."
              className="pl-8"
            />
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="space-y-2">
            <Label>Categories</Label>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant={selectedCategoryId === category.id ? 'default' : 'outline'}
                    className="cursor-pointer whitespace-nowrap"
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    {category.name}
                    {category.count !== undefined && (
                      <span className="ml-1 text-xs">({category.count})</span>
                    )}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Clipart Grid */}
        <ScrollArea className="h-[calc(100vh-300px)]">
          {isLoading || isLoadingClipart ? (
            <div className="grid grid-cols-3 gap-2">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded border bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : filteredCliparts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Image className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {selectedCategoryId ? 'No clipart found in this category' : 'Select a category to browse clipart'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filteredCliparts.map((clipart) => (
                <button
                  key={clipart.id}
                  onClick={() => handleClipartClick(clipart.url)}
                  className="group relative aspect-square rounded border overflow-hidden hover:border-primary transition-colors"
                >
                  {clipart.thumbnail ? (
                    <img
                      src={clipart.thumbnail}
                      alt={clipart.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/50 text-white text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {clipart.name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
