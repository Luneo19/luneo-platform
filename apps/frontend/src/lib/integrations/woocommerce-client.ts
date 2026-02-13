/**
 * ★★★ WOOCOMMERCE CLIENT ★★★
 * Client pour interagir avec l'API WooCommerce
 */

import { logger } from '@/lib/logger';

export interface WooCommerceShop {
  name: string;
  url: string;
  version: string;
  currency: string;
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: string;
  sku?: string;
  status?: string;
  images?: Array<{
    src: string;
  }>;
}

export interface WooCommerceRawOrder {
  id: number;
  [key: string]: unknown;
}

/**
 * Vérifie les credentials WooCommerce
 */
export async function verifyWooCommerceCredentials(
  shopDomain: string,
  consumerKey: string,
  consumerSecret: string
): Promise<WooCommerceShop> {
  try {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const response = await fetch(`${shopDomain}/wp-json/wc/v3/system_status`, {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      name: data.settings?.store_name || 'WooCommerce Store',
      url: shopDomain,
      version: data.environment?.version || 'unknown',
      currency: data.settings?.currency || 'USD',
    };
  } catch (error: unknown) {
    logger.error('Error verifying WooCommerce credentials', { error, shopDomain });
    throw error;
  }
}

/**
 * Récupère les produits WooCommerce
 */
export async function getWooCommerceProducts(
  shopDomain: string,
  consumerKey: string,
  consumerSecret: string,
  limit: number = 50
): Promise<WooCommerceProduct[]> {
  try {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const response = await fetch(
      `${shopDomain}/wp-json/wc/v3/products?per_page=${limit}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.statusText}`);
    }

    const products = await response.json();
    return products || [];
  } catch (error: unknown) {
    logger.error('Error fetching WooCommerce products', { error, shopDomain });
    throw error;
  }
}

/**
 * Récupère les commandes WooCommerce
 */
export async function getWooCommerceOrders(
  shopDomain: string,
  consumerKey: string,
  consumerSecret: string,
  limit: number = 50
): Promise<WooCommerceRawOrder[]> {
  try {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const response = await fetch(
      `${shopDomain}/wp-json/wc/v3/orders?per_page=${limit}&status=any`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.statusText}`);
    }

    const orders = await response.json();
    return orders || [];
  } catch (error: unknown) {
    logger.error('Error fetching WooCommerce orders', { error, shopDomain });
    throw error;
  }
}
