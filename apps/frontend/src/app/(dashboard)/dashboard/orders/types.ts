/**
 * Types stricts pour la page Orders
 * Pas de `any` autorisé
 */

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string;
  product_name: string;
  design_name?: string;
  design_preview_url?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  production_status?: string;
}

export interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  phone?: string;
  state?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name?: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  currency: string;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
  tracking_number?: string;
  payment_method?: string;
  shipping_method?: string;
  shipping_address?: ShippingAddress;
  items?: OrderItem[];
}

export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
  avgOrderValue: number;
}

export interface OrderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface OrderFilters {
  status: string;
  search: string;
  startDate: string;
  endDate: string;
}

