/**
 * Shared Types
 * Types partagés pour l'application
 */

export enum UserRole {
  CONSUMER = 'CONSUMER',
  BRAND_USER = 'BRAND_USER',
  BRAND_ADMIN = 'BRAND_ADMIN',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  FABRICATOR = 'FABRICATOR',
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  avatar?: string;
  role: UserRole | string;
  isActive: boolean;
  emailVerified: boolean;
  brandId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Design {
  id: string;
  name: string;
  prompt?: string;
  promptHash?: string;
  previewUrl?: string;
  highResUrl?: string;
  costCents?: number;
  status: string;
  productId?: string;
  brandId?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DesignSummary {
  id: string;
  name: string;
  previewUrl?: string;
  status: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  captchaToken?: string;
}

export interface ApiKeySummary {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsedAt?: string;
  isActive: boolean;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
}

export interface ProductRecord {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  images?: string[];
  isActive: boolean;
  createdAt: string;
}

export interface AnalyticsOverview {
  totalDesigns: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
  periodStart: string;
  periodEnd: string;
}


