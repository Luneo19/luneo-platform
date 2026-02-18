'use client';

/**
 * Add to Cart button in AR: calls API, shows confirmation, tracks conversion.
 * @module ar/ecommerce/AddToCartAR
 */

import React, { useState } from 'react';
import { logger } from '@/lib/logger';

export interface AddToCartARProps {
  productId: string;
  productName: string;
  variantId?: string;
  quantity?: number;
  onAddToCart?: (productId: string, quantity: number) => Promise<void>;
  onConversionTrack?: (action: string, value?: number) => void;
  className?: string;
  children?: React.ReactNode;
}

/**
 * React component: Add to Cart button for AR view with API and conversion tracking.
 */
export function AddToCartAR({
  productId,
  productName,
  variantId,
  quantity = 1,
  onAddToCart,
  onConversionTrack,
  className = '',
  children,
}: AddToCartARProps): React.ReactElement {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleClick = async (): Promise<void> => {
    setLoading(true);
    try {
      if (onAddToCart) {
        await onAddToCart(productId, quantity);
      } else {
        // Default: call backend API
        const base = typeof window !== 'undefined' ? window.location.origin : '';
        const res = await fetch(`${base}/api/v1/cart/items`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            variantId,
            quantity,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      setConfirmed(true);
      onConversionTrack?.('add_to_cart');
      logger.info('AddToCartAR: added', { productId, quantity });
    } catch (err) {
      logger.error('AddToCartAR: failed', err as Error, { productId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`ar-add-to-cart ${className}`}
      style={{
        position: 'absolute',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || confirmed}
        aria-label={`Add ${productName} to cart`}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: 600,
          borderRadius: '8px',
          border: 'none',
          background: confirmed ? '#22c55e' : '#3b82f6',
          color: '#fff',
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {confirmed ? 'Added to cart' : loading ? 'Adding…' : children ?? 'Add to Cart'}
      </button>
    </div>
  );
}
