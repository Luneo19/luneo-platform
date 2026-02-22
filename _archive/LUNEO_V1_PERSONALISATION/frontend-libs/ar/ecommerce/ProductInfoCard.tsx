'use client';

/**
 * Product info card in AR: name, price, variant selector.
 * Connects to VariantSwitcher for variant changes.
 * @module ar/ecommerce/ProductInfoCard
 */

import React from 'react';
import type { VariantSwitcher } from './VariantSwitcher';

export interface ProductVariant {
  id: string;
  name: string;
  modelUrl?: string;
  price?: string;
}

export interface ProductInfoCardProps {
  productName: string;
  price: string;
  discount?: string;
  variants?: ProductVariant[];
  variantSwitcher?: VariantSwitcher | null;
  onVariantSelect?: (variant: ProductVariant) => void;
  position?: 'bottom' | 'top';
  className?: string;
}

/**
 * React component: floating product info with variant selector for AR.
 */
export function ProductInfoCard({
  productName,
  price,
  discount,
  variants,
  variantSwitcher,
  onVariantSelect,
  position = 'bottom',
  className = '',
}: ProductInfoCardProps): React.ReactElement {
  const handleVariantClick = (v: ProductVariant): void => {
    if (v.modelUrl && variantSwitcher) {
      variantSwitcher.switchVariant(v.modelUrl);
    }
    onVariantSelect?.(v);
  };

  return (
    <div
      className={`ar-product-info-card ${className}`}
      role="region"
      aria-label={`Product: ${productName}`}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        [position]: 0,
        padding: '16px',
        background: 'rgba(0,0,0,0.75)',
        color: '#fff',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontWeight: 600 }}>{productName}</span>
        <span style={{ fontSize: '18px' }}>{price}</span>
        {discount ? <span style={{ color: '#86efac' }}>{discount}</span> : null}
      </div>
      {variants && variants.length > 0 ? (
        <div className="ar-product-info-card__variants" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {variants.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => handleVariantClick(v)}
              aria-label={`Variant ${v.name}`}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.5)',
                background: 'transparent',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {v.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
