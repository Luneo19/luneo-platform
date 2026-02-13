/**
 * ★★★ TYPES - COMMANDES ★★★
 * Types TypeScript complets pour les commandes
 */

// ========================================
// ENUMS
// ========================================

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  PRODUCTION = 'PRODUCTION',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum ShippingStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
}

// ========================================
// TYPES DE BASE
// ========================================

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  customizationId?: string;
  designId?: string;
  quantity: number;
  price: number;
  totalPrice: number;
  metadata?: Record<string, unknown>;
}

export interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
  state?: string;
}

export interface BillingAddress extends ShippingAddress {
  company?: string;
  taxId?: string;
}

export interface Order {
  id: string;
  userId: string;
  brandId?: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  totalAmount: number;
  currency: string;
  shippingAddress: ShippingAddress;
  billingAddress?: BillingAddress;
  paymentMethodId?: string;
  paymentIntentId?: string;
  trackingNumber?: string;
  shippingProvider?: string;
  customerNotes?: string;
  internalNotes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
}

// ========================================
// TYPES API
// ========================================

export interface CreateOrderRequest {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  billingAddress?: BillingAddress;
  paymentMethodId?: string;
  customerNotes?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  trackingNumber?: string;
  shippingProvider?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface OrderListRequest {
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  hasMore: boolean;
}

// ========================================
// TYPES PRODUCTION
// ========================================

export interface ProductionFile {
  id: string;
  orderId: string;
  itemId: string;
  format: 'pdf' | 'png' | 'jpg' | 'stl' | 'obj' | 'glb';
  quality: 'standard' | 'high' | 'print-ready';
  url: string;
  size: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ProductionFileRequest {
  orderId: string;
  itemId: string;
  format: 'pdf' | 'png' | 'jpg' | 'stl' | 'obj' | 'glb';
  quality?: 'standard' | 'high' | 'print-ready';
  options?: {
    cmyk?: boolean;
    resolution?: number;
    colorProfile?: string;
  };
}

export interface ProductionJob {
  id: string;
  orderId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  files: ProductionFile[];
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// ========================================
// TYPES POD
// ========================================

export interface PODOrder {
  id: string;
  orderId: string;
  provider: 'printful' | 'printify' | 'gelato';
  podOrderId: string;
  status: string;
  trackingUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ========================================

