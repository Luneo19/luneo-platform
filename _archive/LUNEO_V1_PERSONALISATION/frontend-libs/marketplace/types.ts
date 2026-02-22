/**
 * Marketplace Types
 * MK-001 à MK-015: Types pour le marketplace de templates
 */

// Template
export interface Template {
  id: string;
  name: string;
  description: string;
  slug: string;
  previewImage: string;
  previewImages: string[];
  category: TemplateCategory;
  tags: string[];
  price: number; // 0 for free
  currency: string;
  isPremium: boolean;
  isFeatured: boolean;
  
  // Creator info
  creatorId: string;
  creator: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    verified: boolean;
  };
  
  // Stats
  downloads: number;
  views: number;
  likes: number;
  rating: number;
  reviewCount: number;
  
  // Technical
  format: 'json' | 'svg' | 'psd';
  dimensions: { width: number; height: number };
  fileSize: number;
  compatibility: string[];
  
  // Metadata
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  status: 'draft' | 'pending' | 'published' | 'rejected';
}

// Categories
export type TemplateCategory =
  | 'apparel'
  | 'accessories'
  | 'home'
  | 'print'
  | 'packaging'
  | 'digital'
  | 'marketing'
  | 'social'
  | 'other';

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, { name: string; icon: string }> = {
  apparel: { name: 'Vêtements', icon: '👕' },
  accessories: { name: 'Accessoires', icon: '👜' },
  home: { name: 'Maison', icon: '🏠' },
  print: { name: 'Impression', icon: '🖨️' },
  packaging: { name: 'Packaging', icon: '📦' },
  digital: { name: 'Digital', icon: '💻' },
  marketing: { name: 'Marketing', icon: '📢' },
  social: { name: 'Réseaux sociaux', icon: '📱' },
  other: { name: 'Autre', icon: '✨' },
};

// Review
export interface Review {
  id: string;
  templateId: string;
  userId: string;
  user: {
    name: string;
    avatar?: string;
  };
  rating: number; // 1-5
  title: string;
  content: string;
  helpful: number;
  createdAt: number;
  verified: boolean; // Purchased the template
}

// Creator Profile
export interface CreatorProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  website?: string;
  social: {
    twitter?: string;
    instagram?: string;
    dribbble?: string;
  };
  verified: boolean;
  
  // Stats
  templates: number;
  totalSales: number;
  totalEarnings: number;
  followers: number;
  following: number;
  rating: number;
  
  // Stripe Connect
  stripeConnectId?: string;
  payoutEnabled: boolean;
  
  createdAt: number;
}

// Collection
export interface Collection {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  creatorId: string;
  templateIds: string[];
  isPublic: boolean;
  isFeatured: boolean;
  createdAt: number;
}

// Purchase
export interface Purchase {
  id: string;
  templateId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  commission: number; // Platform commission
  sellerEarnings: number;
  currency: string;
  status: 'pending' | 'completed' | 'refunded';
  stripePaymentId?: string;
  createdAt: number;
}

// Payout
export interface Payout {
  id: string;
  creatorId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stripeTransferId?: string;
  createdAt: number;
  completedAt?: number;
}

// Search filters
export interface MarketplaceFilters {
  query?: string;
  category?: TemplateCategory;
  tags?: string[];
  priceRange?: { min: number; max: number };
  rating?: number;
  sortBy?: 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'rating';
  freeOnly?: boolean;
  creatorId?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Share Link
export interface ShareLink {
  id: string;
  templateId: string;
  creatorId: string;
  token: string;
  url: string;
  expiresAt?: number;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: number;
}


