'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Check, DollarSign, Info, Package, AlertCircle } from 'lucide-react';
import { LazyImage } from '@/components/optimized/LazyImage';

interface Part {
  id: string;
  name: string;
  categoryId: string;
  thumbnail: string;
  price?: number;
  description?: string;
  available: boolean;
  tags?: string[];
}

interface PartCategory {
  id: string;
  name: string;
  required: boolean;
  multipleSelection: boolean;
  parts: Part[];
}

interface PartSelectorProps {
  categories: PartCategory[];
  selectedParts: Map<string, string[]>;
  onPartSelect: (categoryId: string, partId: string) => void;
  onPartRemove: (categoryId: string, partId: string) => void;
  showPricing?: boolean;
  className?: string;
}

export default function PartSelector({
  categories,
  selectedParts,
  onPartSelect,
  onPartRemove,
  showPricing = true,
  className = '',
}: PartSelectorProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const activeCategoryData = categories.find(c => c.id === activeCategory);

  const filteredParts = activeCategoryData?.parts.filter((part) => {
    const matchesSearch = part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  }) || [];

  const isPartSelected = (categoryId: string, partId: string): boolean => {
    const categoryParts = selectedParts.get(categoryId) || [];
    return categoryParts.includes(partId);
  };

  const handlePartClick = (categoryId: string, partId: string, multipleSelection: boolean) => {
    const isSelected = isPartSelected(categoryId, partId);
    
    if (isSelected) {
      onPartRemove(categoryId, partId);
    } else {
      if (!multipleSelection) {
        const existing = selectedParts.get(categoryId) || [];
        if (existing.length > 0) {
          existing.forEach((existingPartId) => onPartRemove(categoryId, existingPartId));
        }
      }
      onPartSelect(categoryId, partId);
    }
  };

  const calculateTotalPrice = (): number => {
    let total = 0;
    
    for (const category of categories) {
      const categoryPartsIds = selectedParts.get(category.id) || [];
      
      for (const partId of categoryPartsIds) {
        const part = category.parts.find(p => p.id === partId);
        total += part?.price || 0;
      }
    }
    
    return total;
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Category Tabs */}
      <div className="mb-4">
        <Label className="text-sm font-semibold mb-2 block">Part Category</Label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const selectedCount = (selectedParts.get(category.id) || []).length;
            
            return (
              <Badge
                key={category.id}
                variant={activeCategory === category.id ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-gray-100 relative"
                onClick={() => setActiveCategory(category.id)}
              >
                <Package className="w-3 h-3 mr-1" />
                {category.name}
                {selectedCount > 0 && (
                  <span className="ml-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {selectedCount}
                  </span>
                )}
                {category.required && (
                  <AlertCircle className="w-3 h-3 ml-1 text-red-500" />
                )}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Search */}
      {activeCategoryData && (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search parts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Info */}
          <Card className="p-3 mb-4 bg-blue-50 border-blue-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-gray-900">{activeCategoryData.name}</h3>
                <p className="text-xs text-gray-600 mt-1">
                  {activeCategoryData.multipleSelection
                    ? 'Select multiple parts'
                    : 'Select one part'}
                  {activeCategoryData.required && (
                    <span className="text-red-600 ml-1">(Required)</span>
                  )}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {filteredParts.length} parts
              </Badge>
            </div>
          </Card>

          {/* Parts Grid */}
          <ScrollArea className="h-96">
            <div className="grid grid-cols-2 gap-3 pr-4">
              {filteredParts.map((part) => {
                const isSelected = isPartSelected(activeCategory, part.id);
                
                return (
                  <Card
                    key={part.id}
                    className={`relative overflow-hidden cursor-pointer transition-all ${
                      !part.available
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:shadow-lg'
                    } ${
                      isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''
                    }`}
                    onClick={() => {
                      if (part.available) {
                        handlePartClick(activeCategory, part.id, activeCategoryData.multipleSelection);
                      }
                    }}
                  >
                    {/* Part Thumbnail */}
                    <div className="relative w-full h-24 bg-gray-100">
                      <LazyImage
                        src={part.thumbnail}
                        alt={part.name}
                        className="absolute inset-0 h-full w-full object-cover"
                        fallback="/placeholder-part.png"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      {isSelected && (
                        <div className="absolute top-2 left-2 bg-blue-500 rounded-full p-1">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {!part.available && (
                        <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                          <span className="text-white text-xs font-medium">Out of Stock</span>
                        </div>
                      )}
                    </div>

                    {/* Part Info */}
                    <div className="p-3">
                      <h4 className="font-semibold text-sm text-gray-900 mb-1 truncate">
                        {part.name}
                      </h4>
                      
                      {showPricing && part.price !== undefined && (
                        <div className="flex items-center text-xs font-medium text-green-600 mb-2">
                          <DollarSign className="w-3 h-3" />
                          {part.price.toFixed(2)}
                        </div>
                      )}

                      {part.tags && part.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {part.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Description Toggle */}
                      {part.description && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2 text-xs h-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDetails(showDetails === part.id ? null : part.id);
                          }}
                        >
                          <Info className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                      )}

                      {showDetails === part.id && part.description && (
                        <p className="mt-2 text-xs text-gray-600 leading-relaxed border-t pt-2">
                          {part.description}
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>

          {filteredParts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">No parts found</p>
              <Button
                variant="link"
                onClick={() => setSearchTerm('')}
                className="mt-2"
              >
                Clear search
              </Button>
            </div>
          )}
        </>
      )}

      {/* Total Price */}
      {showPricing && (
        <Card className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Total Customization</span>
            <div className="flex items-center text-lg font-bold text-green-600">
              <DollarSign className="w-5 h-5" />
              {calculateTotalPrice().toFixed(2)}
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {Array.from(selectedParts.values()).reduce((sum, parts) => sum + parts.length, 0)} parts selected
          </p>
        </Card>
      )}
    </div>
  );
}
