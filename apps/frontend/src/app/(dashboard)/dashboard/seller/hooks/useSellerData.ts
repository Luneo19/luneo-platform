/**
 * Hook personnalisé pour gérer les données seller
 */

import { useState, useEffect } from 'react';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import type {
  SellerStatus,
  SellerStats,
  SellerProduct,
  SellerOrder,
  SellerReview,
  Payout,
} from '../types';

export function useSellerData() {
  const [sellerStatus, setSellerStatus] = useState<SellerStatus | null>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSellerStatus();
    fetchSellerStats();
    fetchProducts();
    fetchOrders();
    fetchReviews();
    fetchPayouts();
  }, []);

  const fetchSellerStatus = async () => {
    try {
      const data = await api.get<{ data?: SellerStatus } | SellerStatus>('/api/v1/marketplace/seller/connect');
      setSellerStatus((data as { data?: SellerStatus })?.data ?? (data as SellerStatus));
    } catch (error) {
      logger.error('Failed to fetch seller status:', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSellerStats = async () => {
    try {
      const data = await api.get<{ data?: SellerStats } | SellerStats>('/api/v1/marketplace/seller/stats');
      setStats((data as { data?: SellerStats })?.data ?? (data as SellerStats) ?? null);
    } catch (error) {
      logger.error('Failed to fetch seller stats:', { error });
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await api.get<{ data?: SellerProduct[]; products?: SellerProduct[] }>('/api/v1/marketplace/seller/products');
      setProducts((data as { data?: SellerProduct[] })?.data ?? (data as { products?: SellerProduct[] }).products ?? []);
    } catch (error) {
      logger.error('Failed to fetch products:', { error });
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await api.get<{ data?: SellerOrder[]; orders?: SellerOrder[] }>('/api/v1/marketplace/seller/orders');
      const list = (data as { data?: SellerOrder[] })?.data ?? (data as { orders?: SellerOrder[] }).orders ?? [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (error) {
      logger.error('Failed to fetch orders:', { error });
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await api.get<{ data?: SellerReview[]; reviews?: SellerReview[] }>('/api/v1/marketplace/seller/reviews');
      const list = (data as { data?: SellerReview[] })?.data ?? (data as { reviews?: SellerReview[] }).reviews ?? [];
      setReviews(Array.isArray(list) ? list : []);
    } catch (error) {
      logger.error('Failed to fetch reviews:', { error });
    }
  };

  const fetchPayouts = async () => {
    try {
      const data = await api.get<{ data?: Payout[]; payouts?: Payout[] }>('/api/v1/marketplace/seller/payouts');
      const list = (data as { data?: Payout[] })?.data ?? (data as { payouts?: Payout[] }).payouts ?? [];
      setPayouts(Array.isArray(list) ? list : []);
    } catch (error) {
      logger.error('Failed to fetch payouts:', { error });
    }
  };

  const refetch = () => {
    setIsLoading(true);
    Promise.all([
      fetchSellerStatus(),
      fetchSellerStats(),
      fetchProducts(),
      fetchOrders(),
      fetchReviews(),
      fetchPayouts(),
    ]).finally(() => setIsLoading(false));
  };

  return {
    sellerStatus,
    stats,
    products,
    orders,
    reviews,
    payouts,
    isLoading,
    refetch,
  };
}



