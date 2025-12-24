/**
 * ★★★ SHOPIFY CLIENT ★★★
 * Client pour interagir avec l'API Shopify
 */

import { logger } from '@/lib/logger';

export interface ShopifyShop {
  id: number;
  name: string;
  domain: string;
  email: string;
  currency: string;
  timezone: string;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  variants: Array<{
    id: number;
    price: string;
    sku?: string;
  }>;
}

/**
 * Vérifie un access token Shopify
 */
export async function verifyShopifyToken(
  shopDomain: string,
  accessToken: string
): Promise<ShopifyShop> {
  try {
    const response = await fetch(`https://${shopDomain}/admin/api/2024-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.shop;
  } catch (error: any) {
    logger.error('Error verifying Shopify token', { error, shopDomain });
    throw error;
  }
}

/**
 * Récupère les produits Shopify
 */
export async function getShopifyProducts(
  shopDomain: string,
  accessToken: string,
  limit: number = 50
): Promise<ShopifyProduct[]> {
  try {
    const response = await fetch(
      `https://${shopDomain}/admin/api/2024-10/products.json?limit=${limit}`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.products || [];
  } catch (error: any) {
    logger.error('Error fetching Shopify products', { error, shopDomain });
    throw error;
  }
}

/**
 * Récupère les commandes Shopify
 */
export async function getShopifyOrders(
  shopDomain: string,
  accessToken: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const response = await fetch(
      `https://${shopDomain}/admin/api/2024-10/orders.json?limit=${limit}&status=any`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.orders || [];
  } catch (error: any) {
    logger.error('Error fetching Shopify orders', { error, shopDomain });
    throw error;
  }
}

