'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, Check, Star, Info } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  baseColor: string;
  roughness: number;
  metalness: number;
  price?: number;
  popular?: boolean;
  description?: string;
}

interface MaterialSelectorProps {
  materials: Material[];
  selectedMaterial?: string;
  onMaterialSelect: (materialId: string) => void;
  showPricing?: boolean;
  className?: string;
}

const MATERIAL_CATEGORIES = [
  { id: 'all', name: 'All Materials', icon: '🎨' },
  { id: 'leather', name: 'Leather', icon: '🧳' },
  { id: 'fabric', name: 'Fabric', icon: '🧵' },
  { id: 'metal', name: 'Metal', icon: '⚙️' },
  { id: 'plastic', name: 'Plastic', icon: '🔷' },
  { id: 'wood', name: 'Wood', icon: '🌳' },
  { id: 'glass', name: 'Glass', icon: '💎' },
  { id: 'special', name: 'Special', icon: '✨' },
];

export default function MaterialSelector({
  materials,
  selectedMaterial,
  onMaterialSelect,
  showPricing = true,
  className = '',
}: MaterialSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const popularMaterials = materials.filter(m => m.popular);

  return (
    <div className={`w-full ${className}`}>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search materials..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-4">
        {MATERIAL_CATEGORIES.map((category) => (
          <Badge
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-gray-100"
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className="mr-1">{category.icon}</span>
            {category.name}
          </Badge>
        ))}
      </div>

      {/* Popular Materials */}
      {!searchTerm && selectedCategory === 'all' && popularMaterials.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <Star className="w-4 h-4 text-yellow-500 mr-2" />
            <h3 className="text-sm font-semibold text-gray-900">Popular Materials</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {popularMaterials.slice(0, 4).map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                selected={selectedMaterial === material.id}
                onSelect={onMaterialSelect}
                showPricing={showPricing}
                showDetails={showDetails === material.id}
                onToggleDetails={() => setShowDetails(showDetails === material.id ? null : material.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Materials */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          {selectedCategory === 'all' ? 'All Materials' : MATERIAL_CATEGORIES.find(c => c.id === selectedCategory)?.name}
          <span className="text-gray-500 font-normal ml-2">({filteredMaterials.length})</span>
        </h3>
      </div>

      <ScrollArea className="h-96">
        <div className="grid grid-cols-2 gap-3 pr-4">
          {filteredMaterials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              selected={selectedMaterial === material.id}
              onSelect={onMaterialSelect}
              showPricing={showPricing}
              showDetails={showDetails === material.id}
              onToggleDetails={() => setShowDetails(showDetails === material.id ? null : material.id)}
            />
          ))}
        </div>
      </ScrollArea>

      {filteredMaterials.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No materials found</p>
          <Button
            variant="link"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="mt-2"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

interface MaterialCardProps {
  material: Material;
  selected: boolean;
  onSelect: (id: string) => void;
  showPricing: boolean;
  showDetails: boolean;
  onToggleDetails: () => void;
}

function MaterialCard({
  material,
  selected,
  onSelect,
  showPricing,
  showDetails,
  onToggleDetails,
}: MaterialCardProps) {
  return (
    <Card
      className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
        selected ? 'ring-2 ring-blue-500 shadow-md' : ''
      }`}
      onClick={() => onSelect(material.id)}
    >
      {/* Material Preview */}
      <div
        className="w-full h-24 bg-gradient-to-br relative"
        style={{
          background: `linear-gradient(135deg, ${material.baseColor} 0%, ${material.baseColor}dd 100%)`,
        }}
      >
        {material.popular && (
          <div className="absolute top-2 right-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          </div>
        )}
        {selected && (
          <div className="absolute top-2 left-2 bg-blue-500 rounded-full p-1">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Material Info */}
      <div className="p-3">
        <h4 className="font-semibold text-sm text-gray-900 mb-1">{material.name}</h4>
        
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs capitalize">
            {material.category}
          </Badge>
          
          {showPricing && material.price !== undefined && (
            <span className="text-xs font-medium text-gray-700">
              +${material.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Material Properties */}
        <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-gray-400 mr-1" />
            R: {Math.round(material.roughness * 100)}%
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-gray-400 mr-1" />
            M: {Math.round(material.metalness * 100)}%
          </div>
        </div>

        {/* Description */}
        {showDetails && material.description && (
          <p className="mt-2 text-xs text-gray-600 leading-relaxed">
            {material.description}
          </p>
        )}

        {/* Details Toggle */}
        {material.description && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onToggleDetails();
            }}
          >
            <Info className="w-3 h-3 mr-1" />
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        )}
      </div>
    </Card>
  );
}
