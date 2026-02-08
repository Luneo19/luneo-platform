/**
 * Header de la page Library
 */

'use client';

import { Book, Upload, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LibraryHeaderProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onUpload: () => void;
}

export function LibraryHeader({ viewMode, onViewModeChange, onUpload }: LibraryHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Book className="w-8 h-8 text-cyan-400" />
          Bibliothèque
        </h1>
        <p className="text-gray-600 mt-1">
          Gérez vos templates, designs et assets
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as 'grid' | 'list')}>
          <TabsList className="bg-gray-100 border-gray-200">
            <TabsTrigger value="grid" className="data-[state=active]:bg-white">
              <Grid className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:bg-white">
              <List className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={onUpload} className="bg-cyan-600 hover:bg-cyan-700">
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </div>
    </div>
  );
}



