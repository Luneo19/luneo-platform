'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List, Download, Eye, Sparkles, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import Image from 'next/image';
import { logger } from '@/lib/logger';

interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  description: string;
  tags: string[];
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = ['all', 'business', 'social', 'print', 'web', 'branding'];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/templates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || data || []);
      } else if (response.status === 404) {
        // Fallback to mock data if endpoint doesn't exist yet
        setTemplates([
          {
            id: '1',
            name: 'Business Card Classic',
            category: 'business',
            thumbnail: '/templates/business-card-1.jpg',
            description: 'Design professionnel pour cartes de visite',
            tags: ['business', 'professional', 'minimalist']
          },
          {
            id: '2',
            name: 'Social Media Post',
            category: 'social',
            thumbnail: '/templates/social-post-1.jpg',
            description: 'Template pour posts réseaux sociaux',
            tags: ['social', 'marketing', 'modern']
          },
        ]);
      } else {
        throw new Error('Failed to load templates');
      }
    } catch (error) {
      logger.error('Error loading templates', {
        error,
        searchQuery,
        selectedCategory,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      // Fallback to mock data on error
      setTemplates([
        {
          id: '1',
          name: 'Business Card Classic',
          category: 'business',
          thumbnail: '/templates/business-card-1.jpg',
          description: 'Design professionnel pour cartes de visite',
          tags: ['business', 'professional', 'minimalist']
        },
        {
          id: '2',
          name: 'Social Media Post',
          category: 'social',
          thumbnail: '/templates/social-post-1.jpg',
          description: 'Template pour posts réseaux sociaux',
          tags: ['social', 'marketing', 'modern']
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Chargement des templates...</p>
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
          <p className="text-gray-400">Choisissez parmi notre collection de templates professionnels</p>
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
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-gray-400">{filteredTemplates.length} templates trouvés</p>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gray-800 border-gray-700 overflow-hidden hover:border-blue-500 transition-colors">
                  <div className="aspect-video bg-gray-700 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-12 h-12 text-gray-500" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-1">{template.name}</h3>
                    <p className="text-gray-400 text-sm mb-3">{template.description}</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Eye className="w-4 h-4 mr-2" />
                        Prévisualiser
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-gray-800 border-gray-700 p-4 hover:border-blue-500 transition-colors">
                  <div className="flex gap-4">
                    <div className="w-32 h-20 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-8 h-8 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">{template.name}</h3>
                      <p className="text-gray-400 text-sm mb-2">{template.description}</p>
                      <div className="flex gap-2">
                        {template.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Prévisualiser
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Aucun template trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}

