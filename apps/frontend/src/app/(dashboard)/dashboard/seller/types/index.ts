/**
 * Types pour Seller Dashboard
 */

export type SellerAccountStatus = 'pending' | 'active' | 'restricted' | 'rejected';
export type SellerVerificationStatus = 'unverified' | 'pending' | 'verified';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';
export type Period = '7d' | '30d' | '90d' | '1y';

export interface SellerStatus {
  accountId?: string;
  status?: SellerAccountStatus;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  requirements?: {
    currentlyDue: string[];
    eventuallyDue: string[];
    pastDue: string[];
  };
  commissionRate?: number;
  verificationStatus?: SellerVerificationStatus;
}

export interface SellerStats {
  totalSales: number;
  totalRevenue: number;
  pendingPayout: number;
  availableBalance: number;
  totalTemplates: number;
  activeProducts: number;
  averageRating: number;
  totalReviews: number;
  thisMonthSales: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowth: number;
  ordersCount: number;
  pendingOrders: number;
  completedOrders: number;
  refundsCount: number;
  refundsAmount: number;
}

export interface SellerProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  sales: number;
  revenue: number;
  stock: number;
  status: 'active' | 'draft' | 'archived';
  rating: number;
  reviewsCount: number;
  createdAt: string;
}

export interface SellerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  productName: string;
  productImage: string;
  quantity: number;
  total: number;
  commission: number;
  status: OrderStatus;
  createdAt: string;
  shippingAddress?: string;
}

export interface SellerReview {
  id: string;
  customerName: string;
  customerAvatar?: string;
  productName: string;
  productImage: string;
  rating: number;
  comment: string;
  createdAt: string;
  response?: string;
  responseDate?: string;
}

export interface Payout {
  id: string;
  amount: number;
  status: PayoutStatus;
  scheduledDate: string;
  paidDate?: string;
  description: string;
}


