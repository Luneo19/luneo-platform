'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Grid3x3, List, Trash2, Search, Image as ImageIcon, FileText, Shapes } from 'lucide-react';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';
import Image from 'next/image';

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'clipart' | 'font';
  category?: string;
  url: string;
  thumbnail?: string;
  dimensions?: { width: number; height: number };
  size?: number;
  usageCount?: number;
}

interface AssetsLibraryProps {
  customizerId: string;
  onAssetSelect?: (asset: Asset) => void;
}

export function AssetsLibrary({ customizerId, onAssetSelect }: AssetsLibraryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const filteredAssets = assets.filter((asset) => {
    const matchesType = typeFilter === 'all' || asset.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesCategory && matchesSearch;
  });

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    try {
      const result = await api.post<Asset[]>(
        `/api/v1/visual-customizer/customizers/${customizerId}/assets`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      setAssets((prev) => [...prev, ...result]);
    } catch (err) {
      logger.error('Failed to upload assets', { error: err });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} asset(s)?`)) return;

    try {
      await api.delete(`/api/v1/visual-customizer/customizers/${customizerId}/assets`, {
        data: { ids: Array.from(selectedIds) },
      });
      setAssets((prev) => prev.filter((a) => !selectedIds.has(a.id)));
      setSelectedIds(new Set());
    } catch (err) {
      logger.error('Failed to delete assets', { error: err });
    }
  };

  const handleToggleSelect = (assetId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedIds(newSelected);
  };

  return (
    <div className="flex h-full gap-4">
      {/* Main Content */}
      <div className="flex-1 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="clipart">Clipart</SelectItem>
                <SelectItem value="font">Fonts</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({selectedIds.size})
              </Button>
            )}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <input
                type="file"
                id="asset-upload"
                multiple
                accept="image/*,.ttf,.otf,.woff,.woff2"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
              <Button asChild size="sm">
                <label htmlFor="asset-upload" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </label>
              </Button>
            </div>
          </div>
        </div>

        {/* Assets Display */}
        <ScrollArea className="h-[calc(100vh-200px)]">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredAssets.map((asset) => (
                <Card
                  key={asset.id}
                  className={`cursor-pointer transition-all ${
                    selectedIds.has(asset.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    handleToggleSelect(asset.id);
                    setSelectedAsset(asset);
                  }}
                >
                  <CardContent className="p-3">
                    <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center overflow-hidden relative">
                      {asset.type === 'image' && asset.thumbnail && (
                        <Image width={200} height={200}
                          src={asset.thumbnail}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        unoptimized />
                      )}
                      {asset.type === 'font' && (
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      )}
                      {asset.type === 'clipart' && (
                        <Shapes className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div className="absolute top-2 left-2">
                        <Checkbox checked={selectedIds.has(asset.id)} />
                      </div>
                    </div>
                    <div className="text-sm font-medium truncate">{asset.name}</div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Badge variant="outline">{asset.type}</Badge>
                      {asset.dimensions && (
                        <span>
                          {asset.dimensions.width} × {asset.dimensions.height}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssets.map((asset) => (
                <Card
                  key={asset.id}
                  className={`cursor-pointer transition-all ${
                    selectedIds.has(asset.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    handleToggleSelect(asset.id);
                    setSelectedAsset(asset);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Checkbox checked={selectedIds.has(asset.id)} />
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        {asset.type === 'image' && asset.thumbnail ? (
                          <Image width={200} height={200}
                            src={asset.thumbnail}
                            alt={asset.name}
                            className="w-full h-full object-cover rounded"
                          unoptimized />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{asset.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {asset.type} • {asset.category || 'Uncategorized'}
                          {asset.dimensions &&
                            ` • ${asset.dimensions.width} × ${asset.dimensions.height}`}
                          {asset.usageCount !== undefined && ` • Used ${asset.usageCount} times`}
                        </div>
                      </div>
                      <Badge variant="outline">{asset.type}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {filteredAssets.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No assets found. Upload your first asset to get started.
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Asset Detail Panel */}
      {selectedAsset && (
        <Card className="w-80">
          <CardContent className="p-4 space-y-4">
            <div>
              <h3 className="font-medium mb-2">{selectedAsset.name}</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Type: {selectedAsset.type}</div>
                {selectedAsset.category && <div>Category: {selectedAsset.category}</div>}
                {selectedAsset.dimensions && (
                  <div>
                    Dimensions: {selectedAsset.dimensions.width} ×{' '}
                    {selectedAsset.dimensions.height}
                  </div>
                )}
                {selectedAsset.size && (
                  <div>Size: {(selectedAsset.size / 1024).toFixed(2)} KB</div>
                )}
                {selectedAsset.usageCount !== undefined && (
                  <div>Usage: {selectedAsset.usageCount} times</div>
                )}
              </div>
            </div>
            {selectedAsset.type === 'image' && (
              <div className="aspect-video bg-muted rounded overflow-hidden">
                <Image width={200} height={200}
                  src={selectedAsset.url}
                  alt={selectedAsset.name}
                  className="w-full h-full object-contain"
                unoptimized />
              </div>
            )}
            <Button
              className="w-full"
              onClick={() => {
                onAssetSelect?.(selectedAsset);
              }}
            >
              Use Asset
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
