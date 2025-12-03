/**
 * Marketplace Templates API
 * MK-001 à MK-005: API pour les templates du marketplace
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import type { Template, TemplateCategory } from '@/lib/marketplace/types';

// Query params validation
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(12),
  query: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  sortBy: z.enum(['popular', 'newest', 'price_asc', 'price_desc', 'rating']).default('popular'),
  freeOnly: z.string().optional(),
  creatorId: z.string().optional(),
  featured: z.string().optional(),
});

// Mock templates data
const MOCK_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'T-Shirt Streetwear Pack',
    description: 'Collection de 12 designs streetwear pour t-shirts',
    slug: 't-shirt-streetwear-pack',
    previewImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    previewImages: [],
    category: 'apparel',
    tags: ['streetwear', 'urban', 'fashion'],
    price: 29,
    currency: 'EUR',
    isPremium: true,
    isFeatured: true,
    creatorId: 'c1',
    creator: { id: 'c1', name: 'DesignMaster', username: 'designmaster', verified: true },
    downloads: 1234,
    views: 8567,
    likes: 456,
    rating: 4.8,
    reviewCount: 89,
    format: 'json',
    dimensions: { width: 4000, height: 4000 },
    fileSize: 2500000,
    compatibility: ['luneo', 'photoshop'],
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 28 * 24 * 60 * 60 * 1000,
    status: 'published',
  },
  {
    id: '2',
    name: 'Minimalist Logo Kit',
    description: 'Templates de logos minimalistes éditables',
    slug: 'minimalist-logo-kit',
    previewImage: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400',
    previewImages: [],
    category: 'digital',
    tags: ['logo', 'minimal', 'branding'],
    price: 0,
    currency: 'EUR',
    isPremium: false,
    isFeatured: false,
    creatorId: 'c2',
    creator: { id: 'c2', name: 'LogoLab', username: 'logolab', verified: false },
    downloads: 5678,
    views: 23456,
    likes: 1234,
    rating: 4.5,
    reviewCount: 234,
    format: 'svg',
    dimensions: { width: 1000, height: 1000 },
    fileSize: 500000,
    compatibility: ['luneo', 'illustrator'],
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 58 * 24 * 60 * 60 * 1000,
    status: 'published',
  },
  {
    id: '3',
    name: 'Social Media Bundle',
    description: '50+ templates pour Instagram, Facebook et LinkedIn',
    slug: 'social-media-bundle',
    previewImage: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400',
    previewImages: [],
    category: 'social',
    tags: ['social', 'instagram', 'marketing'],
    price: 49,
    currency: 'EUR',
    isPremium: true,
    isFeatured: true,
    creatorId: 'c3',
    creator: { id: 'c3', name: 'SocialPro', username: 'socialpro', verified: true },
    downloads: 3456,
    views: 15678,
    likes: 890,
    rating: 4.9,
    reviewCount: 167,
    format: 'json',
    dimensions: { width: 1080, height: 1080 },
    fileSize: 8000000,
    compatibility: ['luneo', 'canva'],
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now(),
    publishedAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
    status: 'published',
  },
  // Add more mock templates...
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const validation = querySchema.safeParse(params);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { page, pageSize, query, category, tags, minPrice, maxPrice, rating, sortBy, freeOnly, creatorId, featured } = validation.data;

    let filteredTemplates = [...MOCK_TEMPLATES];

    // Filter by featured
    if (featured === 'true') {
      filteredTemplates = filteredTemplates.filter((t) => t.isFeatured);
    }

    // Filter by search query
    if (query) {
      const searchLower = query.toLowerCase();
      filteredTemplates = filteredTemplates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower) ||
          t.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filter by category
    if (category) {
      filteredTemplates = filteredTemplates.filter((t) => t.category === category);
    }

    // Filter by tags
    if (tags) {
      const tagList = tags.split(',').map((t) => t.trim().toLowerCase());
      filteredTemplates = filteredTemplates.filter((t) =>
        tagList.some((tag) => t.tags.includes(tag))
      );
    }

    // Filter by price range
    if (minPrice !== undefined) {
      filteredTemplates = filteredTemplates.filter((t) => t.price >= minPrice);
    }
    if (maxPrice !== undefined) {
      filteredTemplates = filteredTemplates.filter((t) => t.price <= maxPrice);
    }

    // Filter free only
    if (freeOnly === 'true') {
      filteredTemplates = filteredTemplates.filter((t) => t.price === 0);
    }

    // Filter by rating
    if (rating) {
      filteredTemplates = filteredTemplates.filter((t) => t.rating >= rating);
    }

    // Filter by creator
    if (creatorId) {
      filteredTemplates = filteredTemplates.filter((t) => t.creatorId === creatorId);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filteredTemplates.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'price_asc':
        filteredTemplates.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filteredTemplates.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filteredTemplates.sort((a, b) => b.rating - a.rating);
        break;
      case 'popular':
      default:
        filteredTemplates.sort((a, b) => b.downloads - a.downloads);
        break;
    }

    // Pagination
    const total = filteredTemplates.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedTemplates = filteredTemplates.slice(start, end);

    logger.info('Marketplace templates fetched', { total, page, pageSize, filters: params });

    return NextResponse.json({
      success: true,
      items: paginatedTemplates,
      total,
      page,
      pageSize,
      hasMore: end < total,
    });
  } catch (error) {
    logger.error('Marketplace templates error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


