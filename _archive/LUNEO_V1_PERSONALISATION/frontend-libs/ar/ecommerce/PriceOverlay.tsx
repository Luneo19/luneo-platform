'use client';

/**
 * Price overlay in AR view: product name, price, discount.
 * Positioned at bottom/top of AR view; use with CSS2DRenderer for HTML in 3D if needed.
 * @module ar/ecommerce/PriceOverlay
 */

import React from 'react';

export interface PriceOverlayProps {
  productName: string;
  price: string;
  discount?: string;
  position?: 'bottom' | 'top';
  className?: string;
}

/**
 * React component: floating price display for AR view.
 */
export function PriceOverlay({
  productName,
  price,
  discount,
  position = 'bottom',
  className = '',
}: PriceOverlayProps): React.ReactElement {
  return (
    <div
      className={`ar-price-overlay ar-price-overlay--${position} ${className}`}
      role="region"
      aria-label={`Product price: ${productName}, ${price}`}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        [position]: 0,
        padding: '12px 16px',
        background: 'rgba(0,0,0,0.7)',
        color: '#fff',
        fontSize: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        zIndex: 10,
      }}
    >
      <span className="ar-price-overlay__name" style={{ fontWeight: 600 }}>
        {productName}
      </span>
      <span className="ar-price-overlay__price" style={{ fontSize: '18px' }}>
        {price}
      </span>
      {discount ? (
        <span className="ar-price-overlay__discount" style={{ color: '#86efac' }}>
          {discount}
        </span>
      ) : null}
    </div>
  );
}
