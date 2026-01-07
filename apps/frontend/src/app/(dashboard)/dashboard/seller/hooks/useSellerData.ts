/**
 * Hook personnalisé pour gérer les données seller
 */

import { useState, useEffect } from 'react';
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
      const response = await fetch('/api/marketplace/seller/connect');
      const data = await response.json();
      setSellerStatus(data.data || data);
    } catch (error) {
      logger.error('Failed to fetch seller status:', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSellerStats = async () => {
    try {
      const response = await fetch('/api/marketplace/seller/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || data);
      }
    } catch (error) {
      logger.error('Failed to fetch seller stats:', { error });
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/marketplace/seller/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data || data.products || []);
      }
    } catch (error) {
      logger.error('Failed to fetch products:', { error });
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/marketplace/seller/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || data.orders || []);
      }
    } catch (error) {
      logger.error('Failed to fetch orders:', { error });
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/marketplace/seller/reviews');
      if (response.ok) {
        const data = await response.json();
        setReviews(data.data || data.reviews || []);
      }
    } catch (error) {
      logger.error('Failed to fetch reviews:', { error });
    }
  };

  const fetchPayouts = async () => {
    try {
      const response = await fetch('/api/marketplace/seller/payouts');
      if (response.ok) {
        const data = await response.json();
        setPayouts(data.data || data.payouts || []);
      }
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


